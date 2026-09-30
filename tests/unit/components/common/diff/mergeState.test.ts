import { describe, expect, it } from 'vitest';
import { EditorState, Transaction } from '@codemirror/state';
import { history, undo, redo, undoDepth } from '@codemirror/commands';
import { createMergeModel, isResolved, mergeAction, mergeHistory, mergeModelField, type MergeAction, type Side } from '@/components/common/diff/mergeState';

function session(local: string, base: string, online: string) {
    const { model, text } = createMergeModel(local, base, online);
    let state = EditorState.create({ doc: text, extensions: [mergeModelField.init(() => model), history(), mergeHistory] });
    const target = { get state() { return state; }, dispatch(tr: Transaction) { state = tr.state; } };
    return {
        get state() { return state; },
        get text() { return state.doc.toString(); },
        get model() { return state.field(mergeModelField); },
        action(index: number, action: MergeAction, side: Side) { state = state.update(mergeAction(state, index, action, side, '')).state; },
        edit(from: number, to: number, insert: string) { state = state.update({ changes: { from, to, insert }, annotations: Transaction.userEvent.of('input.type') }).state; },
        undo() { return undo(target); },
        redo() { return redo(target); },
    };
}

describe('three-way merge editor state', () => {
    it('accepts one side without resolving the other; ignore does not accept the opposite side', () => {
        const s = session('mine', 'base', 'theirs');
        s.action(0, 'ignore', 'left');
        expect(s.text).toBe('base');
        expect(isResolved(s.model.resolutions[0])).toBe(false);
        s.action(0, 'accept', 'right');
        expect(s.text).toBe('theirs');
        expect(isResolved(s.model.resolutions[0])).toBe(true);
    });

    it.each([['left', 'right', 'mine\ntheirs'], ['right', 'left', 'theirs\nmine']] as const)('keeps both accepted sides in click order %s then %s', (first, second, expected) => {
        const s = session('mine', 'base', 'theirs');
        s.action(0, 'accept', first);
        expect(isResolved(s.model.resolutions[0])).toBe(false);
        s.action(0, 'accept', second);
        expect(s.text).toBe(expected);
        expect(isResolved(s.model.resolutions[0])).toBe(true);
    });

    it('ignores both sides without changing the base', () => {
        const s = session('mine', 'base', 'theirs');
        s.action(0, 'ignore', 'left');
        s.action(0, 'ignore', 'right');
        expect(s.text).toBe('base');
        expect(isResolved(s.model.resolutions[0])).toBe(true);
    });

    it('resolves using one side in one action', () => {
        const s = session('mine', 'base', 'theirs');
        s.action(0, 'resolve', 'left');
        expect(s.text).toBe('mine');
        expect(s.model.resolutions[0]).toEqual({ left: 'accepted', right: 'ignored' });
    });

    it('can resolve a one-sided change using the unchanged opposite side', () => {
        const s = session('mine', 'base', 'base');
        s.action(0, 'resolve', 'right');
        expect(s.text).toBe('base');
        expect(isResolved(s.model.resolutions[0])).toBe(true);
    });

    it('accepts identical insertions only once', () => {
        const s = session('a\nsame\nb', 'a\nb', 'a\nsame\nb');
        s.action(1, 'accept', 'right');
        expect(s.text).toBe('a\nsame\nb');
        expect(isResolved(s.model.resolutions[1])).toBe(true);
    });

    it('distinguishes a deleted line from an empty replacement line', () => {
        const s = session('start\nend', 'start\nX\nend', 'start\n\nend');
        s.action(1, 'accept', 'left');
        expect(s.text).toBe('start\nend');
        expect(isResolved(s.model.resolutions[1])).toBe(false);
        s.action(1, 'accept', 'right');
        expect(s.text).toBe('start\n\nend');
        expect(isResolved(s.model.resolutions[1])).toBe(true);
    });

    it.each([
        ['a\nX\nb', 'a\nb'], ['X\na', 'a'], ['a\nX', 'a'],
        ['a\nb', 'a\nX\nb'], ['b', 'a\nb'], ['a', 'a\nb'],
        ['a\n\nb', 'a\nb'], ['a\nb', 'a\n\nb'], ['a\n', 'a'], ['a', 'a\n'],
        ['', 'a'], ['a', ''],
    ])('applies and reverts insertion/deletion %j against %j', (local, base) => {
        const s = session(local, base, base);
        const index = s.model.hunks.findIndex((h) => h.type === 'left');
        s.action(index, 'accept', 'left');
        expect(s.text).toBe(local);
        s.action(index, 'reset', 'left');
        expect(s.text).toBe(base);
        expect(isResolved(s.model.resolutions[index])).toBe(false);
    });

    it('preserves manual edits elsewhere when a different block is applied', () => {
        const s = session('a\nmine\nz', 'a\nbase\nz', 'a\ntheirs\nz');
        s.edit(0, 1, 'manual\nheader');
        s.edit(s.text.length - 1, s.text.length, 'footer');
        s.action(1, 'resolve', 'left');
        expect(s.text).toBe('manual\nheader\nmine\nfooter');
    });

    it('preserves edits to an accepted side when accepting the other side', () => {
        const s = session('mine', 'base', 'theirs');
        s.action(0, 'accept', 'left');
        s.edit(0, 4, 'edited');
        s.action(0, 'accept', 'right');
        expect(s.text).toBe('edited\ntheirs');
    });

    it('marks a manually edited block resolved without overwriting its text', () => {
        const s = session('mine', 'base', 'theirs');
        s.edit(0, 4, 'manual');
        s.action(0, 'manual', 'left');
        expect(s.text).toBe('manual');
        expect(isResolved(s.model.resolutions[0])).toBe(true);
        s.undo();
        expect(s.text).toBe('manual');
        expect(isResolved(s.model.resolutions[0])).toBe(false);
    });

    it('undoes and redoes typing and merge decisions in the same history', () => {
        const s = session('a\nmine\nz', 'a\nbase\nz', 'a\ntheirs\nz');
        s.edit(0, 1, 'manual');
        s.action(1, 'accept', 'left');
        s.action(1, 'ignore', 'right');
        expect(s.text).toBe('manual\nmine\nz');
        s.undo();
        expect(isResolved(s.model.resolutions[1])).toBe(false);
        s.undo();
        expect(s.text).toBe('manual\nbase\nz');
        s.undo();
        expect(s.text).toBe('a\nbase\nz');
        s.redo(); s.redo(); s.redo();
        expect(s.text).toBe('manual\nmine\nz');
        expect(isResolved(s.model.resolutions[1])).toBe(true);
    });

    it('restores exact block ranges after undoing grouped typing and whole-document deletion', () => {
        const s = session('a\nmine\nz', 'a\nbase\nz', 'a\ntheirs\nz');
        const original = s.model.ranges;
        s.edit(0, 0, 'x');
        s.edit(1, 1, 'y');
        expect(undoDepth(s.state)).toBe(1);
        s.undo();
        expect(s.model.ranges).toEqual(original);
        s.edit(0, s.text.length, '');
        s.undo();
        expect(s.model.ranges).toEqual(original);
        s.action(1, 'resolve', 'right');
        expect(s.text).toBe('a\ntheirs\nz');
    });
});
