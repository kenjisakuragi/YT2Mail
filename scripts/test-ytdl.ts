
import youtubedl from 'youtube-dl-exec';

async function test() {
    console.log('Testing yt-dlp...');
    try {
        const output = await youtubedl('https://www.youtube.com/watch?v=jNQXAC9IVRw', {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            skipDownload: true
        });
        console.log('Success! Title:', output.title);
        // @ts-ignore
        console.log('Subtitles:', Object.keys(output.subtitles || {}));
        // @ts-ignore
        console.log('Auto Caps:', Object.keys(output.automatic_captions || {}));
    } catch (e) {
        console.error('Failed:', e);
    }
}
test();
