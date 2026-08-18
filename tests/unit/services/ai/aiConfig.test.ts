import { describe, it, expect, beforeEach } from 'vitest';
import { loadKeys, aiConfig } from '../../../../src/services/ai/aiConfig';
import { getModel } from '../../../../src/services/ai/AIService';

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

        expect((getModel('openai', 'gpt-4o-mini') as any).modelId).toBe('gpt-4o-mini');
        expect((getModel('anthropic', 'claude-3-5-haiku-latest') as any).modelId).toBe('claude-3-5-haiku-latest');
        expect((getModel('google', 'gemini-2.5-flash') as any).modelId).toBe('gemini-2.5-flash');
    });

    it('throws when the selected provider has no key', () => {
        aiConfig.keys.openai = '';
        expect(() => getModel('openai', 'gpt-4o-mini')).toThrow(/No API key/);
    });
});
