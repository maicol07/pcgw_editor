
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

    /**
     * Generates a feature list summary for a game.
     */
    async generateShareSummary(gameTitle: string, gameData: any, model: string = 'gemini-3-flash-preview'): Promise<string> {
        const summaryData = {
            video: gameData.video,
            input: gameData.input,
            audio: gameData.audio,
            vr: gameData.vr,
            network: gameData.network,
        };

        const prompt = `
            Create a feature list for "${gameTitle || 'Unknown'}".
            The output should be divided into two sections: "Pros" and "Cons".
            Each section should be a bullet point list, with each point starting with "- ".
            The tone should be factual and concise.
            Do not include information about API, monetization, or microtransactions.
            
            Use the following data to generate the summary:
            ${JSON.stringify(summaryData)}

            Here is an example of the desired output format and style:
            
            Pros
            - Native 4K Ultra HD and widescreen support.
            - Windowed and borderless windowed display modes.
            - Anti-aliasing options including FXAA, TAA, and TSR.
            - Supports DLSS 4, FSR 3, and XeSS 2 upscaling.
            - Frame generation support for DLSS, FSR, and XeSS.
            - Vsync and high frame rate support up to 120 FPS.
            - Color blind accessibility mode available.
            - Fully rebindable keyboard keys with adjustable mouse sensitivity.
            - Full controller support with native compatibility for XInput, DualShock 4, and DualSense controllers (USB).
            - Includes on-screen button prompts for both Xbox and PlayStation controllers.
            - Steam Input API and haptic feedback support.
            - Separate volume sliders and subtitle support.
            - Includes a dedicated streamer mode for royalty-free music.

            Cons
            - No field of view (FOV) slider.
            - No support for HDR or ray tracing.
            - Controller button remapping is not supported.
            - Controllers must be connected before launching (no hotplugging support).
            - No support for Xbox Impulse Triggers or DualSense adaptive triggers.
            - Audio is limited to stereo (no surround sound support).
        `;

        return this.generateContent(prompt, model);
    }
}
