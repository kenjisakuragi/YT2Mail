import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProgress() {
    console.log('=== Import Progress ===\n');

    const { data: channels } = await supabase
        .from('youtube_channels')
        .select('id, channel_name, category')
        .order('channel_name');

    if (!channels) {
        console.log('No channels found.');
        return;
    }

    let totalVideos = 0;

    for (const channel of channels) {
        const { count } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

        const videoCount = count || 0;
        totalVideos += videoCount;

        const status = videoCount > 0 ? '✅' : '⏳';
        console.log(`${status} ${channel.channel_name} (${channel.category})`);
        console.log(`   Videos: ${videoCount}`);
        console.log('');
    }

    console.log(`Total Videos: ${totalVideos}`);
    console.log('\nNote: Import processes are running in the background.');
    console.log('Run this script again to check updated progress.');
}

checkProgress();
