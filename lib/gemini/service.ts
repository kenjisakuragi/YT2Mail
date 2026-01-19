
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VideoSummary } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SUMMARY_TEMPLATE = `
Analyze the following YouTube video transcript and generate a structured summary in JSON format.
The summary should be in Japanese and follow this exact structure:

{
  "business_overview": "何を売っている、どんなビジネスモデルか？",
  "key_metrics": "月商、利益率、初期費用（判明している場合）。",
  "acquisition_strategy": "最初の10〜100人のお客様をどう獲得したか。",
  "tools_used": "Shopify, Beehiiv, No-codeツール等のスタック。",
  "japan_application": "この事例を日本市場で展開するための具体的なヒント。"
}

Transcript:
`;

export async function summarizeVideo(transcript: string): Promise<VideoSummary> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is missing');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = SUMMARY_TEMPLATE + transcript;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from the response (handling potential markdown code blocks)
    try {
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString) as VideoSummary;
    } catch (error) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Gemini response format error');
    }
}
