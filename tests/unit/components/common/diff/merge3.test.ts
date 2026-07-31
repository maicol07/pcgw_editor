import { describe, it, expect } from 'vitest';
import {
    findConflicts, changedLineSet, computeHunks, defaultChoices, smartChoices, buildResult,
} from '@/components/common/diff/merge3';

const base = 'line1\nbase\nline3';

describe('hunk model', () => {
    it('classifies one-sided changes as left/right', () => {
        const local = 'LOCAL\nbase\nline3';   // changed line1
        const online = 'line1\nbase\nONLINE'; // changed line3
        const hunks = computeHunks(local, base, online);
        const types = hunks.map((h) => h.type).sort();
        expect(types).toEqual(['left', 'right', 'stable']);
    });

    it('flags overlapping changes as a conflict', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        const conflict = hunks.find((h) => h.type === 'conflict') as any;
        expect(conflict).toBeDefined();
        expect(conflict.local).toBe('MINE');
        expect(conflict.online).toBe('THEIRS');
    });

    it('default build auto-merges one-sided changes and leaves conflicts marked', () => {
        const hunks = computeHunks('LOCAL\nbase\nline3', base, 'line1\nbase\nONLINE');
        const { text } = buildResult(hunks, defaultChoices(hunks));
        expect(text).toContain('LOCAL');
        expect(text).toContain('ONLINE');
        expect(findConflicts(text)).toHaveLength(0);
    });

    it('per-hunk choices pick a side and resolve the conflict', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        const choices = defaultChoices(hunks);
        const ci = hunks.findIndex((h) => h.type === 'conflict');
        choices[ci] = 'right';
        const { text } = buildResult(hunks, choices);
        expect(text).toBe('line1\nTHEIRS\nline3');
        expect(findConflicts(text)).toHaveLength(0);
    });

    it('discard reverts a one-sided change to base', () => {
        const hunks = computeHunks('LOCAL\nbase\nline3', base, base);
        const li = hunks.findIndex((h) => h.type === 'left');
        const choices = defaultChoices(hunks);
        choices[li] = 'discard';
        expect(buildResult(hunks, choices).text).toBe(base);
    });

    it('conflicts start unresolved and render markers until a side is picked', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        const choices = defaultChoices(hunks);
        const ci = hunks.findIndex((h) => h.type === 'conflict');
        expect(choices[ci]).toBe('unresolved');
        expect(findConflicts(buildResult(hunks, choices).text)).toHaveLength(1);
        choices[ci] = 'left';
        expect(findConflicts(buildResult(hunks, choices).text)).toHaveLength(0);
    });

    it('only conflicts start unresolved — one-sided changes are pre-applied', () => {
        const hunks = computeHunks('LOCAL\nbase\nline3', base, 'line1\nbase\nONLINE');
        const choices = defaultChoices(hunks);
        hunks.forEach((h, i) => expect(choices[i]).toBe(h.type === 'conflict' ? 'unresolved' : 'include'));
    });

    it('keeps a zero-width range for a deletion so the gutter can anchor to it', () => {
        const local = 'line1\nline3'; // deleted the middle line
        const hunks = computeHunks(local, base, base);
        const li = hunks.findIndex((h) => h.type === 'left');
        expect(li).toBeGreaterThanOrEqual(0);

        const { text, ranges } = buildResult(hunks, defaultChoices(hunks));
        expect(text).toBe(local); // the empty piece must not inject a blank line
        expect(ranges).toHaveLength(hunks.length);
        const deleted = ranges.find((r) => r.hunk === li)!;
        expect(deleted.from).toBe(deleted.to);
    });

    it('smart resolves conflicts to both sides', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        const { text } = buildResult(hunks, smartChoices(hunks));
        expect(text).toContain('MINE');
        expect(text).toContain('THEIRS');
        expect(findConflicts(text)).toHaveLength(0);
    });
});

describe('line diff helpers', () => {
    it('reports no conflicts once markers are removed', () => {
        expect(findConflicts('clean\nresolved\ntext')).toHaveLength(0);
    });

    it('flags changed/added lines vs base', () => {
        const changed = changedLineSet('a\nb\nc', 'a\nX\nc\nNEW');
        expect([...changed].sort()).toEqual([1, 3]); // modified line 1, added line 3
        expect(changedLineSet('same\ntext', 'same\ntext').size).toBe(0);
    });
});
