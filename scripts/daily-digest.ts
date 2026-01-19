
import { getLatestVideos } from '@/lib/youtube/service';
import { getVideoTranscript } from '@/lib/youtube/transcript';
import { summarizeVideo } from '@/lib/gemini/service';
import { sendEmail } from '@/lib/email/service';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { VideoSummary } from '@/lib/types';

async function main() {
    console.log('Starting Daily Digest Pipeline...');

    if (!supabaseAdmin) {
        throw new Error('Supabase Admin client not initialized');
    }

    // 1. Get new videos
    const videos = await getLatestVideos();
    console.log(`Found ${videos.length} videos from the last 24h.`);

    if (videos.length === 0) {
        console.log('No new videos. Exiting.');
        return;
    }

    for (const videoItem of videos) {
        const videoId = videoItem.id?.videoId;
        const title = videoItem.snippet?.title;
        const publishedAt = videoItem.snippet?.publishedAt;

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

        // 2. Fetch Transcript
        let transcript = '';
        try {
            transcript = await getVideoTranscript(videoId);
        } catch (e) {
            console.error(`Could not fetch transcript for ${videoId}. Skipping.`);
            continue;
        }

        if (!transcript) {
            console.log('No transcript found. Skipping.');
            continue;
        }

        // 3. Summarize
        let summary: VideoSummary;
        try {
            summary = await summarizeVideo(transcript);
        } catch (e) {
            console.error(`Could not summarize ${videoId}. Skipping.`);
            continue;
        }

        // 4. Save to DB
        const { data: videoRecord, error: insertError } = await supabaseAdmin
            .from('videos')
            .insert({
                yt_video_id: videoId,
                title: title,
                summary_json: summary, // Supabase handles JSONB
                published_at: publishedAt,
            })
            .select()
            .single();

        if (insertError || !videoRecord) {
            console.error('Failed to insert video:', insertError);
            continue;
        }

        console.log(`Video saved: ${videoRecord.id}`);

        // 5. Deliver to Users (Active/Trialing)
        const { data: users, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .in('subscription_status', ['active', 'trialing']);

        if (userError || !users) {
            console.error('Failed to fetch users:', userError);
            return;
        }

        console.log(`Sending emails to ${users.length} users...`);

        for (const user of users) {
            if (!user.email) continue;

            // Construct Email Config
            const emailHtml = `
        <h1>${title}</h1>
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
        <p><a href="https://youtube.com/watch?v=${videoId}">Watch Video</a></p>
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
