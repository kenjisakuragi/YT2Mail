
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { VideoSummary } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

export interface GeminiResponse {
    summary: VideoSummary;
    transcript: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert business analyst.
Your task is to analyze the provided YouTube video audio (or transcript) and extract key business insights.
Language: Japanese (Output must be in Japanese).

If audio is provided, you must first generate a HIGHLY ACCURATE transcript of the entire audio.
Then, based on that transcript, generate the structured summary.

Return a JSON object with this exact structure:
{
  "transcript": "Full transcript of the audio in English (or original language).",
  "summary": {
    "business_overview": "何を売っている、どんなビジネスモデルか？",
    "key_metrics": "月商、利益率、初期費用（判明している場合）。",
    "acquisition_strategy": "最初の10〜100人のお客様をどう獲得したか。",
    "tools_used": "Shopify, Beehiiv, No-codeツール等のスタック。",
    "japan_application": "この事例を日本市場で展開するための具体的なヒント。",
    "detailed_article": "読者が没入して読める、10分程度（3000〜4000文字程度）のブログ記事形式の長文。起承転結または具体的なストーリーテリングを用いて、創業者の苦労、転機、成功の秘訣を詳細に描写すること。"
  }
}
`;

export async function processVideoAudio(audioPath: string, mimeType: string = 'audio/mp3'): Promise<GeminiResponse> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing');
    }

    // 1. Upload File
    console.log(`[Gemini] Uploading ${audioPath}...`);
    const uploadResult = await fileManager.uploadFile(audioPath, {
        mimeType,
        displayName: "Audio for analysis",
    });

    const file = uploadResult.file;
    console.log(`[Gemini] Uploaded: ${file.uri}`);

    // Wait for file to adhere to active state if video, but audio is usually quick.
    // For large files, polling might be needed.

    // 2. Generate Content
    // Using 'gemini-2.0-flash-lite' for better free tier quota (gemini-1.5-* models are deprecated)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    console.log('[Gemini] Analyzing audio...');
    const result = await model.generateContent([
        SYSTEM_INSTRUCTION,
        {
            fileData: {
                fileUri: file.uri,
                mimeType: file.mimeType,
            },
        },
    ]);

    const response = await result.response;
    const text = response.text();

    // 3. Cleanup (Delete file from Gemini to save space/privacy)
    // Note: It's good practice to delete, but maybe keep it if debugging.
    // Let's delete it.
    await fileManager.deleteFile(file.name);

    return parseGeminiResponse(text);
}

export async function summarizeVideo(transcript: string): Promise<VideoSummary> {
    // Legacy function for text-only input
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing');
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Simple prompt for text-only
    const prompt = `
    Analyze the following transcript and return a JSON.
    ${SYSTEM_INSTRUCTION}
    
    Transcript:
    ${transcript}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = parseGeminiResponse(text);
    return parsed.summary;
}

function parseGeminiResponse(text: string): GeminiResponse {
    try {
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(jsonString);

        // Ensure structure
        if (!json.summary || !json.transcript) {
            // Fallback for legacy text-only which might just return summary object if prompt wasn't perfect
            if (json.business_overview) {
                return { summary: json, transcript: '' };
            }
        }
        return json as GeminiResponse;
    } catch (error) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Gemini response format error');
    }
}
