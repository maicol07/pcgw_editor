import type { Component } from 'vue';
import { GooglegeminiIcon, OpenaigymIcon, AnthropicIcon } from '@mkody/vue3-simple-icons';
import type { AIProvider } from '../../services/ai/aiConfig';

export const GeminiLogo = GooglegeminiIcon;
export const OpenAiLogo = OpenaigymIcon;
export const AnthropicLogo = AnthropicIcon;

export const PROVIDER_LOGOS: Record<AIProvider, Component> = {
    google: GooglegeminiIcon,
    openai: OpenaigymIcon,
    anthropic: AnthropicIcon,
};
