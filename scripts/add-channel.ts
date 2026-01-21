import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

interface ChannelInfo {
    channelId: string;
    channelName: string;
    channelUrl: string;
    description: string;
    subscriberCount: number;
}

async function getChannelInfo(input: string): Promise<ChannelInfo> {
    let channelId: string;

    // Extract channel ID from various URL formats
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
        // URL format: https://www.youtube.com/@channelname or /channel/UCxxx
        if (input.includes('/@')) {
            const username = input.split('/@')[1].split('/')[0].split('?')[0];
            // Search by username
            const searchResponse = await youtube.search.list({
                part: ['snippet'],
                q: username,
                type: ['channel'],
                maxResults: 1
            });
            channelId = searchResponse.data.items?.[0]?.snippet?.channelId || '';
        } else if (input.includes('/channel/')) {
            channelId = input.split('/channel/')[1].split('/')[0].split('?')[0];
        } else if (input.includes('/c/')) {
            const customUrl = input.split('/c/')[1].split('/')[0].split('?')[0];
            const searchResponse = await youtube.search.list({
                part: ['snippet'],
                q: customUrl,
                type: ['channel'],
                maxResults: 1
            });
            channelId = searchResponse.data.items?.[0]?.snippet?.channelId || '';
        } else {
            throw new Error('Invalid YouTube URL format');
        }
    } else {
        // Assume it's already a channel ID
        channelId = input;
    }

    // Get channel details
    const response = await youtube.channels.list({
        part: ['snippet', 'statistics'],
        id: [channelId]
    });

    const channel = response.data.items?.[0];
    if (!channel) {
        throw new Error('Channel not found');
    }

    return {
        channelId,
        channelName: channel.snippet?.title || 'Unknown',
        channelUrl: `https://www.youtube.com/channel/${channelId}`,
        description: channel.snippet?.description || '',
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0')
    };
}

async function addChannel(channelInput: string, category: string) {
    console.log('=== Adding New YouTube Channel ===\n');

    try {
        // Get channel information from YouTube API
        console.log('Fetching channel info from YouTube...');
        const channelInfo = await getChannelInfo(channelInput);

        console.log(`\nChannel Found:`);
        console.log(`  Name: ${channelInfo.channelName}`);
        console.log(`  ID: ${channelInfo.channelId}`);
        console.log(`  Subscribers: ${channelInfo.subscriberCount.toLocaleString()}`);
        console.log(`  Category: ${category}`);

        // Check if channel already exists
        const { data: existing } = await supabase
            .from('youtube_channels')
            .select('*')
            .eq('channel_id', channelInfo.channelId)
            .single();

        if (existing) {
            console.log('\n⚠️  Channel already exists in database!');
            console.log('   Updating information...');

            const { error: updateError } = await supabase
                .from('youtube_channels')
                .update({
                    channel_name: channelInfo.channelName,
                    description: channelInfo.description,
                    subscriber_count: channelInfo.subscriberCount,
                    category,
                    updated_at: new Date().toISOString()
                })
                .eq('channel_id', channelInfo.channelId);

            if (updateError) {
                console.error('Update failed:', updateError);
            } else {
                console.log('✅ Channel updated successfully');
            }
        } else {
            // Insert new channel
            const { error: insertError } = await supabase
                .from('youtube_channels')
                .insert({
                    channel_id: channelInfo.channelId,
                    channel_name: channelInfo.channelName,
                    channel_url: channelInfo.channelUrl,
                    description: channelInfo.description,
                    category,
                    subscriber_count: channelInfo.subscriberCount,
                    is_active: true
                });

            if (insertError) {
                console.error('Insert failed:', insertError);
                throw insertError;
            }

            console.log('\n✅ Channel added successfully!');
        }

        // Show next steps
        console.log('\n📋 Next Steps:');
        console.log(`   1. Run: npx tsx scripts/import-channel-videos.ts "${channelInfo.channelId}"`);
        console.log('   2. Or import from all active channels');

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Command line usage
const channelInput = process.argv[2];
const category = process.argv[3] || 'business';

if (!channelInput) {
    console.log('Usage: npx tsx scripts/add-channel.ts <channel_url_or_id> [category]');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/add-channel.ts "https://www.youtube.com/@StarterStory" business');
    console.log('  npx tsx scripts/add-channel.ts "UCxxx..." side_hustle');
    console.log('\nCategories: business, side_hustle, saas, ecommerce, content, other');
    process.exit(1);
}

addChannel(channelInput, category);
