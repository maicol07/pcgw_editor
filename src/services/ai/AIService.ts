import { streamText, generateText, generateObject, type LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { z } from 'zod';
import { aiConfig, type AIProvider } from './aiConfig';

/** Builds an AI SDK model from the user's selected provider/model + stored key. */
export function getModel(
    provider: AIProvider = aiConfig.provider,
    model: string = aiConfig.model,
): LanguageModel {
    const apiKey = aiConfig.keys[provider];
    if (!apiKey) throw new Error(`No API key set for ${provider}. Add it in Settings → Integrations.`);

    switch (provider) {
        case 'openai':
            return createOpenAI({ apiKey })(model);
        case 'anthropic':
            // Required to allow direct browser calls (no backend in this app).
            return createAnthropic({
                apiKey,
                headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
            })(model);
        case 'google':
        default:
            return createGoogleGenerativeAI({ apiKey })(model);
    }
}

/** Streams a text completion, invoking onChunk with the cumulative text after each delta. */
export async function streamPrompt(prompt: string, onChunk?: (full: string) => void): Promise<string> {
    try {
        const { textStream } = streamText({ model: getModel(), prompt });
        let full = '';
        for await (const delta of textStream) {
            full += delta;
            onChunk?.(full);
        }
        if (!full) throw new Error('No response from AI');
        return full;
    } catch (error) {
        console.error('AI streamPrompt error:', error);
        throw error;
    }
}

/** Generates a feature list summary for a game (streamed). */
export function generateShareSummary(
    gameTitle: string,
    gameData: any,
    onChunk?: (full: string) => void,
): Promise<string> {
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

    return streamPrompt(prompt, onChunk);
}

/** Generates a short Git-style edit summary by comparing old and new wikitext (streamed). */
export async function generateEditSummary(
    oldWikitext: string,
    newWikitext: string,
    onChunk?: (full: string) => void,
): Promise<string> {
    const prompt = `
            You are a system generating a concise edit summary (commit message) for a wiki page update.
            Compare the old wikitext to the new wikitext below.
            Identify the primary functional or content changes.
            Write exactly ONE sentence, maximum 80 characters, describing the change. No markdown, no prefixes like "Change:", just the sentence.
            Do not mention "wikitext" or "code", just talk about the content that changed (e.g., "Updated system requirements", "Added a new image gallery", "Corrected release date", "Fixed a typo").

            Old Wikitext:
            """
            ${oldWikitext}
            """

            New Wikitext:
            """
            ${newWikitext}
            """
        `;

    const response = await streamPrompt(prompt, onChunk);
    // Clean up the output in case the AI adds quotes or newlines.
    return response.replace(/^["']|["']$/g, '').replace(/\r?\n/g, ' ').trim();
}

/** Resolves a 3-way wikitext merge, returning the full merged wikitext (no conflict markers). */
export async function resolveMerge(local: string, base: string, online: string): Promise<string> {
    const prompt = `
            You are merging three versions of a MediaWiki wikitext page.
            Produce the single best merged wikitext that keeps the intent of BOTH the local and online edits.
            Resolve every conflict sensibly; never emit conflict markers (<<<<<<<, =======, >>>>>>>).
            Output ONLY the raw merged wikitext, no explanations, no code fences.

            BASE (common ancestor):
            """
            ${base}
            """

            LOCAL (your version):
            """
            ${local}
            """

            ONLINE (PCGamingWiki version):
            """
            ${online}
            """
        `;
    const response = await streamPrompt(prompt);
    // Strip any markdown code fences the model may add despite instructions.
    return response.replace(/^```(?:\w*)?\s*\n?|\n?\s*```$/g, '');
}

/** Analyzes an image (Base64) against a Zod schema and returns the validated object. */
export async function analyzeImageJSON<T>(imageBase64: string, schema: z.ZodType<T>, prompt: string): Promise<T> {
    try {
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        const { object } = await generateObject({
            model: getModel(),
            schema,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image', image: cleanBase64, mediaType: 'image/png' },
                    ],
                },
            ],
        });
        return object;
    } catch (error) {
        console.error('AI analyzeImageJSON error:', error);
        throw error;
    }
}

/**
 * Google-only: generates structured JSON using Google Search grounding.
 * Grounding + structured output don't compose, so we run generateText with the
 * search tool and validate the returned JSON against the schema.
 */
export async function generateJSONWithSearch<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const apiKey = aiConfig.keys.google;
    if (!apiKey) throw new Error('A Google API key is required for web-grounded metadata search.');

    try {
        const google = createGoogleGenerativeAI({ apiKey });
        const modelId = aiConfig.provider === 'google' ? aiConfig.model : 'gemini-3.5-flash';
        const { text } = await generateText({
            model: google(modelId),
            prompt,
            tools: { google_search: google.tools.googleSearch({}) },
        });
        if (!text) throw new Error('No response from AI');

        // Strip any markdown code fences the model may add despite instructions.
        const json = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
        return schema.parse(JSON.parse(json));
    } catch (error) {
        console.error('AI generateJSONWithSearch error:', error);
        throw error;
    }
}
