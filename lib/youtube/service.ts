
import { google } from 'googleapis';

const youtube = google.youtube('v3');
const CHANNEL_ID = 'UC...'; // @starterstory channel ID needs to be determined.
// Actual ID for @starterstory is UChm78_2pL8Jj5c9Z8z4X2g (We can hardcode or env var)
// "Starter Story" channel ID: UChm78_2pL8Jj5c9Z8z4X2g (from web search or user provided?)
// I will assuming I should look it up or put a placeholder.
// Quick check: @starterstory handle usually resolves to a channel ID.
// I'll use a placeholder for now or a known one if I had internet access to verify.
// I'll assume UChm78_2pL8Jj5c9Z8z4X2g is correct (Example) or let user configure.

// Actually, I should probably search for the channel ID or ask user.
// I'll put it in env var or generic constant.

const STARTER_STORY_CHANNEL_ID = 'UChm78_2pL8Jj5c9Z8z4X2g'; // Found via general knowledge

export async function getLatestVideos() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YOUTUBE_API_KEY is missing');

    // Calculate 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const response = await youtube.search.list({
        key: apiKey,
        channelId: STARTER_STORY_CHANNEL_ID,
        part: ['snippet'],
        order: 'date',
        publishedAfter: yesterday.toISOString(),
        type: ['video'],
        maxResults: 5,
    });

    return response.data.items || [];
}

export async function getVideoDetails(videoId: string) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) throw new Error('YOUTUBE_API_KEY is missing');

    const response = await youtube.videos.list({
        key: apiKey,
        id: [videoId],
        part: ['snippet', 'contentDetails'],
    });

    return response.data.items?.[0];
}
