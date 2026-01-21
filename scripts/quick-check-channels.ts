import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function quickCheck() {
    const { data, error } = await supabase
        .from('youtube_channels')
        .select('channel_name, category, subscriber_count, channel_id')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\n=== Registered Channels ===\n');
    data?.forEach((ch, i) => {
        console.log(`${i + 1}. ${ch.channel_name}`);
        console.log(`   Category: ${ch.category}`);
        console.log(`   Subscribers: ${(ch.subscriber_count || 0).toLocaleString()}`);
        console.log(`   ID: ${ch.channel_id}\n`);
    });
    console.log(`Total: ${data?.length || 0} channels`);
}

quickCheck();
