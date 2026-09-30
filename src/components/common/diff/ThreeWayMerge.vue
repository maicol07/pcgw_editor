<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { EditorView, Decoration, WidgetType, keymap, lineNumbers, drawSelection, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Prec, type Range, type Text } from '@codemirror/state';
import { history, undo as cmUndo, redo as cmRedo, undoDepth, redoDepth, historyKeymap, defaultKeymap, isolateHistory } from '@codemirror/commands';
import Button from 'openvue/button';
import {
    ChevronsLeft, ChevronsRight, FoldHorizontal, Wand2, Bot, ArrowLeft, ArrowRight, X,
    Undo2, Redo2, UnfoldVertical, FoldVertical, ChevronUp, ChevronDown, Check, LockKeyhole, Link, WrapText, RotateCcw,
} from '@lucide/vue';
import {
    findConflicts, isConflict, simpleMerge, wordDiff, type Hunk, type HunkRange,
} from './merge3';
import { createMergeModel, isResolved, mergeAction, mergeModelField, mergeHistory, setMergeModel, type Resolution, type Side, type MergeAction } from './mergeState';
// AIService is imported lazily at the call site: a static import pulls the three @ai-sdk
// providers (~700 kB) into the startup bundle for a feature many sessions never use.
import { wikitextExtensions, isDark } from './cmWikitext';
import { useUiStore } from '../../../stores/ui';
import { aiConfig } from '../../../services/ai/aiConfig';

const props = defineProps<{
    local: string;
    base: string;
    online: string;
}>();

const uiStore = useUiStore();

const emit = defineEmits<{
    (e: 'update:result', value: string): void;
    (e: 'update:conflictsResolved', value: boolean): void;
}>();

const COLLAPSE_MIN = 6; // collapse stable regions at least this many lines long

let hunks: Hunk[] = [];
let resolutions: Resolution[] = [];
let ranges: HunkRange[] = [];
let resultText = ''; // merged text as last derived from the model
const expanded = new Set<number>(); // stable hunks the user expanded
// Nothing is preselected: a block is "decided" exactly when it no longer holds the ancestor by default.
const isDecided = (i: number) => isResolved(resolutions[i]);
const collapseOn = ref(false);
const scrollLocked = ref(true);
const wrapLines = ref(false);
const aiLoading = ref(false);
const aiError = ref('');
const unresolvedCount = ref(0);
const conflictCount = ref(0);
const currentConflictIndex = ref(-1);
const selectedConflict = ref(false);
const simpleCount = ref(0);

// One gutter entry per visible change: which hunk, its kind, the resolution the user picked (none is
// preselected), its y offset, and the block geometry used to draw the connector.
type ChangeKind = 'modified' | 'inserted' | 'deleted' | 'conflict';
type Marker = { i: number; type: ChangeKind; pending: boolean; resolved: boolean; top: number; link: string };
const markersL = ref<Marker[]>([]), markersR = ref<Marker[]>([]);
const bodyHeight = ref(0); // gutter SVG viewBox height, in the same px space as marker tops
const GUTTER_W = 48;

// Merge decisions and typing share CodeMirror's history.
const canUndo = ref(false), canRedo = ref(false);
const syncHist = () => {
    canUndo.value = !!center && undoDepth(center.state) > 0;
    canRedo.value = !!center && redoDepth(center.state) > 0;
};
function undo() {
    return !!center && cmUndo(center);
}
function redo() {
    return !!center && cmRedo(center);
}

// ---- decorations ----
const setDeco = StateEffect.define<DecorationSet>();
const decoField = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(deco, tr) {
        deco = deco.map(tr.changes);
        for (const e of tr.effects) if (e.is(setDeco)) deco = e.value;
        return deco;
    },
    provide: (f) => EditorView.decorations.from(f),
});

// lucide "unfold-vertical" — same glyph as the toolbar collapse toggle.
const UNFOLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-6"/><path d="M12 8V2"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/><path d="m15 19-3 3-3-3"/><path d="m15 5-3-3-3 3"/></svg>`;

class FoldWidget extends WidgetType {
    constructor(readonly hunk: number, readonly count: number) { super(); }
    eq(o: FoldWidget) { return o.hunk === this.hunk && o.count === this.count; }
    toDOM() {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'cm-fold';
        el.innerHTML = `${UNFOLD_SVG}<span>${this.count} unchanged lines</span>`;
        el.title = 'Click to expand';
        el.onclick = () => { expanded.add(this.hunk); refreshDecos(); };
        return el;
    }
    ignoreEvent() { return false; }
}

// Collapse a stable region [fromLine, toLine] (1-based, inclusive) if long enough.
function foldRange(doc: Text, fromLine: number, toLine: number, hunk: number): Range<Decoration> | null {
    const count = toLine - fromLine + 1;
    if (!collapseOn.value || expanded.has(hunk) || count < COLLAPSE_MIN) return null;
    const from = doc.line(fromLine).from, to = doc.line(toLine).to;
    return Decoration.replace({ widget: new FoldWidget(hunk, count), block: true }).range(from, to);
}

// Use the same change colors in all three panes.
function hunkClass(h: Hunk, i: number): string {
    const cls = `cm-merge-${changeKind(h)}`;
    return isDecided(i) ? `${cls} cm-resolved` : cls;
}

function changeKind(h: Hunk): ChangeKind {
    if (isConflict(h)) return 'conflict';
    if (h.type === 'stable') return 'modified';
    if (h.bRange[0] === h.bRange[1]) return 'inserted';
    if (h.type === 'left' ? h.lRange[0] === h.lRange[1] : h.oRange[0] === h.oRange[1]) return 'deleted';
    return 'modified';
}

function resultBlock(i: number): string {
    const r = ranges[i];
    return center?.state.doc.sliceString(r.from, r.to) ?? '';
}

// What a hunk reads as in one of the side documents (for a change the other side made, this side
// still holds the base text).
function sideText(h: Hunk, side: 'local' | 'online'): string {
    if (h.type === 'stable') return h.text;
    if (h.type === 'conflict') return side === 'local' ? h.local : h.online;
    return h.type === (side === 'local' ? 'left' : 'right') ? (h.type === 'left' ? h.local : h.online) : h.base;
}

// Compare the actual result, including manual edits, for inline highlighting.
function differsFromResult(i: number, side: 'local' | 'online'): boolean {
    const h = hunks[i];
    return !!h && h.type !== 'stable' && sideText(h, side) !== resultBlock(i);
}

// Is hunk `i` empty in this document? (a deletion has no lines of its own on the side that dropped it)
function isZeroLen(i: number, which: 'result' | 'local' | 'online'): boolean {
    const h = hunks[i];
    if (!h || h.type === 'stable') return false;
    if (which === 'result') {
        const r = ranges.find((x) => x.hunk === i);
        return !!r && r.from === r.to;
    }
    const [a, b] = which === 'local' ? h.lRange : h.oRange;
    return b <= a;
}

// A zero-length hunk anchors on the boundary between the stable regions around it. Folding straight up
// to that boundary would bury the position inside a block widget, where coordsAtPos can't place the
// gutter button or the connector — so give up one line of the fold on that side.
function trimmedFold(doc: Text, fromLine: number, toLine: number, i: number, which: 'result' | 'local' | 'online') {
    if (isZeroLen(i - 1, which)) fromLine++;
    if (isZeroLen(i + 1, which)) toLine--;
    return toLine >= fromLine ? foldRange(doc, fromLine, toLine, i) : null;
}

function blockLines(state: EditorState, fromLine: number, toLine: number, cls: string): Range<Decoration>[] {
    const out: Range<Decoration>[] = [];
    for (let n = fromLine; n <= toLine; n++) {
        out.push(Decoration.line({ class: cls }).range(state.doc.line(n).from));
    }
    return out;
}

// Tint the words that actually changed inside a block: `mine` and `theirs` are the two versions of
// the same block, `base` is where `mine` starts in its document.
const wordMark = Decoration.mark({ class: 'cm-word-diff' });
function wordMarks(mine: string, theirs: string, base: number, docLen: number): Range<Decoration>[] {
    return wordDiff(mine, theirs).a
        .filter(([f, t]) => base + t <= docLen && t > f)
        .map(([f, t]) => wordMark.range(base + f, base + t));
}

function buildCenterDeco(state: EditorState): DecorationSet {
    const out: Range<Decoration>[] = [];
    const len = state.doc.length;
    ranges.forEach((r) => {
        const h = hunks[r.hunk];
        if (h.type === 'stable') {
            const fold = trimmedFold(state.doc, state.doc.lineAt(r.from).number, state.doc.lineAt(r.to).number, r.hunk, 'result');
            if (fold) out.push(fold);
            return;
        }
        if (r.from === r.to) return; // deletion: nothing to paint, the gutter button marks it
        out.push(...blockLines(state, state.doc.lineAt(r.from).number, state.doc.lineAt(r.to).number, hunkClass(h, r.hunk)));
        // Compare against whichever side the result no longer matches.
        const mine = state.doc.sliceString(r.from, r.to);
        const other = differsFromResult(r.hunk, 'local') ? sideText(h, 'local') : sideText(h, 'online');
        out.push(...wordMarks(mine, other, r.from, len));
    });
    return Decoration.set(out, true);
}

// side: 'local' uses lRange; 'online' uses oRange.
function buildPaneDeco(state: EditorState, side: 'local' | 'online'): DecorationSet {
    const out: Range<Decoration>[] = [];
    const lines = state.doc.lines;
    hunks.forEach((h, i) => {
        const [from0, to0] = side === 'local' ? h.lRange : h.oRange;
        if (h.type === 'stable') {
            if (to0 > from0) {
                const fold = trimmedFold(state.doc, from0 + 1, Math.min(to0, lines), i, side);
                if (fold) out.push(fold);
            }
            return;
        }
        // One-sided changes only have controls and highlighting on the changed side.
        if (h.type === 'left' && side === 'online' || h.type === 'right' && side === 'local') return;

        let fromLine = from0 + 1;
        let toLine = Math.min(to0, lines);

        // If range spans 0 lines on this side (deletion/insertion gap), mark the surrounding line so block is visible
        if (toLine < fromLine) {
            fromLine = Math.max(1, Math.min(from0 + 1, lines));
            toLine = fromLine;
            out.push(...blockLines(state, fromLine, toLine, hunkClass(h, i)));
            return;
        }

        out.push(...blockLines(state, fromLine, toLine, hunkClass(h, i)));
        const from = state.doc.line(fromLine).from;
        out.push(...wordMarks(state.doc.sliceString(from, state.doc.line(toLine).to), resultBlock(i), from, state.doc.length));
    });
    return Decoration.set(out, true);
}

const centerEl = ref<HTMLDivElement>();
const leftEl = ref<HTMLDivElement>();
const rightEl = ref<HTMLDivElement>();
const bodyEl = ref<HTMLDivElement>();
let left: EditorView | null = null, center: EditorView | null = null, right: EditorView | null = null;

// Every changed block needs an explicit decision — nothing is preselected, so nothing is settled
// until the user says so. That, plus no leftover conflict markers, is what unlocks the merge.
const emitState = (doc: string) => {
    unresolvedCount.value = hunks.filter((h, i) => h.type !== 'stable' && !isDecided(i)).length;
    conflictCount.value = hunks.filter((h, i) => isConflict(h) && !isDecided(i)).length;
    simpleCount.value = hunks.filter((h, i) => isConflict(h) && !isDecided(i) && simpleMerge(h) !== null && resolutions[i].left === 'pending' && resolutions[i].right === 'pending').length;
    selectedConflict.value = currentConflictIndex.value >= 0 && isConflict(hunks[currentConflictIndex.value]) && !isDecided(currentConflictIndex.value);
    emit('update:result', doc);
    emit('update:conflictsResolved', unresolvedCount.value === 0 && findConflicts(doc).length === 0);
};

const pendingBlocks = () =>
    ranges.filter((r) => hunks[r.hunk].type !== 'stable' && !isDecided(r.hunk)).map((r) => r.hunk);

function goTo(hunkIdx: number) {
    const range = ranges.find((r) => r.hunk === hunkIdx);
    if (!range || !center) return;
    currentConflictIndex.value = hunkIdx;
    selectedConflict.value = isConflict(hunks[hunkIdx]) && !isDecided(hunkIdx);
    center.dispatch({ selection: { anchor: range.from }, scrollIntoView: true });
}

function goToNextConflict() {
    const idx = pendingBlocks();
    if (!idx.length) return;
    goTo(idx.find((i) => i > currentConflictIndex.value) ?? idx[0]);
}

function goToPrevConflict() {
    const idx = pendingBlocks();
    if (!idx.length) return;
    goTo(idx.filter((i) => i < currentConflictIndex.value).pop() ?? idx[idx.length - 1]);
}

function selectSideChange(update: ViewUpdate, side: Side) {
    if (!update.selectionSet) return;
    const line = update.state.doc.lineAt(update.state.selection.main.head).number - 1;
    const index = hunks.findIndex((h) => {
        const [from, to] = side === 'left' ? h.lRange : h.oRange;
        return h.type !== 'stable' && line >= from && line < to;
    });
    if (index < 0) return;
    currentConflictIndex.value = index;
    selectedConflict.value = isConflict(hunks[index]) && !isDecided(index);
}

// Vertical extent of [from, to) inside a view, relative to the body. A zero-width position (a
// deletion) becomes a hairline so the connector still has something to attach to.
function blockY(view: EditorView, from: number, to: number, bodyTop: number): [number, number] | null {
    const a = view.coordsAtPos(from);
    const b = to === from ? a : view.coordsAtPos(to);
    if (!a || !b) return null;
    const top = a.top - bodyTop;
    return [top, Math.max(b.bottom - bodyTop, top + 2)];
}

// Same, for a hunk's 0-based line range in a side pane.
function paneY(view: EditorView, [from0, to0]: [number, number], bodyTop: number): [number, number] | null {
    const doc = view.state.doc;
    const first = doc.line(Math.max(1, Math.min(from0 + 1, doc.lines)));
    if (to0 <= from0) return blockY(view, first.from, first.from, bodyTop);
    return blockY(view, first.from, doc.line(Math.max(1, Math.min(to0, doc.lines))).to, bodyTop);
}

// Ribbon joining a block in the neighbouring pane (x=0) to its counterpart in the result (x=W).
const linkPath = (near: [number, number], far: [number, number]) =>
    `M0 ${near[0]} C${GUTTER_W / 2} ${near[0]},${GUTTER_W / 2} ${far[0]},${GUTTER_W} ${far[0]}`
    + ` L${GUTTER_W} ${far[1]} C${GUTTER_W / 2} ${far[1]},${GUTTER_W / 2} ${near[1]},0 ${near[1]} Z`;

function recomputeMarkers() {
    if (!center || !bodyEl.value) { markersL.value = []; markersR.value = []; return; }
    const bodyTop = bodyEl.value.getBoundingClientRect().top;
    const bodyH = bodyEl.value.clientHeight;
    // Mounted inside a Dialog: a measurement taken before layout would clip every marker away.
    if (!bodyH) return;
    bodyHeight.value = bodyH;

    const outL: Marker[] = [], outR: Marker[] = [];
    for (const r of ranges) {
        const h = hunks[r.hunk];
        if (h.type === 'stable') continue;
        const mid = blockY(center, r.from, r.to, bodyTop);
        if (!mid) continue;
        const base = {
            i: r.hunk, type: changeKind(h), top: mid[0], resolved: isDecided(r.hunk),
        };
        if (mid[0] < -40 || mid[0] > bodyH) continue;
        // Keep each side's controls until that side has an explicit decision.
        if (h.type !== 'right') {
            const side = left && paneY(left, h.lRange, bodyTop);
            outL.push({ ...base, pending: resolutions[r.hunk].left === 'pending', link: side ? linkPath(side, mid) : '' });
        }
        if (h.type !== 'left') {
            const side = right && paneY(right, h.oRange, bodyTop);
            outR.push({ ...base, pending: resolutions[r.hunk].right === 'pending', link: side ? linkPath(mid, side) : '' });
        }
    }
    markersL.value = outL;
    markersR.value = outR;
}

function refreshDecos() {
    if (!center) return;
    center.dispatch({ effects: setDeco.of(buildCenterDeco(center.state)) });
    left?.dispatch({ effects: setDeco.of(buildPaneDeco(left.state, 'local')) });
    right?.dispatch({ effects: setDeco.of(buildPaneDeco(right.state, 'online')) });
    nextTick(() => requestAnimationFrame(recomputeMarkers));
}

function applyAction(index: number, action: MergeAction, side: Side) {
    if (!center || index < 0) return false;
    currentConflictIndex.value = index;
    aiError.value = '';
    center.dispatch(mergeAction(center.state, index, action, side, ''));
    return true;
}

// Build one transaction for a bulk action, so a single undo restores every block.
function applyNonConflicting(sides: Side[]) {
    if (!center) return;
    let state = center.state;
    let changes = state.changes([]);
    for (let i = 0; i < hunks.length; i++) {
        if (hunks[i].type === 'stable' || isConflict(hunks[i])) continue;
        for (const side of sides) {
            if (state.field(mergeModelField).resolutions[i][side] !== 'pending') continue;
            const tr = state.update(mergeAction(state, i, 'accept', side, ''));
            changes = changes.compose(tr.changes);
            state = tr.state;
        }
    }
    if (state !== center.state) center.dispatch({ changes, effects: setMergeModel.of(state.field(mergeModelField)), annotations: isolateHistory.of('full') });
}

function smartApply() {
    if (!center) return;
    let state = center.state;
    let changes = state.changes([]);
    for (let i = 0; i < hunks.length; i++) {
        const resolution = state.field(mergeModelField).resolutions[i];
        if (!isConflict(hunks[i]) || resolution.left !== 'pending' || resolution.right !== 'pending') continue;
        const text = simpleMerge(hunks[i]);
        if (text === null) continue;
        const tr = state.update(mergeAction(state, i, 'simple', 'left', text));
        changes = changes.compose(tr.changes);
        state = tr.state;
    }
    if (state !== center.state) center.dispatch({ changes, effects: setMergeModel.of(state.field(mergeModelField)), annotations: isolateHistory.of('full') });
}

function toggleCollapse() {
    collapseOn.value = !collapseOn.value;
    if (collapseOn.value) expanded.clear(); // re-collapse everything
    refreshDecos();
}

async function aiResolve() {
    aiLoading.value = true; aiError.value = '';
    try {
        const { resolveMerge } = await import('../../../services/ai/AIService');
        const merged = await resolveMerge(props.local, props.base, props.online);
        if (!center) return;
        center.dispatch({
            changes: { from: 0, to: center.state.doc.length, insert: merged },
            effects: setMergeModel.of({ hunks: [], resolutions: [], ranges: [] }),
            annotations: isolateHistory.of('full'),
        });
        currentConflictIndex.value = -1;
    } catch (e) {
        aiError.value = e instanceof Error ? e.message : 'AI merge failed';
    } finally {
        aiLoading.value = false;
    }
}

const mergeKeys = Prec.highest(keymap.of([
    { key: 'F7', run: () => { goToNextConflict(); return true; } },
    { key: 'Shift-F7', run: () => { goToPrevConflict(); return true; } },
    { key: 'Alt-Shift-ArrowRight', mac: 'Ctrl-Shift-ArrowRight', run: () => applyAction(currentConflictIndex.value, 'accept', 'left') },
    { key: 'Alt-Shift-ArrowLeft', mac: 'Ctrl-Shift-ArrowLeft', run: () => applyAction(currentConflictIndex.value, 'accept', 'right') },
]));

function computeModel() {
    const { model, text } = createMergeModel(props.local, props.base, props.online);
    hunks = model.hunks;
    resolutions = model.resolutions;
    ranges = model.ranges;
    resultText = text;
    expanded.clear();
    currentConflictIndex.value = -1;
}

// Reconfigure existing views to preserve text, decisions, selection and undo history.
const buildViews = () => {
    const dark = isDark();
    const shared = [
        ...wikitextExtensions(dark, uiStore.diffSyntaxHighlighting).filter((extension) => extension !== EditorView.lineWrapping),
        wrapLines.value ? EditorView.lineWrapping : [], lineNumbers(), drawSelection(), decoField, mergeKeys,
    ];
    const ro = [...shared, EditorState.readOnly.of(true), EditorView.editable.of(false)];
    const localExtensions = [...ro, EditorView.contentAttributes.of({ 'aria-label': 'Local version' }), EditorView.updateListener.of((update) => selectSideChange(update, 'left'))];
    const onlineExtensions = [...ro, EditorView.contentAttributes.of({ 'aria-label': 'Online version' }), EditorView.updateListener.of((update) => selectSideChange(update, 'right'))];
    const extensions = [
            ...shared,
            mergeModelField.init(() => ({ hunks, ranges, resolutions })),
            mergeHistory,
            history(),
            keymap.of([...historyKeymap, ...defaultKeymap]),
            EditorView.contentAttributes.of({ 'aria-label': 'Merged result' }),
            EditorView.updateListener.of((u) => {
                const modelChanged = u.transactions.some((t) => t.effects.some((e) => e.is(setMergeModel)));
                if (u.docChanged || modelChanged) {
                    const model = u.state.field(mergeModelField);
                    hunks = model.hunks; resolutions = model.resolutions; ranges = model.ranges;
                    resultText = u.state.doc.toString();
                    if (currentConflictIndex.value >= hunks.length) currentConflictIndex.value = -1;
                    emitState(u.state.doc.toString());
                    syncHist();
                    nextTick(refreshDecos);
                }
                if (u.selectionSet) {
                    const pos = u.state.selection.main.head;
                    const selected = ranges.find((r) => hunks[r.hunk].type !== 'stable' && pos >= r.from && pos <= r.to);
                    if (selected) {
                        currentConflictIndex.value = selected.hunk;
                        selectedConflict.value = isConflict(hunks[selected.hunk]) && !isDecided(selected.hunk);
                    }
                }
                // Manual typing moves every block below it — the gutter buttons must follow.
                if (u.docChanged || u.geometryChanged) requestAnimationFrame(recomputeMarkers);
            }),
        ];
    if (center) {
        left?.dispatch({ effects: StateEffect.reconfigure.of(localExtensions) });
        right?.dispatch({ effects: StateEffect.reconfigure.of(onlineExtensions) });
        center.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
    } else {
        left = new EditorView({ doc: props.local, parent: leftEl.value, extensions: localExtensions });
        right = new EditorView({ doc: props.online, parent: rightEl.value, extensions: onlineExtensions });
        center = new EditorView({ doc: resultText, parent: centerEl.value, extensions });
        syncScroll();
    }
    refreshDecos();
    emitState(resultText);
    syncHist();
};

// Document offset where hunk `i` starts, in the given view.
function hunkPos(view: EditorView, i: number, which: 'local' | 'result' | 'online'): number | null {
    if (which === 'result') return ranges.find((r) => r.hunk === i)?.from ?? null;
    const line0 = (which === 'local' ? hunks[i].lRange : hunks[i].oRange)[0];
    const doc = view.state.doc;
    return doc.line(Math.max(1, Math.min(line0 + 1, doc.lines))).from;
}

// Scroll offset of a hunk's block inside a view's content (independent of the current scroll).
function hunkTop(view: EditorView, i: number, which: 'local' | 'result' | 'online'): number | null {
    const pos = hunkPos(view, i, which);
    return pos === null ? null : view.lineBlockAt(pos).top;
}

// Map the viewport through every block, including stable text after insertions and deletions.
function syncScroll() {
    const sides: [EditorView, 'local' | 'result' | 'online'][] = [];
    if (left) sides.push([left, 'local']);
    if (center) sides.push([center, 'result']);
    if (right) sides.push([right, 'online']);
    // Scroll events from our own assignments arrive in a later task, so a synchronous lock doesn't
    // hold: the followers would re-anchor and drive the leader back, and scrolling up would snap down.
    const echoes = new Set<EditorView>();

    for (const [v, which] of sides) {
        v.scrollDOM.addEventListener('scroll', () => {
            if (echoes.delete(v)) { requestAnimationFrame(recomputeMarkers); return; }
            if (!scrollLocked.value) { requestAnimationFrame(recomputeMarkers); return; }
            const y = v.scrollDOM.scrollTop;
            let anchor = -1;
            for (let i = 0; i < hunks.length; i++) {
                const t = hunkTop(v, i, which);
                if (t === null || t > y) break;
                anchor = i;
            }
            const start = anchor < 0 ? 0 : hunkTop(v, anchor, which) ?? 0;
            const end = anchor + 1 < hunks.length ? hunkTop(v, anchor + 1, which) ?? v.contentHeight : v.contentHeight;
            const fraction = end > start ? (y - start) / (end - start) : 0;
            for (const [o, oWhich] of sides) {
                if (o === v) continue;
                const targetStart = anchor < 0 ? 0 : hunkTop(o, anchor, oWhich) ?? 0;
                const targetEnd = anchor + 1 < hunks.length ? hunkTop(o, anchor + 1, oWhich) ?? o.contentHeight : o.contentHeight;
                const before = o.scrollDOM.scrollTop;
                o.scrollDOM.scrollTop = Math.max(0, targetStart + fraction * (targetEnd - targetStart));
                // Only expect an echo if the value really moved (it clamps at the ends).
                if (o.scrollDOM.scrollTop !== before) echoes.add(o);
                o.scrollDOM.scrollLeft = v.scrollDOM.scrollLeft;
            }
            requestAnimationFrame(recomputeMarkers);
        });
    }
}

const onResize = () => requestAnimationFrame(recomputeMarkers);
let themeObserver: MutationObserver;
let resizeObserver: ResizeObserver;

onMounted(() => {
    computeModel();
    buildViews();
    window.addEventListener('resize', onResize);
    themeObserver = new MutationObserver(() => buildViews());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(bodyEl.value!);
});

watch(() => [props.local, props.base, props.online], () => {
    [left, center, right].forEach((v) => v?.destroy());
    left = center = right = null;
    computeModel(); buildViews();
});
watch(() => uiStore.diffSyntaxHighlighting, () => buildViews());
watch(wrapLines, () => buildViews());

onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    themeObserver?.disconnect();
    resizeObserver?.disconnect();
    [left, center, right].forEach((v) => v?.destroy());
});
</script>

<template>
    <div class="merge-editor flex flex-col h-full w-full min-w-0" :aria-busy="aiLoading">
        <div class="cm-toolbar" role="toolbar" aria-label="Merge actions">
            <Button aria-label="Previous unresolved change (Shift+F7)" :disabled="!unresolvedCount || aiLoading"
                text severity="secondary" @click="goToPrevConflict" v-tooltip.bottom="'Previous unresolved change (Shift+F7)'">
                <template #icon><ChevronUp /></template>
            </Button>
            <Button aria-label="Next unresolved change (F7)" :disabled="!unresolvedCount || aiLoading"
                text severity="secondary" @click="goToNextConflict" v-tooltip.bottom="'Next unresolved change (F7)'">
                <template #icon><ChevronDown /></template>
            </Button>
            <span class="toolbar-separator" />
            <Button aria-label="Apply non-conflicting changes from left" :disabled="aiLoading" text severity="secondary"
                @click="applyNonConflicting(['left'])" v-tooltip.bottom="'Apply non-conflicting changes from left'">
                <template #icon><ChevronsRight /></template>
            </Button>
            <Button aria-label="Apply all non-conflicting changes" :disabled="aiLoading" text severity="secondary"
                @click="applyNonConflicting(['left', 'right'])" v-tooltip.bottom="'Apply all non-conflicting changes'">
                <template #icon><FoldHorizontal /></template>
            </Button>
            <Button aria-label="Apply non-conflicting changes from right" :disabled="aiLoading" text severity="secondary"
                @click="applyNonConflicting(['right'])" v-tooltip.bottom="'Apply non-conflicting changes from right'">
                <template #icon><ChevronsLeft /></template>
            </Button>
            <Button aria-label="Resolve simple conflicts" :disabled="!simpleCount || aiLoading" text severity="secondary"
                @click="smartApply" v-tooltip.bottom="'Merge disjoint edits within conflicting lines'">
                <template #icon><Wand2 /></template>
            </Button>
            <span class="toolbar-separator" />
            <Button aria-label="Undo" text severity="secondary" :disabled="!canUndo || aiLoading" @click="undo" v-tooltip.bottom="'Undo (Ctrl+Z)'">
                <template #icon><Undo2 /></template>
            </Button>
            <Button aria-label="Redo" text severity="secondary" :disabled="!canRedo || aiLoading" @click="redo" v-tooltip.bottom="'Redo (Ctrl+Shift+Z)'">
                <template #icon><Redo2 /></template>
            </Button>
            <span class="toolbar-separator" />
            <Button aria-label="Synchronize scrolling" :aria-pressed="scrollLocked" :class="{ toggled: scrollLocked }"
                text severity="secondary" @click="scrollLocked = !scrollLocked" v-tooltip.bottom="'Synchronize scrolling'">
                <template #icon><Link /></template>
            </Button>
            <Button aria-label="Wrap lines" :aria-pressed="wrapLines" :class="{ toggled: wrapLines }"
                text severity="secondary" @click="wrapLines = !wrapLines" v-tooltip.bottom="'Wrap lines'">
                <template #icon><WrapText /></template>
            </Button>
            <Button aria-label="Collapse unchanged sections" :aria-pressed="collapseOn" text severity="secondary"
                @click="toggleCollapse" v-tooltip.bottom="collapseOn ? 'Expand unchanged sections' : 'Collapse unchanged sections'">
                <template #icon><UnfoldVertical v-if="collapseOn" /><FoldVertical v-else /></template>
            </Button>
            <div class="flex-1" />
            <Button v-if="!aiConfig.hideAi" aria-label="Resolve the merge with AI" text severity="secondary"
                @click="aiResolve" :loading="aiLoading" v-tooltip.bottom="'Resolve the merge with AI'">
                <template #icon><Bot /></template>
            </Button>
        </div>

        <div class="merge-status" role="status" aria-live="polite">
            <span v-if="unresolvedCount">{{ unresolvedCount }} unresolved {{ unresolvedCount === 1 ? 'change' : 'changes' }}, {{ conflictCount }} {{ conflictCount === 1 ? 'conflict' : 'conflicts' }}</span>
            <span v-else class="resolved-status"><Check class="w-3.5 h-3.5" />All changes resolved</span>
            <span class="change-legend"><i class="inserted" />Added <i class="modified" />Modified <i class="deleted" />Deleted <i class="conflict" />Conflict</span>
        </div>
        <div v-if="aiError" class="merge-error" role="alert">{{ aiError }}</div>

        <div class="merge-selection" role="toolbar" aria-label="Selected change actions">
            <span>{{ currentConflictIndex >= 0 ? 'Selected change' : 'Select a highlighted change' }}</span>
            <Button label="Resolve using left" text severity="secondary" :disabled="currentConflictIndex < 0 || aiLoading"
                @click="applyAction(currentConflictIndex, 'resolve', 'left')" />
            <Button label="Resolve using right" text severity="secondary" :disabled="currentConflictIndex < 0 || aiLoading"
                @click="applyAction(currentConflictIndex, 'resolve', 'right')" />
            <Button label="Mark resolved" text severity="secondary" :disabled="currentConflictIndex < 0 || aiLoading"
                @click="applyAction(currentConflictIndex, 'manual', 'left')" v-tooltip.bottom="'Keep the current result and mark the change resolved'" />
            <Button aria-label="Revert selected change" text severity="secondary" :disabled="currentConflictIndex < 0 || aiLoading"
                @click="applyAction(currentConflictIndex, 'reset', 'left')" v-tooltip.bottom="'Restore the base and review this change again'">
                <template #icon><RotateCcw /></template>
            </Button>
            <span v-if="selectedConflict" class="selection-hint">Accept or ignore each side to resolve the conflict</span>
        </div>

        <div class="merge-workspace">
            <div class="pane-labels">
                <div><span>Local</span><span class="pane-mode"><LockKeyhole />Read-only</span></div>
                <span class="gutter-label" />
                <div><span>Result</span><span class="pane-mode">Editable</span></div>
                <span class="gutter-label" />
                <div><span>Online</span><span class="pane-mode"><LockKeyhole />Read-only</span></div>
            </div>

            <div ref="bodyEl" class="merge-body">
                <div ref="leftEl" class="merge-pane" data-testid="merge-local" />
                <div class="gutter-col">
                    <svg class="gutter-links" :viewBox="`0 0 ${GUTTER_W} ${bodyHeight}`" preserveAspectRatio="none" aria-hidden="true">
                        <path v-for="m in markersL" :key="m.i" v-show="m.link" :d="m.link"
                            :class="['lnk-' + m.type, { decided: m.resolved }]" />
                    </svg>
                    <div v-for="m in markersL" :key="m.i" class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <template v-if="m.pending">
                            <button type="button" :aria-label="`Accept left change ${m.i + 1}`" :disabled="aiLoading"
                                @click="applyAction(m.i, $event.ctrlKey ? 'resolve' : 'accept', 'left')" v-tooltip.left="'Accept left. Ctrl+click to resolve using left'">
                                <ArrowRight />
                            </button>
                            <button type="button" :aria-label="`Ignore left change ${m.i + 1}`" :disabled="aiLoading"
                                @click="applyAction(m.i, 'ignore', 'left')" v-tooltip.left="'Ignore left'"><X /></button>
                        </template>
                    </div>
                </div>
                <div ref="centerEl" class="merge-pane" data-testid="merge-result" />
                <div class="gutter-col">
                    <svg class="gutter-links" :viewBox="`0 0 ${GUTTER_W} ${bodyHeight}`" preserveAspectRatio="none" aria-hidden="true">
                        <path v-for="m in markersR" :key="m.i" v-show="m.link" :d="m.link"
                            :class="['lnk-' + m.type, { decided: m.resolved }]" />
                    </svg>
                    <div v-for="m in markersR" :key="m.i" class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <template v-if="m.pending">
                            <button type="button" :aria-label="`Accept right change ${m.i + 1}`" :disabled="aiLoading"
                                @click="applyAction(m.i, $event.ctrlKey ? 'resolve' : 'accept', 'right')" v-tooltip.right="'Accept right. Ctrl+click to resolve using right'"><ArrowLeft /></button>
                            <button type="button" :aria-label="`Ignore right change ${m.i + 1}`" :disabled="aiLoading"
                                @click="applyAction(m.i, 'ignore', 'right')" v-tooltip.right="'Ignore right'"><X /></button>
                        </template>
                    </div>
                </div>
                <div ref="rightEl" class="merge-pane" data-testid="merge-online" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.merge-editor {
    --merge-modified: #5390d9;
    --merge-inserted: #549159;
    --merge-deleted: #929292;
    --merge-conflict: #db5860;
    font-size: 12px;
    color: var(--p-text-color);
    background: var(--p-content-background);
}
.cm-toolbar, .merge-selection, .merge-status {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 3px 8px;
    border-bottom: 1px solid var(--p-content-border-color);
    background: var(--p-content-background);
    flex-wrap: wrap;
}
.cm-toolbar :deep(.p-button) { width: 28px; height: 28px; padding: 5px; border-radius: 3px; }
.cm-toolbar :deep(svg) { width: 16px; height: 16px; }
.cm-toolbar :deep(.p-button:not(:disabled):hover), .cm-toolbar :deep(.toggled) {
    background: var(--p-content-hover-background);
    color: var(--p-text-color);
}
.toolbar-separator { width: 1px; height: 20px; margin: 0 5px; background: var(--p-content-border-color); }
.merge-status { justify-content: space-between; color: var(--p-text-muted-color); }
.resolved-status { display: inline-flex; align-items: center; gap: 5px; color: var(--merge-inserted); }
.change-legend { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }
.change-legend i { width: 8px; height: 8px; border-radius: 1px; margin-left: 6px; }
.change-legend .modified { background: var(--merge-modified); }
.change-legend .inserted { background: var(--merge-inserted); }
.change-legend .deleted { background: var(--merge-deleted); }
.change-legend .conflict { background: var(--merge-conflict); }
.merge-selection { color: var(--p-text-muted-color); }
.merge-selection :deep(.p-button) { font-size: 11px; padding: 3px 7px; border-radius: 3px; }
.merge-selection :deep(svg) { width: 14px; height: 14px; }
.selection-hint { margin-left: auto; font-size: 11px; }
.merge-error { padding: 6px 10px; color: var(--merge-conflict); }
.merge-workspace { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; }
.pane-labels, .merge-body { display: flex; }
.pane-labels { flex-shrink: 0; border-bottom: 1px solid var(--p-content-border-color); }
.pane-labels > div { flex: 1; min-width: 0; display: flex; justify-content: space-between; align-items: center; padding: 7px 12px; font-weight: 600; gap: 8px; }
.gutter-label, .gutter-col { width: 48px; flex-shrink: 0; }
.pane-mode { display: inline-flex; gap: 4px; align-items: center; color: var(--p-text-muted-color); font-weight: 400; font-size: 11px; }
.pane-mode svg { width: 11px; height: 11px; }
.merge-body { flex: 1; min-height: 0; position: relative; }
.merge-pane { flex: 1; min-width: 0; min-height: 0; overflow: hidden; }
:deep(.cm-editor) { height: 100%; font-size: 13px; }
:deep(.cm-scroller) { overflow: auto; }
:deep(.cm-gutters) { border-right: 1px solid var(--p-content-border-color); background: var(--p-content-background); color: var(--p-text-muted-color); }
:deep(.cm-merge-modified) { --change-color: var(--merge-modified); }
:deep(.cm-merge-inserted) { --change-color: var(--merge-inserted); }
:deep(.cm-merge-deleted) { --change-color: var(--merge-deleted); }
:deep(.cm-merge-conflict) { --change-color: var(--merge-conflict); }
:deep(.cm-line[class*="cm-merge-"]) {
    background: color-mix(in srgb, var(--change-color) 18%, transparent);
    border-left: 2px solid var(--change-color);
}
:deep(.cm-word-diff) { background: color-mix(in srgb, var(--change-color, var(--merge-modified)) 32%, transparent); }
:deep(.cm-line.cm-resolved) { background: color-mix(in srgb, var(--change-color) 5%, transparent); border-left-color: color-mix(in srgb, var(--change-color) 40%, transparent); }
:deep(.cm-fold) {
    display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;
    font-family: inherit; font-size: 11px; padding: 3px 8px;
    color: var(--p-text-muted-color); background: var(--p-content-hover-background);
    border: 0; border-block: 1px solid var(--p-content-border-color); cursor: pointer;
}
.gutter-col { position: relative; z-index: 2; overflow: hidden; border-inline: 1px solid var(--p-content-border-color); background: var(--p-content-background); }
.gutter-links { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.gutter-links .lnk-modified { --change-color: var(--merge-modified); }
.gutter-links .lnk-inserted { --change-color: var(--merge-inserted); }
.gutter-links .lnk-deleted { --change-color: var(--merge-deleted); }
.gutter-links .lnk-conflict { --change-color: var(--merge-conflict); }
.gutter-links path { fill: color-mix(in srgb, var(--change-color) 18%, transparent); stroke: color-mix(in srgb, var(--change-color) 55%, transparent); stroke-width: 1; }
.gutter-links path.decided { fill-opacity: 0.25; stroke-opacity: 0.4; }
.gutter-grp { position: absolute; left: 0; right: 0; display: flex; justify-content: center; }
.gutter-grp button {
    display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 3px;
    border: 0; border-radius: 2px; background: var(--p-content-background); color: var(--p-text-color); cursor: pointer;
}
.gutter-grp svg { width: 16px; height: 16px; }
.gutter-grp button:not(:disabled):hover { background: var(--p-content-hover-background); color: var(--p-primary-color); }
.gutter-grp button:disabled { opacity: 0.5; cursor: default; }
.gutter-grp button:focus-visible, :deep(.cm-fold:focus-visible) { outline: 2px solid var(--p-primary-color); outline-offset: -2px; }
@media (max-width: 900px) {
    .pane-mode, .selection-hint { display: none; }
    .change-legend { font-size: 10px; }
}
</style>
