import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';

async function testSingleAudio() {
    console.log('=== Testing Gemini Audio Processing ===');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found');
        return;
    }
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    // Use a small audio file for testing
    const audioDir = './tmp_audio';
    const files = fs.readdirSync(audioDir)
        .filter(f => f.endsWith('.m4a'))
        .sort((a, b) => fs.statSync(path.join(audioDir, a)).size - fs.statSync(path.join(audioDir, b)).size);

    if (files.length === 0) {
        console.log('No .m4a files found');
        return;
    }

    // Pick the smallest file
    const testFile = files[0];
    const audioPath = path.join(audioDir, testFile);
    const stats = fs.statSync(audioPath);
    console.log(`\nTesting with smallest file: ${testFile}`);
    console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    try {
        // 1. Upload
        console.log('\n[Step 1] Uploading to Gemini...');
        const uploadResult = await fileManager.uploadFile(audioPath, {
            mimeType: 'audio/mp4',
            displayName: 'Test Audio',
        });
        console.log('✅ Upload successful!');
        console.log('   File URI:', uploadResult.file.uri);
        console.log('   File Name:', uploadResult.file.name);

        // 2. Generate
        console.log('\n[Step 2] Generating content with gemini-2.0-flash-lite...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        const result = await model.generateContent([
            'Summarize this audio in one sentence.',
            { fileData: { fileUri: uploadResult.file.uri, mimeType: 'audio/mp4' } }
        ]);

        const text = result.response.text();
        console.log('✅ Generation successful!');
        console.log('   Response:', text.substring(0, 200));

        // 3. Cleanup
        console.log('\n[Step 3] Cleaning up...');
        await fileManager.deleteFile(uploadResult.file.name);
        console.log('✅ File deleted');

        console.log('\n=== TEST PASSED ===');
        console.log('Audio processing pipeline is working correctly!');

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            console.log('\n⚠️  Rate limit hit! Free tier limits:');
            console.log('   - 2 RPM (requests per minute)');
            console.log('   - 1500 RPD (requests per day)');
        }
        if (error.message.includes('404')) {
            console.log('\n⚠️  Model not found! Check model name.');
        }
        console.log('\nFull error details:');
        console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testSingleAudio();
