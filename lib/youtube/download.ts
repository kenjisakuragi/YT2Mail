
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export async function downloadAudio(videoId: string): Promise<string> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const outputDir = path.join(process.cwd(), 'tmp_audio');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Target m4a directly to avoid ffmpeg requirement
    const outputPath = path.join(outputDir, `${videoId}.m4a`);

    // If file exists, delete it first to ensure fresh download or return it?
    // Let's delete to be safe.
    if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (e) { }
    }

    console.log(`[Download] Downloading audio (m4a) for ${videoId}...`);

    try {
        const args: any = {
            // "bestaudio[ext=m4a]" ensures we get m4a container (usually AAC) which doesn't need ffmpeg to extract if it's a separate stream.
            // Note: sometimes yt-dlp still wants ffmpeg to "fix" the container. 
            // We use 'format' option.
            // "bestaudio" is safer. If m4a isn't available, we take what we get and handle it.
            // Some shorts or videos only have certain formats exposed to Android client.
            format: 'bestaudio[ext=m4a]/bestaudio/best',
            output: path.join(outputDir, '%(id)s.%(ext)s'), // let yt-dlp determine extension if m4a fails
            noWarnings: true,
            // Impersonate Android Client: This is the critical "Fundamental" fix.
            // The Android API is generally much more permissive and less likely to trigger "Sign in"
            extractorArgs: 'youtube:player_client=android',
            userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        };

        if (process.env.YOUTUBE_COOKIES_PATH) {
            args.cookies = process.env.YOUTUBE_COOKIES_PATH;
        }

        await youtubedl(videoUrl, args);

        // Find the file because extension might vary if fallback happened
        const files = fs.readdirSync(outputDir);
        const downloadedFile = files.find(f => f.startsWith(videoId));

        if (!downloadedFile) {
            throw new Error('File not found after download');
        }

        return path.join(outputDir, downloadedFile);
    } catch (e) {
        console.error(`[Download] Failed to download ${videoId}`, e);
        throw e;
    }
}
