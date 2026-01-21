import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const summaryText = summarySectionMatch ? summarySectionMatch[1] : text; // Fallback to full text if tags missing

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

async function processExistingAudioFiles() {
    console.log('=== Processing Existing Audio Files (Text Mode) ===\n');

    const audioDir = './tmp_audio';
    const files = fs.readdirSync(audioDir).filter(f => /\.(m4a|mp4|webm|mp3)$/i.test(f));
    console.log(`Found ${files.length} audio files to process.\n`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const file of files) {
        const videoId = path.parse(file).name;
        const audioPath = path.join(audioDir, file);
        const stats = fs.statSync(audioPath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        // Skip Shorts (approx < 1.5MB for m4a audio)
        if (fileSizeInMB < 1.5) {
            // process.stdout.write('S'); // S for Short
            // skipped++;
            // continue;
            // Log it properly
            console.log(`\nSkipping (Short/Small): ${videoId} (${fileSizeInMB.toFixed(2)} MB)`);
            skipped++;
            continue;
        }

        // Check if already in DB
        const { data: existing } = await supabase
            .from('videos')
            .select('id')
            .eq('yt_video_id', videoId)
            .single();

        if (existing) {
            process.stdout.write('.');
            skipped++;
            continue;
        }

        console.log(`\nProcessing: ${videoId} (${file})`);

        // Determine MIME type
        const ext = path.extname(file).toLowerCase();
        let mimeType = 'audio/mp4';
        if (ext === '.mp3') mimeType = 'audio/mp3';
        if (ext === '.webm') mimeType = 'audio/webm';
        if (ext === '.aac') mimeType = 'audio/aac';
        if (ext === '.wav') mimeType = 'audio/wav';

        try {
            // Upload to Gemini
            console.log(`  Uploading... (${mimeType})`);
            const uploadResult = await fileManager.uploadFile(audioPath, {
                mimeType: mimeType,
                displayName: `Audio ${videoId}`,
            });

            // Generate content
            console.log('  Analyzing with Gemini (Text Mode)...');
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
            const result = await model.generateContent([
                SYSTEM_INSTRUCTION,
                { fileData: { fileUri: uploadResult.file.uri, mimeType: mimeType } }
            ]);

            const text = result.response.text();

            // Parse Text Response
            const parsed = parseGeminiTextResponse(text);

            // Validation: Check if we got at least some content
            if (!parsed.summary.business_overview && !parsed.transcript) {
                throw new Error('Failed to parse Gemini response structure');
            }

            // Save to DB (transcript stored in summary_json to avoid schema change)
            console.log('  Saving to database...');
            const summaryWithTranscript = {
                ...parsed.summary,
                transcript: parsed.transcript || ''
            };

            const { error: insertError } = await supabase
                .from('videos')
                .insert({
                    yt_video_id: videoId,
                    title: `Video ${videoId}`, // Will need to fetch from YouTube API later
                    summary_json: summaryWithTranscript,
                    published_at: new Date().toISOString(),
                });

            if (insertError) {
                console.error(`  DB Error: ${insertError.message}`);
                failed++;
            } else {
                console.log('  ✅ Saved!');
                processed++;
            }

            // Cleanup uploaded file
            await fileManager.deleteFile(uploadResult.file.name);

            // Rate limit pause (2 seconds for Tier 1)
            await new Promise(r => setTimeout(r, 2000));

        } catch (e: any) {
            console.error(`  ❌ Error: ${e.message}`);
            failed++;

            // If rate limited, wait longer
            if (e.message.includes('429')) {
                console.log('  Rate limited. Waiting 60s...');
                await new Promise(r => setTimeout(r, 60000));
            } else {
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    console.log('\n\n=== Import Complete ===');
    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
}

processExistingAudioFiles().catch(console.error);
