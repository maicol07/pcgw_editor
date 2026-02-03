
import { GoogleGenAI } from '@google/genai';

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('API Key is required to initialize GeminiService');
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Generates text content based on a prompt.
     */
    async generateContent(prompt: string, model: string = 'gemini-3-flash-preview'): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model,
                contents: prompt,
            });

            const text = response.text;
            if (!text) throw new Error('No response from AI');

            return text;
        } catch (error) {
            console.error('Gemini generateContent error:', error);
            throw error;
        }
    }

    /**
     * Analyzes an image (Base64) with a prompt and returns the parsed JSON response.
     * Expects the prompt to request JSON output.
     */
    async analyzeImageJSON<T>(imageBase64: string, prompt: string, model: string = 'gemini-3-flash-preview'): Promise<T> {
        try {
            // Remove header if present (e.g., "data:image/png;base64,") usually handled by the caller or the SDK if passed correctly?
            // The new @google/genai SDK v1+ handles Part objects.

            // Clean base64 string if it contains metadata header
            const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

            const response = await this.ai.models.generateContent({
                model,
                contents: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'image/png', // Assumes PNG or JPEG, usually auto-detected or manageable. API is forgiving or we can parameterize.
                            data: cleanBase64
                        }
                    }
                ],
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const text = response.text;
            if (!text) throw new Error('No response from AI');

            return JSON.parse(text) as T;
        } catch (error) {
            console.error('Gemini analyzeImageJSON error:', error);
            throw error;
        }
    }
}
