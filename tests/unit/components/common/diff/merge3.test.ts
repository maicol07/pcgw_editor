import { describe, it, expect } from 'vitest';
import {
    findConflicts, changedLineSet, computeHunks, defaultChoices, simpleMerge, isConflict, buildResult, wordDiff,
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

    it('starts from the ancestor: nothing is applied until a side is picked', () => {
        const hunks = computeHunks('LOCAL\nbase\nline3', base, 'line1\nbase\nONLINE');
        const choices = defaultChoices(hunks);
        expect(buildResult(hunks, choices).text).toBe(base);

        hunks.forEach((h, i) => { if (h.type === 'left') choices[i] = 'include'; });
        expect(buildResult(hunks, choices).text).toBe('LOCAL\nbase\nline3');

        hunks.forEach((h, i) => { if (h.type === 'right') choices[i] = 'include'; });
        expect(buildResult(hunks, choices).text).toBe('LOCAL\nbase\nONLINE');
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

    it('an undecided conflict shows the ancestor, never conflict markers', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        const choices = defaultChoices(hunks);
        const ci = hunks.findIndex((h) => h.type === 'conflict');
        expect(choices[ci]).toBe('unresolved');
        const { text } = buildResult(hunks, choices);
        expect(text).toBe(base);
        expect(findConflicts(text)).toHaveLength(0);
    });

    it('every changed block starts undecided', () => {
        const hunks = computeHunks('LOCAL\nbase\nline3', base, 'line1\nbase\nONLINE');
        const choices = defaultChoices(hunks);
        hunks.forEach((h, i) => expect(choices[i]).toBe(h.type === 'stable' ? 'include' : 'unresolved'));
    });

    it('keeps a zero-width range for an accepted deletion so the gutter can anchor to it', () => {
        const local = 'line1\nline3'; // deleted the middle line
        const hunks = computeHunks(local, base, base);
        const li = hunks.findIndex((h) => h.type === 'left');
        expect(li).toBeGreaterThanOrEqual(0);

        const choices = defaultChoices(hunks);
        expect(buildResult(hunks, choices).text).toBe(base); // undecided: the line is still there

        choices[li] = 'include';
        const { text, ranges } = buildResult(hunks, choices);
        expect(text).toBe(local); // the empty piece must not inject a blank line
        expect(ranges).toHaveLength(hunks.length);
        const deleted = ranges.find((r) => r.hunk === li)!;
        expect(deleted.from).toBe(deleted.to);
    });

    it('leaves overlapping character changes unresolved', () => {
        const hunks = computeHunks('line1\nMINE\nline3', base, 'line1\nTHEIRS\nline3');
        expect(simpleMerge(hunks.find((h) => h.type === 'conflict')!)).toBeNull();
    });

    it('merges disjoint edits within the same line', () => {
        const hunks = computeHunks('red middle last', 'first middle last', 'first middle blue');
        expect(simpleMerge(hunks[0])).toBe('red middle blue');
    });

    it('treats competing insertions at the same position as one conflict', () => {
        const hunks = computeHunks('a\nleft\nb', 'a\nb', 'a\nright\nb');
        expect(hunks.filter(isConflict)).toHaveLength(1);
        expect(buildResult(hunks, defaultChoices(hunks)).text).toBe('a\nb');
    });

    it('recognizes identical changes as non-conflicting', () => {
        const hunks = computeHunks('a\nsame\nb', 'a\nb', 'a\nsame\nb');
        expect(hunks.filter(isConflict)).toHaveLength(0);
        expect(buildResult(hunks, defaultChoices(hunks)).text).toBe('a\nb');
    });

    it.each(['a\n', '\na', 'a\n\nb', '\n', ''])('preserves blank lines in the initial base %j', (text) => {
        const hunks = computeHunks(text, text, text);
        expect(buildResult(hunks, defaultChoices(hunks)).text).toBe(text);
    });
});

describe('word diff', () => {
    const slice = (s: string, ranges: [number, number][]) => ranges.map(([f, t]) => s.slice(f, t));

    it('marks only the words that changed, on both sides', () => {
        const a = 'the quick brown fox';
        const b = 'the slow brown fox';
        const d = wordDiff(a, b);
        expect(slice(a, d.a)).toEqual(['quick']);
        expect(slice(b, d.b)).toEqual(['slow']);
    });

    it('reports an insertion on one side only', () => {
        const a = '{{disambig|1=x}}';
        const b = '{{stub}}\n{{disambig|1=x}}';
        const d = wordDiff(a, b);
        expect(d.a).toEqual([]);
        expect(slice(b, d.b).join('')).toContain('stub');
    });

    it('is empty for identical text', () => {
        expect(wordDiff('same text', 'same text')).toEqual({ a: [], b: [] });
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
