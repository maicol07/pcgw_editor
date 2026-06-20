import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadKeys } from './aiConfig';
import { getModel } from './AIService';
import { aiConfig } from './aiConfig';

describe('loadKeys migration', () => {
    beforeEach(() => localStorage.clear());

    it('migrates legacy gemini-api-key into the google slot', () => {
        localStorage.setItem('gemini-api-key', 'legacy123');
        expect(loadKeys().google).toBe('legacy123');
    });

    it('does not override an existing google key', () => {
        localStorage.setItem('gemini-api-key', 'legacy123');
        localStorage.setItem('ai-key-google', 'real456');
        expect(loadKeys().google).toBe('real456');
    });
});

describe('getModel provider selection', () => {
    it('builds the right provider/model for each selection', () => {
        aiConfig.keys.google = 'g';
        aiConfig.keys.openai = 'o';
        aiConfig.keys.anthropic = 'a';

        expect(getModel('openai', 'gpt-5.4-mini').modelId).toBe('gpt-5.4-mini');
        expect(getModel('anthropic', 'claude-haiku-4-5').modelId).toBe('claude-haiku-4-5');
        expect(getModel('google', 'gemini-3.5-flash').modelId).toBe('gemini-3.5-flash');
    });

    it('throws when the selected provider has no key', () => {
        aiConfig.keys.openai = '';
        expect(() => getModel('openai', 'gpt-5.4-mini')).toThrow(/No API key/);
    });
});
