
import dotenv from 'dotenv';
// Load env vars immediately
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';

const youtube = google.youtube('v3');
const HANDLE = 'starterstory';

async function getAllVideos() {
    console.log('Starting full import of Starter Story videos...');

    // Dynamically import libraries to ensure env vars are loaded first
    const { supabaseAdmin } = await import('../lib/supabase/admin');
    const { getVideoTranscript } = await import('../lib/youtube/transcript');
    const { summarizeVideo } = await import('../lib/gemini/service');

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
    if (!channelId) {
        throw new Error(`Could not find channel for handle @${HANDLE}`);
    }
    console.log(`Found Channel ID: ${channelId}`);

    let nextPageToken: string | undefined = undefined;
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    do {
        // Fetch videos (50 at a time)
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

            // Check existence
            const { data: existing } = await supabaseAdmin
                .from('videos')
                .select('id')
                .eq('yt_video_id', videoId)
                .single();

            if (existing) {
                process.stdout.write('.'); // Compact progress
                totalSkipped++;
                continue;
            }

            console.log(`\nProcessing: ${title} (${videoId})`);

            try {
                // 1. Transcript
                const transcript = await getVideoTranscript(videoId);

                if (!transcript) {
                    console.warn(`\nNo transcript for ${videoId}. Skipping.`);
                    totalFailed++;
                    continue;
                }

                // 2. Summarize (Gemini)
                // Add delay to respect Gemini rate limits (e.g., 3 seconds)
                await new Promise(resolve => setTimeout(resolve, 3000));

                const summary = await summarizeVideo(transcript);

                // 3. Save
                const { error: insertError } = await supabaseAdmin
                    .from('videos')
                    .insert({
                        yt_video_id: videoId,
                        title: title,
                        summary_json: summary,
                        published_at: publishedAt,
                        thumbnail_url: thumbnailUrl,
                    });

                if (insertError) {
                    console.error(`\nDB Error for ${videoId}:`, insertError.message);
                    totalFailed++;
                } else {
                    console.log(`\nSaved: ${title}`);
                    totalProcessed++;
                }

            } catch (e: any) {
                console.error(`\nError processing ${videoId}: ${e.message}`);
                totalFailed++;
            }
        }

        nextPageToken = response.data.nextPageToken;

    } while (nextPageToken);

    console.log('\n==========================================');
    console.log(`Finished! Processed: ${totalProcessed}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
}

getAllVideos().catch(console.error);
