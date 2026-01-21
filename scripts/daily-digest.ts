
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Remove static imports to allow dotenv to load first
// import { getLatestVideos } from '../lib/youtube/service';
// import { getVideoTranscript } from '../lib/youtube/transcript';
// import { summarizeVideo } from '../lib/gemini/service';
// import { sendEmail } from '../lib/email/service';
// import { supabaseAdmin } from '../lib/supabase/admin';
import { VideoSummary } from '../lib/types';

async function main() {
    console.log('Starting Daily Digest Pipeline...');

    // Dynamically import AFTER dotenv config
    const { getLatestVideos } = await import('../lib/youtube/service');
    const { getVideoTranscript } = await import('../lib/youtube/transcript');
    const { summarizeVideo } = await import('../lib/gemini/service');
    const { sendEmail } = await import('../lib/email/service');
    const { supabaseAdmin } = await import('../lib/supabase/admin');

    if (!supabaseAdmin) {
        throw new Error('Supabase Admin client not initialized');
    }

    // 1. Get new videos
    // Note: getLatestVideos uses hardcoded process.env.YOUTUBE_API_KEY
    const videos = await getLatestVideos();
    console.log(`Found ${videos.length} videos from the last 24h.`);

    if (videos.length === 0) {
        console.log('No new videos. Exiting.');
        return;
    }

    // Fetch users ONCE
    // Select users where subscription_status is active/trialing OR is_admin is true
    const { data: users, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, is_admin, subscription_status')
        .or('subscription_status.in.(active,trialing),is_admin.eq.true');

    if (userError || !users) {
        console.error('Failed to fetch users:', userError);
        return;
    }
    console.log(`Target users count: ${users.length}`);

    for (const videoItem of videos) {
        const videoId = videoItem.id?.videoId;
        const title = videoItem.snippet?.title;
        const publishedAt = videoItem.snippet?.publishedAt;
        const thumbnailUrl = videoItem.snippet?.thumbnails?.maxres?.url || videoItem.snippet?.thumbnails?.high?.url || videoItem.snippet?.thumbnails?.medium?.url;

        if (!videoId || !title) continue;

        console.log(`Processing video: ${title} (${videoId})`);

        // Check if already exists in DB
        const { data: existing } = await supabaseAdmin
            .from('videos')
            .select('id')
            .eq('yt_video_id', videoId)
            .single();

        if (existing) {
            console.log('Video already processed. Skipping.');
            continue;
        }

        // 2. Fetch Transcript / Summary
        // Ideally we should reuse the logic from import-all-videos.ts (audio fallback)
        // For now, let's stick to text transcript to keep it simple, assuming daily new videos have captions.
        // If not, we might need to unify the "ingestVideo" logic into a shared library function.

        let transcript = '';
        let summary: VideoSummary | undefined;

        try {
            transcript = await getVideoTranscript(videoId);
            if (transcript && transcript.length > 100) {
                summary = await summarizeVideo(transcript);
            }
        } catch (e) {
            console.error(`Error processing content for ${videoId}`, e);
        }

        if (!summary) {
            console.log('Could not generate summary (no transcript?). Skipping.');
            // Note: In production you'd want the audio fallback here too!
            continue;
        }

        // 4. Save to DB
        const { data: videoRecord, error: insertError } = await supabaseAdmin
            .from('videos')
            .insert({
                yt_video_id: videoId,
                title: title,
                summary_json: summary,
                published_at: publishedAt,
                thumbnail_url: thumbnailUrl,
                transcript: transcript
            })
            .select()
            .single();

        if (insertError || !videoRecord) {
            console.error('Failed to insert video:', insertError);
            continue;
        }

        console.log(`Video saved: ${videoRecord.id}`);

        // 5. Deliver to Users
        console.log(`Sending emails to ${users.length} users...`);

        for (const user of users) {
            if (!user.email) continue;

            const emailHtml = `
        <h1>${title}</h1>
        <img src="${thumbnailUrl}" style="width:100%;max-width:600px;border-radius:8px;margin-bottom:20px;" />
        <h2>ビジネス概要</h2>
        <p>${summary.business_overview}</p>
        <h2>主要メトリクス</h2>
        <p>${summary.key_metrics}</p>
        <h2>集客戦略</h2>
        <p>${summary.acquisition_strategy}</p>
        <h2>使用ツール</h2>
        <p>${summary.tools_used}</p>
        <h2>日本での応用案</h2>
        <p>${summary.japan_application}</p>
        <hr/>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard">ダッシュボードで読む</a> | <a href="https://youtube.com/watch?v=${videoId}">YouTubeで見る</a></p>
      `;

            try {
                await sendEmail(user.email, `Starter Story Insight: ${title}`, emailHtml);

                // Log delivery
                await supabaseAdmin.from('delivery_logs').insert({
                    user_id: user.id,
                    video_id: videoRecord.id,
                    sent_at: new Date().toISOString()
                });
            } catch (e) {
                console.error(`Failed to email ${user.email}`);
            }
        }
    }

    console.log('Pipeline finished.');
}

main().catch(console.error);
