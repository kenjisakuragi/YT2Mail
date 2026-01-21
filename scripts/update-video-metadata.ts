import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function translateTitle(title: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent([
            `あなたは日本のビジネスパーソン向けのYouTubeタイトル翻訳者です。
            
以下の英語タイトルを、魅力的で簡潔な日本語タイトルに翻訳してください。

要件:
- 40文字以内
- ビジネスパーソンが興味を持つキャッチーな表現
- 複数の選択肢や説明文は不要
- 翻訳結果のタイトルのみを出力すること

英語タイトル: ${title}

日本語タイトル:`
        ]);

        let translated = result.response.text().trim();

        // Clean up common issues
        // Remove markdown formatting
        translated = translated.replace(/\*\*/g, '').replace(/\*/g, '');
        // Remove "Option 1", "Option 2" etc
        translated = translated.replace(/\*\*Option \d+.*?\*\*:?\s*/gi, '');
        // If multiple lines, take the first non-empty line
        const lines = translated.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
            translated = lines[0];
        }
        // Remove any remaining colons at the start
        translated = translated.replace(/^[:：]\s*/, '');

        return translated;
    } catch (e) {
        console.error('Translation failed, using original:', e);
        return title;
    }
}


async function updateVideoMetadata() {
    console.log('=== Updating Video Metadata (Title Translation & Thumbnail) ===');

    // 1. Fetch videos that need updating (placeholder title OR title is English OR missing thumbnail)
    // Simple heuristic: if title contains ASCII only, it's likely English.
    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, yt_video_id, title, thumbnail_url');

    if (error) {
        console.error('Error fetching videos:', error);
        return;
    }

    // Update targets: 
    // - Title starts with "Video "
    // - Missing thumbnail
    // - Title seems to be English (this regex checks for ASCII only characters)
    const isEnglish = (text: string) => /^[\x00-\x7F]*$/.test(text);

    const targets = videos.filter(v =>
        v.title.startsWith('Video ') ||
        !v.thumbnail_url ||
        isEnglish(v.title)
    );

    console.log(`Found ${targets.length} videos to update/translate out of ${videos.length} total.`);

    if (targets.length === 0) {
        console.log('No updates needed.');
        return;
    }

    // 2. Process in chunks
    const chunkSize = 10; // Smaller chunk for Translation API rate limits
    for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        const videoIds = chunk.map(v => v.yt_video_id);

        console.log(`Processing chunk ${Math.floor(i / chunkSize) + 1}: ${videoIds.length} videos...`);

        try {
            const response = await youtube.videos.list({
                part: ['snippet'],
                id: videoIds,
            });

            const items = response.data.items || [];
            console.log(`  Fetched ${items.length} details from YouTube.`);

            for (const item of items) {
                if (!item.id || !item.snippet) continue;

                let title = item.snippet.title || '';

                // Get best thumbnail
                const thumbObj = item.snippet.thumbnails;
                const thumbnailUrl = thumbObj?.maxres?.url ||
                    thumbObj?.standard?.url ||
                    thumbObj?.high?.url ||
                    thumbObj?.medium?.url ||
                    thumbObj?.default?.url;

                // Translate Trigger: If DB title is placeholder OR English OR empty
                const currentDbRecord = chunk.find(v => v.yt_video_id === item.id);
                const needsTranslation = currentDbRecord && (
                    currentDbRecord.title.startsWith('Video ') ||
                    isEnglish(currentDbRecord.title)
                );

                if (needsTranslation && title) {
                    // console.log(`  Translating: ${title}`);
                    title = await translateTitle(title);
                    // console.log(`  -> ${title}`);
                }

                if (title && thumbnailUrl) {
                    const { error: updateError } = await supabase
                        .from('videos')
                        .update({
                            title: title,
                            thumbnail_url: thumbnailUrl
                        })
                        .eq('yt_video_id', item.id);

                    if (updateError) {
                        console.error(`  Failed to update ${item.id}:`, updateError.message);
                    }
                }
            }
            console.log('  Chunk processed.');

            // Rate limit pause
            await new Promise(r => setTimeout(r, 2000));

        } catch (err: any) {
            console.error('  Error:', err.message);
        }
    }

    console.log('=== Update Complete ===');
}

updateVideoMetadata();
