import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
    const key = process.env.GEMINI_API_KEY || '';
    if (!key) {
        console.error('No API Key found in .env.local');
        return;
    }
    console.log(`Checking Key: ${key.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(key);

    // Test multiple model variants to see what works
    const modelsToTest = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
    ];

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Verify access.');
            console.log(`✅ Success! Response: ${result.response.text().substring(0, 20)}...`);
        } catch (e: any) {
            console.error(`❌ Failed: ${e.message.split('\n')[0]}`); // Print first line of error
        }
    }
}
main();
