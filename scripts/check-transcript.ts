import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function checkTranscript() {
    const { data: videos } = await supabase.from('videos').select('title, summary_json').limit(5).order('created_at', { ascending: false });
    videos?.forEach(v => {
        const s = v.summary_json;
        console.log(`Title: ${v.title.substring(0, 20)}...`);
        console.log(`  Transcript Len: ${s.transcript ? s.transcript.length : 'MISSING'}`);
        console.log(`  Article Len: ${s.detailed_article ? s.detailed_article.length : 'MISSING'}`);
    });
}
checkTranscript();
