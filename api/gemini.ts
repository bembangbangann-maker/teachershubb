// File: /api/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Securely get the API key from server-side environment variables
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY is not set in environment variables.");
        }
        
        const ai = new GoogleGenAI({ apiKey });

        // The frontend will send the model options in the request body
        const modelOptions = req.body;

        const response = await ai.models.generateContent(modelOptions);
        
        // The `response` object is a class instance with getters. To ensure reliable
        // JSON serialization across the network, we manually construct a plain object.
        // The `response.text` getter is called here on the server, where the full object exists.
        const serializableResponse = {
            text: response.text,
            functionCalls: response.functionCalls,
            // We include candidates and other properties in case the frontend needs more detailed info.
            candidates: response.candidates,
            promptFeedback: response.promptFeedback,
        };

        res.status(200).json(serializableResponse);

    } catch (error: any) {
        console.error("Error in Gemini API route:", error);
        res.status(500).json({ 
            error: 'An error occurred while communicating with the AI service.',
            details: error.message 
        });
    }
}