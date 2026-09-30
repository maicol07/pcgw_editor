import { StateEffect, StateField, type EditorState, type TransactionSpec } from '@codemirror/state';
import { invertedEffects, isolateHistory } from '@codemirror/commands';
import { buildResult, computeHunks, defaultChoices, hunkLineCount, hunkText, isConflict, type Hunk, type HunkRange } from './merge3';

export type Side = 'left' | 'right';
export type Decision = 'pending' | 'accepted' | 'ignored';
export type Resolution = { left: Decision; right: Decision };
export type MergeModel = { hunks: Hunk[]; ranges: HunkRange[]; resolutions: Resolution[] };
export type MergeAction = 'accept' | 'ignore' | 'resolve' | 'reset' | 'manual' | 'simple';

export function initialResolution(h: Hunk): Resolution {
    return { left: h.type === 'right' || h.type === 'stable' ? 'ignored' : 'pending', right: h.type === 'left' || h.type === 'stable' ? 'ignored' : 'pending' };
}

export function createMergeModel(local: string, base: string, online: string): { model: MergeModel; text: string } {
    const hunks = computeHunks(local, base, online);
    const { text, ranges } = buildResult(hunks, defaultChoices(hunks));
    return { text, model: { hunks, ranges, resolutions: hunks.map(initialResolution) } };
}

export const isResolved = (r: Resolution): boolean => r.left !== 'pending' && r.right !== 'pending';
export const setMergeModel = StateEffect.define<MergeModel>();
export const mergeModelField = StateField.define<MergeModel>({
    create() { throw new Error('Merge model must be initialized'); },
    update(model, tr) {
        let restored: MergeModel | null = null;
        for (const effect of tr.effects) if (effect.is(setMergeModel)) restored = effect.value;
        if (restored) return restored;
        if (!tr.docChanged) return model;
        return { ...model, ranges: model.ranges.map((r) => {
            const from = tr.changes.mapPos(r.from, r.empty || r.from > 0 ? 1 : -1);
            const to = Math.max(from, tr.changes.mapPos(r.to, r.empty || r.to === tr.startState.doc.length ? 1 : -1));
            return { ...r, from, to, empty: r.empty && from === to };
        }) };
    },
});

// Store resolution decisions in the same history events as edits to the result.
export const mergeHistory = invertedEffects.of((tr) =>
    tr.docChanged || tr.effects.some((effect) => effect.is(setMergeModel))
        ? [setMergeModel.of(tr.startState.field(mergeModelField))]
        : []);

export function mergeAction(state: EditorState, index: number, action: MergeAction, side: Side, simpleText: string): TransactionSpec {
    const model = state.field(mergeModelField);
    const h = model.hunks[index];
    const range = model.ranges[index];
    const old = model.resolutions[index];
    const other = side === 'left' ? 'right' : 'left';
    let resolution = { ...old };
    let text = state.doc.sliceString(range.from, range.to);
    let empty = range.empty;
    let replace = false;
    const choice = h.type === 'conflict' ? side : h.type === side ? 'include' : 'discard';

    if (action === 'reset') {
        resolution = initialResolution(h);
        text = hunkText(h, 'unresolved');
        empty = hunkLineCount(h, 'unresolved') === 0;
        replace = true;
    } else if (action === 'manual') {
        resolution = { left: 'ignored', right: 'ignored' };
    } else if (action === 'ignore') {
        resolution[side] = 'ignored';
    } else if (action === 'simple') {
        resolution = { left: 'accepted', right: 'accepted' };
        text = simpleText;
        empty = simpleText === '' && hunkLineCount(h, 'left') === 0 && hunkLineCount(h, 'right') === 0;
        replace = true;
    } else {
        if (action === 'accept' && old[side] !== 'pending') return {};
        const piece = hunkText(h, choice);
        const pieceEmpty = hunkLineCount(h, choice) === 0;
        if (action === 'accept' && old[other] === 'accepted' && isConflict(h)) {
            // A second accept appends to the current result, including manual edits in this block.
            text = [empty ? null : text, pieceEmpty ? null : piece].filter((s) => s !== null).join('\n');
            empty = empty && pieceEmpty;
        } else {
            text = piece;
            empty = pieceEmpty;
        }
        resolution[side] = 'accepted';
        if (action === 'resolve') resolution[other] = 'ignored';
        if (h.type === 'conflict' && !isConflict(h)) resolution[other] = 'accepted';
        replace = true;
    }

    let from = range.from, to = range.to, insert = text, contentFrom = from;
    if (replace) {
        if (range.empty && !empty && state.doc.length > 0) {
            if (from > 0) { insert = '\n' + text; contentFrom++; }
            else insert = text + '\n';
        } else if (!range.empty && empty) {
            if (from > 0) { from--; contentFrom = from; }
            else if (to < state.doc.length) to++;
        }
    }
    const changes = state.changes(replace ? { from, to, insert: empty ? '' : insert } : []);
    const ranges = model.ranges.map((r, i): HunkRange => {
        if (i === index && replace) return { ...r, from: contentFrom, to: contentFrom + (empty ? 0 : text.length), empty };
        const start = changes.mapPos(r.from, i < index ? -1 : 1);
        const end = Math.max(start, changes.mapPos(r.to, i < index ? -1 : 1));
        return { ...r, from: start, to: end };
    });
    return {
        changes,
        effects: setMergeModel.of({ ...model, ranges, resolutions: model.resolutions.map((r, i) => i === index ? resolution : r) }),
        annotations: isolateHistory.of('full'),
    };
}
