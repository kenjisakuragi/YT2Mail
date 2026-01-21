import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { downloadAudio } from '../lib/youtube/download';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `
You are an expert business analyst.
Your task is to analyze the provided YouTube video audio and extract key business insights.
Language: Japanese (Output must be in Japanese).

Output Format:
Please output the analysis in the following format. Do not use JSON. Use the exact headers below.

[TRANSCRIPT_START]
(Full transcript of the audio here)
[TRANSCRIPT_END]

[SUMMARY_START]
=== BUSINESS_OVERVIEW ===
(何を売っている、どんなビジネスモデルか？)

=== KEY_METRICS ===
(月商、利益率、初期費用など)

=== ACQUISITION_STRATEGY ===
(最初の10〜100人のお客様をどう獲得したか)

=== TOOLS_USED ===
(Shopify, Beehiiv, No-codeツール等のスタック)

=== JAPAN_APPLICATION ===
(この事例を日本市場で展開するための具体的なヒント)

=== DETAILED_ARTICLE ===
(読者が没入して読める、3000〜4000文字程度のブログ記事形式の長文)
[SUMMARY_END]
`;

function extractSection(text: string, header: string): string {
    const regex = new RegExp(`=== ${header} ===\\s*([\\s\\S]*?)(?=(=== [A-Z_]+ ===|\\[SUMMARY_END\\]))`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
}

function parseGeminiTextResponse(text: string) {
    const transcriptMatch = text.match(/\[TRANSCRIPT_START\]([\s\S]*?)\[TRANSCRIPT_END\]/);
    const transcript = transcriptMatch ? transcriptMatch[1].trim() : '';

    const summarySectionMatch = text.match(/\[SUMMARY_START\]([\s\S]*?)\[SUMMARY_END\]/);
    const summaryText = summarySectionMatch ? summarySectionMatch[1] : text;

    return {
        transcript,
        summary: {
            business_overview: extractSection(summaryText, 'BUSINESS_OVERVIEW'),
            key_metrics: extractSection(summaryText, 'KEY_METRICS'),
            acquisition_strategy: extractSection(summaryText, 'ACQUISITION_STRATEGY'),
            tools_used: extractSection(summaryText, 'TOOLS_USED'),
            japan_application: extractSection(summaryText, 'JAPAN_APPLICATION'),
            detailed_article: extractSection(summaryText, 'DETAILED_ARTICLE')
        }
    };
}

async function importChannelVideos(channelId: string, maxVideos: number = 10) {
    console.log('=== Importing Videos from Channel ===\n');

    // Get channel info from database
    const { data: channel } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('channel_id', channelId)
        .single();

    if (!channel) {
        console.error('❌ Channel not found in database. Please add it first.');
        console.log('   Run: npx tsx scripts/add-channel.ts <channel_url>');
        process.exit(1);
    }

    console.log(`Channel: ${channel.channel_name}`);
    console.log(`Category: ${channel.category}\n`);

    // Get latest videos from YouTube
    console.log(`Fetching latest ${maxVideos} videos...`);
    const response = await youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        order: 'date',
        type: ['video'],
        maxResults: maxVideos,
        videoDuration: 'medium' // Exclude shorts
    });

    const videos = response.data.items || [];
    console.log(`Found ${videos.length} videos\n`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const video of videos) {
        const videoId = video.id?.videoId;
        if (!videoId) continue;

        const title = video.snippet?.title || '';
        console.log(`\n[${processed + skipped + failed + 1}/${videos.length}] ${title}`);

        // Check if already processed
        const { data: existing } = await supabase
            .from('videos')
            .select('id')
            .eq('yt_video_id', videoId)
            .single();

        if (existing) {
            console.log('  ⏭️  Already processed, skipping...');
            skipped++;
            continue;
        }

        try {
            // Download audio
            console.log('  📥 Downloading audio...');
            const audioPath = await downloadAudio(videoId);

            if (!fs.existsSync(audioPath)) {
                throw new Error('Audio file not found');
            }

            const stats = fs.statSync(audioPath);
            console.log(`  📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

            // Determine MIME type
            const ext = path.extname(audioPath).toLowerCase();
            const mimeType = ext === '.webm' ? 'audio/webm' :
                ext === '.mp3' ? 'audio/mp3' :
                    ext === '.mp4' ? 'audio/mp4' : 'audio/mp4';

            // Upload to Gemini
            console.log('  ☁️  Uploading to Gemini...');
            const uploadResult = await fileManager.uploadFile(audioPath, {
                mimeType: mimeType,
                displayName: `Audio ${videoId}`,
            });

            // Analyze with Gemini
            console.log('  🤖 Analyzing with Gemini...');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
            const result = await model.generateContent([
                SYSTEM_INSTRUCTION,
                { fileData: { fileUri: uploadResult.file.uri, mimeType: mimeType } }
            ]);

            const text = result.response.text();
            const parsed = parseGeminiTextResponse(text);

            if (!parsed.summary.business_overview && !parsed.transcript) {
                throw new Error('Failed to parse Gemini response');
            }

            // Save to database
            console.log('  💾 Saving to database...');
            const summaryWithTranscript = {
                ...parsed.summary,
                transcript: parsed.transcript || ''
            };

            const { error: insertError } = await supabase
                .from('videos')
                .insert({
                    yt_video_id: videoId,
                    title: title,
                    summary_json: summaryWithTranscript,
                    published_at: video.snippet?.publishedAt || new Date().toISOString(),
                    channel_id: channel.id
                });

            if (insertError) {
                throw insertError;
            }

            // Cleanup
            await fileManager.deleteFile(uploadResult.file.name);
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            console.log('  ✅ Processed successfully');
            processed++;

            // Rate limit pause
            await new Promise(r => setTimeout(r, 3000));

        } catch (error: any) {
            console.error(`  ❌ Error: ${error.message}`);
            failed++;
        }
    }

    // Update channel last_checked_at
    await supabase
        .from('youtube_channels')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', channel.id);

    console.log('\n=== Import Complete ===');
    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
}

// Command line usage
const channelId = process.argv[2];
const maxVideos = parseInt(process.argv[3] || '10');

if (!channelId) {
    console.log('Usage: npx tsx scripts/import-channel-videos.ts <channel_id> [max_videos]');
    console.log('\nExample:');
    console.log('  npx tsx scripts/import-channel-videos.ts "UCxxx..." 10');
    process.exit(1);
}

importChannelVideos(channelId, maxVideos);
