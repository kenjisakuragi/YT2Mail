
import youtubedl from 'youtube-dl-exec';

export async function getVideoTranscript(videoId: string): Promise<string> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        console.log(`[Transcript] Fetching metadata for ${videoId}...`);

        // Add timeout via Promise.race if needed, but youtube-dl-exec doesn't verify simple internal timeout nicely.
        // We will rely on its internal behavior but catch any hanging.

        const output = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            skipDownload: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            referer: 'https://www.youtube.com/',
        });

        // @ts-ignore
        const subtitles = output.subtitles || {};
        // @ts-ignore
        const automaticCaptions = output.automatic_captions || {};

        // Prioritize: Manual English -> Auto English
        const enSubs = subtitles.en || subtitles['en-US'] || automaticCaptions.en || automaticCaptions['en-US'];

        if (!enSubs || enSubs.length === 0) {
            console.warn(`[Transcript] No English subtitles found for ${videoId}`);
            return '';
        }

        // Look for json3 or vtt
        let targetFormat = enSubs.find((s: any) => s.ext === 'json3') || enSubs.find((s: any) => s.ext === 'vtt') || enSubs[0];

        if (!targetFormat || !targetFormat.url) {
            console.warn(`[Transcript] No valid subtitle URL found for ${videoId}`);
            return '';
        }

        console.log(`[Transcript] Downloading request format ${targetFormat.ext} for ${videoId}...`);

        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(targetFormat.url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`[Transcript] Fetch failed: ${response.status} ${response.statusText}`);
                return '';
            }

            const text = await response.text();

            if (targetFormat.ext === 'json3') {
                try {
                    const json = JSON.parse(text);
                    if (json.events) {
                        return json.events
                            .map((evt: any) => evt.segs ? evt.segs.map((s: any) => s.utf8).join('') : '')
                            .join(' ')
                            .replace(/\n/g, ' ');
                    }
                } catch (e) {
                    console.error('[Transcript] Failed to parse JSON3 captions', e);
                }
            }

            // cleanup VTT/XML
            return text
                .replace(/<[^>]*>/g, '')
                .replace(/WEBVTT/g, '')
                .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})/g, '')
                .replace(/^\s*$/gm, '')
                .replace(/\n/g, ' ');

        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error(`[Transcript] Download timed out or failed for ${videoId}`, fetchError);
            return '';
        }

    } catch (error) {
        console.error(`[Transcript] yt-dlp failed for ${videoId}:`, error);
        return '';
    }
}
