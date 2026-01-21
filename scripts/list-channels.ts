import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listChannels() {
    console.log('=== YouTube Channels ===\n');

    const { data: channels, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!channels || channels.length === 0) {
        console.log('No channels found.');
        console.log('\nAdd a channel:');
        console.log('  npx tsx scripts/add-channel.ts <channel_url> [category]');
        return;
    }

    console.log(`Total Channels: ${channels.length}\n`);

    for (const channel of channels) {
        const status = channel.is_active ? '✅ Active' : '⏸️  Inactive';
        const lastChecked = channel.last_checked_at
            ? new Date(channel.last_checked_at).toLocaleString('ja-JP')
            : 'Never';

        console.log(`${status} ${channel.channel_name}`);
        console.log(`  ID: ${channel.channel_id}`);
        console.log(`  Category: ${channel.category || 'N/A'}`);
        console.log(`  Subscribers: ${(channel.subscriber_count || 0).toLocaleString()}`);
        console.log(`  Last Checked: ${lastChecked}`);
        console.log(`  URL: ${channel.channel_url}`);
        console.log('');
    }

    // Get video counts per channel
    console.log('=== Video Counts ===\n');

    for (const channel of channels) {
        const { count } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

        console.log(`${channel.channel_name}: ${count || 0} videos`);
    }

    console.log('\n=== Commands ===');
    console.log('Import videos from a channel:');
    console.log('  npx tsx scripts/import-channel-videos.ts <channel_id> [max_videos]');
    console.log('\nAdd new channel:');
    console.log('  npx tsx scripts/add-channel.ts <channel_url> [category]');
}

listChannels();
