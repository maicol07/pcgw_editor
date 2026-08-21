import { reactive, ref, watch } from 'vue';
import { getCachedModels, fetchProviderModels, type AIModelOption } from './modelFetcher';

// ponytail: module singleton, switch to Pinia only if cross-tab sync is ever needed
export type AIProvider = 'google' | 'openai' | 'anthropic';

export const PROVIDERS: AIProvider[] = ['google', 'openai', 'anthropic'];

export const PROVIDER_LABELS: Record<AIProvider, string> = {
    google: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic Claude',
};

// Where to get a key, shown in settings.
export const PROVIDER_KEY_LINKS: Record<AIProvider, string> = {
    google: 'https://aistudio.google.com/apikey',
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
};

export const availableModels = reactive<Record<AIProvider, AIModelOption[]>>({
    google: getCachedModels('google') || [],
    openai: getCachedModels('openai') || [],
    anthropic: getCachedModels('anthropic') || [],
});

export const isFetchingModels = ref(false);
export const modelFetchError = ref<string | null>(null);

/** Fetches dynamic models from the provider API if key is present and updates availableModels. */
export async function refreshAvailableModels(provider: AIProvider = aiConfig.provider): Promise<AIModelOption[]> {
    const key = aiConfig.keys[provider];
    if (!key) {
        return availableModels[provider];
    }
    isFetchingModels.value = true;
    modelFetchError.value = null;
    try {
        const fetched = await fetchProviderModels(provider, key);
        if (fetched && fetched.length > 0) {
            availableModels[provider] = fetched;
            return fetched;
        }
    } catch (err: any) {
        console.warn(`Failed to fetch models for ${provider}:`, err);
        modelFetchError.value = err?.message || 'Failed to fetch models';
    } finally {
        isFetchingModels.value = false;
    }
    return availableModels[provider];
}

/** Loads per-provider keys, migrating the legacy single Gemini key into the Google slot. */
export function loadKeys(): Record<AIProvider, string> {
    const keys: Record<AIProvider, string> = {
        google: localStorage.getItem('ai-key-google') || '',
        openai: localStorage.getItem('ai-key-openai') || '',
        anthropic: localStorage.getItem('ai-key-anthropic') || '',
    };
    const legacy = localStorage.getItem('gemini-api-key');
    if (legacy && !keys.google) keys.google = legacy; // leave the old key intact for safety
    return keys;
}

const storedProvider = localStorage.getItem('ai-provider') as AIProvider | null;
const initialProvider: AIProvider =
    storedProvider && PROVIDERS.includes(storedProvider) ? storedProvider : 'google';

export const aiConfig = reactive({
    provider: initialProvider,
    model: localStorage.getItem('ai-model') || availableModels[initialProvider][0]?.id || '',
    keys: loadKeys(),
    hideAi: localStorage.getItem('hideAiFeatures') === 'true',
});

watch(() => aiConfig.provider, (v) => localStorage.setItem('ai-provider', v));
watch(() => aiConfig.model, (v) => localStorage.setItem('ai-model', v));
watch(() => aiConfig.hideAi, (v) => localStorage.setItem('hideAiFeatures', v.toString()));
watch(
    () => ({ ...aiConfig.keys }),
    (keys) => {
        for (const p of PROVIDERS) localStorage.setItem(`ai-key-${p}`, keys[p]);
    },
    { deep: true },
);

export const activeKey = () => aiConfig.keys[aiConfig.provider];
export const hasActiveKey = () => !!activeKey();
export const hasGoogleKey = () => !!aiConfig.keys.google;
