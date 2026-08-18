import type { AIProvider } from './aiConfig';

export interface AIModelOption {
    id: string;
    label: string;
}

const CACHE_PREFIX = 'ai-models-cache-';

/** Loads cached models from localStorage if available. */
export function getCachedModels(provider: AIProvider): AIModelOption[] | null {
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${provider}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
        // Ignore cache parsing errors
    }
    return null;
}

/** Saves models to localStorage cache. */
export function setCachedModels(provider: AIProvider, models: AIModelOption[]): void {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${provider}`, JSON.stringify(models));
    } catch {
        // Ignore storage errors (quota, etc.)
    }
}

/** Fetches available Google Gemini models via REST API (text generation only). */
async function fetchGoogleModels(apiKey: string): Promise<AIModelOption[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Google API error (${response.status}): ${text || response.statusText}`);
    }
    const data = await response.json();
    const list: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }> =
        data?.models || [];

    const nonTextPattern = /(imagen|embedding|aqa|veo|audio|tts|whisper)/i;

    const models: AIModelOption[] = list
        .filter(
            (m) =>
                m.name &&
                m.supportedGenerationMethods?.includes('generateContent') &&
                !nonTextPattern.test(m.name),
        )
        .map((m) => {
            const id = m.name!.replace(/^models\//, '');
            return {
                id,
                label: m.displayName || id,
            };
        });

    return models;
}

/** Fetches available OpenAI models via REST API (text generation only). */
async function fetchOpenAIModels(apiKey: string): Promise<AIModelOption[]> {
    const url = 'https://api.openai.com/v1/models';
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`OpenAI API error (${response.status}): ${text || response.statusText}`);
    }
    const data = await response.json();
    const list: Array<{ id?: string; created?: number }> = data?.data || [];

    const excludedPattern =
        /(realtime|audio|transcription|speech|tts|whisper|dall-e|image|video|sora|embedding|moderation|similarity|search|babbage|davinci|curie|ada)/i;
    const includedPattern = /^(gpt-[345]|o[1-9]|chatgpt)/i;

    const filtered = list.filter((m) => m.id && includedPattern.test(m.id) && !excludedPattern.test(m.id));

    // Sort newer models (by created timestamp) first
    filtered.sort((a, b) => (b.created || 0) - (a.created || 0));

    return filtered.map((m) => ({
        id: m.id!,
        label: m.id!,
    }));
}

/** Fetches available Anthropic models via REST API (text generation only). */
async function fetchAnthropicModels(apiKey: string): Promise<AIModelOption[]> {
    const url = 'https://api.anthropic.com/v1/models?limit=100';
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Anthropic API error (${response.status}): ${text || response.statusText}`);
    }
    const data = await response.json();
    const list: Array<{ id?: string; display_name?: string; created_at?: string }> = data?.data || [];

    const excludedPattern = /(embedding|image|audio|tts|whisper)/i;

    // Filter Claude models and exclude any non-text modalities
    const filtered = list.filter((m) => m.id && m.id.startsWith('claude-') && !excludedPattern.test(m.id));

    // Sort newest first if created_at is present
    filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return filtered.map((m) => ({
        id: m.id!,
        label: m.display_name || m.id!,
    }));
}

/**
 * Fetches available models dynamically from the given provider's API.
 * Automatically updates localStorage cache on success.
 */
export async function fetchProviderModels(provider: AIProvider, apiKey: string): Promise<AIModelOption[]> {
    if (!apiKey) throw new Error(`Cannot fetch models: No API key for ${provider}`);

    let models: AIModelOption[] = [];
    switch (provider) {
        case 'google':
            models = await fetchGoogleModels(apiKey);
            break;
        case 'openai':
            models = await fetchOpenAIModels(apiKey);
            break;
        case 'anthropic':
            models = await fetchAnthropicModels(apiKey);
            break;
    }

    if (models.length > 0) {
        setCachedModels(provider, models);
    }
    return models;
}
