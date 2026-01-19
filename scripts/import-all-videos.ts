
import dotenv from 'dotenv';
// Load env vars immediately
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import fs from 'fs';

const youtube = google.youtube('v3');
const HANDLE = 'starterstory';

async function getAllVideos() {
    console.log('Starting FULL import (Text + Audio Fallback)...');

    // Dynamically import libraries
    const { supabaseAdmin } = await import('../lib/supabase/admin');
    const { getVideoTranscript } = await import('../lib/youtube/transcript');
    const { summarizeVideo, processVideoAudio } = await import('../lib/gemini/service');
    const { downloadAudio } = await import('../lib/youtube/download');

    if (!process.env.YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is missing');
    if (!supabaseAdmin) throw new Error('Supabase Admin client not initialized');

    // 0. Resolve Channel ID
    console.log(`Resolving channel ID for handle @${HANDLE}...`);
    const channelRes = await youtube.channels.list({
        key: process.env.YOUTUBE_API_KEY,
        part: ['id'],
        forHandle: `@${HANDLE}`
    });

    const channelId = channelRes.data.items?.[0]?.id;
    if (!channelId) throw new Error(`Could not find channel for handle @${HANDLE}`);
    console.log(`Found Channel ID: ${channelId}`);

    let nextPageToken: string | undefined = undefined;
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    do {
        const response: any = await youtube.search.list({
            key: process.env.YOUTUBE_API_KEY,
            channelId: channelId,
            part: ['snippet'],
            order: 'date',
            type: ['video'],
            maxResults: 50,
            pageToken: nextPageToken,
        });

        const videos = response.data.items || [];
        console.log(`Fetched ${videos.length} videos. Processing...`);

        for (const video of videos) {
            const videoId = video.id?.videoId;
            const title = video.snippet?.title;
            const publishedAt = video.snippet?.publishedAt;
            const thumbnailUrl = video.snippet?.thumbnails?.maxres?.url || video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url;

            if (!videoId || !title) continue;

            const { data: existing } = await supabaseAdmin
                .from('videos')
                .select('id')
                .eq('yt_video_id', videoId)
                .single();

            if (existing) {
                process.stdout.write('.');
                totalSkipped++;
                continue;
            }

            console.log(`\nProcessing: ${title} (${videoId})`);

            try {
                let summaryData;
                let fullTranscript = '';

                // Try Text Transcript First
                console.log('  - Trying text transcript...');
                const transcript = await getVideoTranscript(videoId);

                if (transcript && transcript.length > 100) {
                    console.log('  - Transcript found! Summarizing...');
                    fullTranscript = transcript;
                    await new Promise(r => setTimeout(r, 35000)); // Rate limit: 2 RPM for Gemini Flash/Pro Free Tier
                    summaryData = await summarizeVideo(transcript);
                } else {
                    // Fallback to Audio
                    console.log('  - Text failed. Switching to AUDIO analysis...');

                    const audioPath = await downloadAudio(videoId);
                    // Check if file exists (downloadAudio throws if fatal, but check anyway)
                    if (fs.existsSync(audioPath)) {
                        // Determine MIME type
                        const ext = audioPath.split('.').pop()?.toLowerCase();
                        let mimeType = 'audio/mp3';
                        if (ext === 'm4a') mimeType = 'audio/mp4';
                        if (ext === 'aac') mimeType = 'audio/aac';
                        if (ext === 'webm') mimeType = 'audio/webm';

                        console.log(`  - Uploading ${audioPath} as ${mimeType}...`);

                        // Rate limit wait BEFORE uploading/analyzing to be safe, or AFTER? 
                        // Better to wait before API call or after success/fail loop.
                        // Let's puts a wait here as well.
                        await new Promise(r => setTimeout(r, 35000));

                        const result = await processVideoAudio(audioPath, mimeType);

                        summaryData = result.summary;
                        fullTranscript = result.transcript;

                        // Delete audio
                        fs.unlinkSync(audioPath);
                    } else {
                        throw new Error('Audio download failed (file not found)');
                    }
                }

                // Save to DB
                // Ensure summaryData is valid object
                if (!summaryData) throw new Error('Summary generation failed');

                const { error: insertError } = await supabaseAdmin
                    .from('videos')
                    .insert({
                        yt_video_id: videoId,
                        title: title,
                        summary_json: summaryData,
                        published_at: publishedAt,
                        thumbnail_url: thumbnailUrl,
                        transcript: fullTranscript
                    });

                if (insertError) {
                    console.error(`  - DB Error: ${insertError.message}`);
                    totalFailed++;
                } else {
                    console.log(`  - SUCCESS: Saved ${title}`);
                    totalProcessed++;
                }

            } catch (e: any) {
                console.error(`  - FAILED ${videoId}: ${e.message}`);
                totalFailed++;
                // Wait even on error to cool down
                await new Promise(r => setTimeout(r, 10000));
            }
        }

        nextPageToken = response.data.nextPageToken;

    } while (nextPageToken);

    console.log('\n==========================================');
    console.log(`Finished! Processed: ${totalProcessed}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
}

getAllVideos().catch(console.error);
