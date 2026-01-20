
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
    console.log('Testing Gemini connection...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

    // 1. List models if possible (SDK doesn't always expose easy list, but we can try generate)
    // Actually SDK doesn't have listModels on client usually, it's a server feature.
    // Let's just try generate with Flash.

    console.log('Comparing models...');
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const modelName of models) {
        console.log(`\nTesting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello, are you there?');
            const response = await result.response;
            console.log(`[${modelName}] Success: ${response.text().slice(0, 50)}...`);
        } catch (e: any) {
            console.error(`[${modelName}] Failed: ${e.message}`);
        }
    }
}

test();
