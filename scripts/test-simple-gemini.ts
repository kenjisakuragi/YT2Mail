import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found');
        process.exit(1);
    }

    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test different models
    const modelsToTest = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
    ];

    for (const modelName of modelsToTest) {
        console.log(`\n--- Testing model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Say "Hello" in Japanese');
            const response = await result.response;
            const text = response.text();
            console.log(`✅ Success! Response: ${text}`);
            console.log(`このモデル "${modelName}" は動作します！`);
            break; // Stop at first success
        } catch (error: any) {
            console.error(`❌ Error with ${modelName}:`, error.message);
            if (error.message.includes('404')) {
                console.log('  -> Model not found. Trying next...');
            }
        }
    }
}

testGemini().catch(console.error);
