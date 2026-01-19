
import { YoutubeTranscript } from 'youtube-transcript';

export async function getVideoTranscript(videoId: string): Promise<string> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'en'
        });

        // Combine all text parts into one string
        return transcriptItems.map(item => item.text).join(' ');
    } catch (error) {
        console.error(`Failed to fetch transcript for video ${videoId}:`, error);
        // Return empty string or throw depending on how we want to handle failures
        // For now, throw so the pipeline knows.
        throw error;
    }
}
