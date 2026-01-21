import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function cleanupBadTitles() {
    console.log('=== Cleaning up malformed titles ===');

    const { data: videos, error } = await supabase
        .from('videos')
        .select('id, yt_video_id, title');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const badTitles = videos.filter(v =>
        v.title.includes('Option 1') ||
        v.title.includes('Option 2') ||
        v.title.includes('Option 3') ||
        v.title.includes('**') ||
        /^[a-zA-Z\s]+$/.test(v.title) // All English
    );

    console.log(`Found ${badTitles.length} videos with bad titles.`);

    for (const video of badTitles) {
        console.log(`\nFixing: ${video.title}`);

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
            const result = await model.generateContent([
                `あなたは日本のビジネスパーソン向けのYouTubeタイトル翻訳者です。
                
以下のタイトルを、魅力的で簡潔な日本語タイトルに修正してください。

要件:
- 40文字以内
- ビジネスパーソンが興味を持つキャッチーな表現
- 複数の選択肢や説明文は不要
- 翻訳結果のタイトルのみを出力すること
- マークダウン記号（**など）は使用しない

元のタイトル: ${video.title}

日本語タイトル:`
            ]);

            let cleaned = result.response.text().trim();

            // Clean up
            cleaned = cleaned.replace(/\*\*/g, '').replace(/\*/g, '');
            cleaned = cleaned.replace(/\*\*Option \d+.*?\*\*:?\s*/gi, '');
            const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                cleaned = lines[0];
            }
            cleaned = cleaned.replace(/^[:：]\s*/, '');

            console.log(`  -> ${cleaned}`);

            const { error: updateError } = await supabase
                .from('videos')
                .update({ title: cleaned })
                .eq('id', video.id);

            if (updateError) {
                console.error('  Update failed:', updateError);
            } else {
                console.log('  ✅ Updated');
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 3000));

        } catch (e) {
            console.error('  Error:', e);
        }
    }

    console.log('\n=== Cleanup Complete ===');
}

cleanupBadTitles();
