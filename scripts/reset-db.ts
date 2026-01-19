
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetVideos() {
    console.log('Resetting video data...');

    // Delete all logs first (FK constraint)
    const { error: logError } = await supabase.from('delivery_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (logError) console.error('Error deleting logs:', logError);

    // Delete all videos
    const { error: videoError } = await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (videoError) {
        console.error('Error deleting videos:', videoError);
    } else {
        console.log('All videos deleted.');
    }
}

resetVideos();
