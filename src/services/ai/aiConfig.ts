import { reactive, watch } from 'vue';

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

// Short curated list per provider. The model field is also free-text editable in the UI.
export const MODELS: Record<AIProvider, { id: string; label: string }[]> = {
    google: [
        { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
        { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
        { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    ],
    openai: [
        { id: 'gpt-5.5', label: 'GPT-5.5' },
        { id: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
        { id: 'gpt-5.4', label: 'GPT-5.4' },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    ],
    anthropic: [
        { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
        { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
        { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
    ],
};

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
    model: localStorage.getItem('ai-model') || MODELS[initialProvider][0].id,
    keys: loadKeys(),
});

watch(() => aiConfig.provider, (v) => localStorage.setItem('ai-provider', v));
watch(() => aiConfig.model, (v) => localStorage.setItem('ai-model', v));
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
