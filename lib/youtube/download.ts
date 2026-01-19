
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
        await youtubedl(videoUrl, {
            // "bestaudio[ext=m4a]" ensures we get m4a container (usually AAC) which doesn't need ffmpeg to extract if it's a separate stream.
            // Note: sometimes yt-dlp still wants ffmpeg to "fix" the container. 
            // We use 'format' option.
            format: 'bestaudio[ext=m4a]/bestaudio',
            output: path.join(outputDir, '%(id)s.%(ext)s'), // let yt-dlp determine extension if m4a fails
            noWarnings: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

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
