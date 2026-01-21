import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Helper to parse ISO 8601 duration (e.g. PT1M30S) to seconds
function parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1]?.replace('H', '') || '0') || 0);
    const minutes = (parseInt(match[2]?.replace('M', '') || '0') || 0);
    const seconds = (parseInt(match[3]?.replace('S', '') || '0') || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
}

async function removeShorts() {
    console.log('=== Identifying and Removing Shorts (<= 60s) ===');

    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, yt_video_id, title');

    if (error) {
        console.error('Error fetching videos:', error);
        return;
    }

    console.log(`Total videos in DB: ${videos.length}`);

    // Process in chunks to respect YouTube API limits
    const chunkSize = 50;
    let shortsCount = 0;
    let deletedCount = 0;

    for (let i = 0; i < videos.length; i += chunkSize) {
        const chunk = videos.slice(i, i + chunkSize);
        const videoIds = chunk.map(v => v.yt_video_id);

        try {
            const response = await youtube.videos.list({
                part: ['contentDetails', 'snippet'], // Need contentDetails for duration
                id: videoIds,
            });

            const items = response.data.items || [];

            for (const item of items) {
                if (!item.id || !item.contentDetails?.duration) continue;

                const durationSec = parseDuration(item.contentDetails.duration);
                const title = item.snippet?.title || '';

                // Criterion: <= 60 seconds OR title contains #shorts
                const isShort = durationSec > 0 && durationSec <= 65; // Slight buffer for 61s shorts

                if (isShort) {
                    console.log(`[SHORT DETECTED] ${durationSec}s - ${title} (${item.id})`);
                    shortsCount++;

                    // Find the DB ID
                    const dbVideo = chunk.find(v => v.yt_video_id === item.id);
                    if (dbVideo) {
                        const { error: delError } = await supabase
                            .from('videos')
                            .delete()
                            .eq('id', dbVideo.id);

                        if (delError) {
                            console.error(`  Failed to delete: ${delError.message}`);
                        } else {
                            console.log('  -> Deleted from DB.');
                            deletedCount++;
                        }
                    }
                }
            }

        } catch (e) {
            console.error('API Error:', e);
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total Shorts Found: ${shortsCount}`);
    console.log(`Total Deleted: ${deletedCount}`);
}

removeShorts();
