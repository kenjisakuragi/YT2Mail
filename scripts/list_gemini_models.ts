import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('GEMINI_API_KEY not found');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            fs.writeFileSync('models_output.txt', JSON.stringify(data.error, null, 2));
            return;
        }

        const lines: string[] = ['=== Available Gemini Models ===\n'];
        for (const model of data.models || []) {
            // Filter to show only text generation capable models
            if (model.supportedGenerationMethods?.includes('generateContent')) {
                lines.push(`${model.name}`);
            }
        }

        fs.writeFileSync('models_output.txt', lines.join('\n'));
        console.log('Output saved to models_output.txt');
    } catch (e: any) {
        fs.writeFileSync('models_output.txt', `Error: ${e.message}`);
    }
}

listModels();
