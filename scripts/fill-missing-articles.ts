import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { VideoSummary } from '../lib/types';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

async function fillMissingArticles() {
    console.log('=== Checking for videos with missing detailed articles ===');

    // Fetch all videos (not efficient for huge DB, but fine for <1000)
    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    const targetVideos = videos.filter(v => {
        const s = v.summary_json;
        return s && s.transcript && s.transcript.length > 500 && (!s.detailed_article || s.detailed_article.length < 100);
    });

    console.log(`Found ${targetVideos.length} videos needing articles.`);

    for (const video of targetVideos) {
        console.log(`\nProcessing: ${video.title} (${video.id})`);

        try {
            const transcript = video.summary_json.transcript;
            console.log(`  Transcript Length: ${transcript.length}`);

            const prompt = `
You are a professional business writer and analyst.
Your task is to write a comprehensive, engaging, and detailed blog article (approx 3000-4000 Japanese characters) based on the provided video transcript.

The article should:
1. Be titled appropriately based on the content.
2. Use a "storytelling" approach (起承転結 - Introduction, Development, Twist, Conclusion).
3. Detail the founder's struggles, key turning points, specific strategies used, and the secret to their success.
4. Be formatted with clear headings and paragraphs (using Markdown).
5. BE IN JAPANESE.

Transcript:
${transcript.substring(0, 100000)} ... (truncated if too long)
`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const article = response.text();

            console.log(`  Generated Article Length: ${article.length}`);

            if (article.length < 500) {
                console.warn('  Warning: Generated article seems too short.');
            }

            // Update DB
            const updatedSummary = {
                ...video.summary_json,
                detailed_article: article
            };

            const { error: updateError } = await supabase
                .from('videos')
                .update({ summary_json: updatedSummary })
                .eq('id', video.id);

            if (updateError) {
                console.error('  Update Error:', updateError);
            } else {
                console.log('  ✅ Database Updated');
            }

            // Rate Limit Pause
            await new Promise(r => setTimeout(r, 5000)); // 5s pause

        } catch (e) {
            console.error('  Processing Error:', e);
        }
    }
}

fillMissingArticles();
