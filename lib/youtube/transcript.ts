


export async function getVideoTranscript(videoId: string): Promise<string> {
    try {
        console.log(`[Transcript] Fetching for ${videoId} using youtube-transcript...`);

        // Dynamic import to avoid issues if dependency is missing (though it shouldn't be)
        const { YoutubeTranscript } = await import('youtube-transcript');

        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'en' // Default to English, though it usually handles auto-detect
        });

        if (!transcriptItems || transcriptItems.length === 0) {
            console.warn(`[Transcript] No transcript found for ${videoId}`);
            return '';
        }

        // Combine text
        const fullText = transcriptItems
            .map(item => item.text)
            .join(' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return fullText;

    } catch (error: any) {
        // Helpful error logging
        if (error.message && error.message.includes('Transcript is disabled')) {
            console.warn(`[Transcript] Transcripts are disabled for ${videoId}`);
        } else {
            console.error(`[Transcript] Failed to fetch for ${videoId}:`, error.message);
        }
        return '';
    }
}
