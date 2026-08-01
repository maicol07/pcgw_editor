<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { EditorView, Decoration, WidgetType, keymap, type DecorationSet } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Prec, type Range } from '@codemirror/state';
import { history } from '@codemirror/commands';
import Button from 'openvue/button';
import {
    ChevronsLeft, ChevronsRight, FoldHorizontal, Wand2, Bot, ArrowLeft, ArrowRight, X, Plus,
    Undo2, Redo2, UnfoldVertical, FoldVertical, ChevronUp, ChevronDown, Check,
} from '@lucide/vue';
import {
    computeHunks, defaultChoices, smartChoices, buildResult, findConflicts, hunkText, wordDiff,
    type Hunk, type Choice,
} from './merge3';
// AIService is imported lazily at the call site: a static import pulls the three @ai-sdk
// providers (~700 kB) into the startup bundle for a feature many sessions never use.
import { wikitextExtensions, isDark } from './cmWikitext';

const props = defineProps<{
    local: string;
    base: string;
    online: string;
}>();

const emit = defineEmits<{
    (e: 'update:result', value: string): void;
    (e: 'update:conflictsResolved', value: boolean): void;
}>();

const COLLAPSE_MIN = 6; // collapse stable regions at least this many lines long

let hunks: Hunk[] = [];
let choices: Choice[] = [];
let ranges: { from: number; to: number; hunk: number }[] = []; // char ranges of every hunk in the result
let resultText = ''; // merged text as last derived from the model
const expanded = new Set<number>(); // stable hunks the user expanded
// Nothing is preselected: a block is "decided" exactly when it no longer holds the ancestor by default.
const isDecided = (i: number) => choices[i] !== 'unresolved';
const collapseOn = ref(true);
const aiLoading = ref(false);
const aiError = ref('');
const unresolvedCount = ref(0);
const yoursCount = ref(0), theirsCount = ref(0), conflictCount = ref(0);
const currentConflictIndex = ref(-1);

// One gutter entry per visible change: which hunk, its kind, the resolution the user picked (none is
// preselected), its y offset, and the block geometry used to draw the connector.
type Marker = { i: number; type: Hunk['type']; choice: Choice | null; top: number; link: string };
const markersL = ref<Marker[]>([]), markersR = ref<Marker[]>([]);
const bodyHeight = ref(0); // gutter SVG viewBox height, in the same px space as marker tops
const GUTTER_W = 56; // must match the gutter columns' w-14

// ---- model undo/redo (actions are state changes, not just text) ----
type Snap = { hunks: Hunk[]; choices: Choice[] };
let past: Snap[] = [], futureStk: Snap[] = [];
const canUndo = ref(false), canRedo = ref(false);
const syncHist = () => { canUndo.value = past.length > 0; canRedo.value = futureStk.length > 0; };
const snap = (): Snap => ({ hunks: hunks.slice(), choices: choices.slice() });
const restore = (s: Snap) => { hunks = s.hunks; choices = s.choices; };
const pushUndo = () => { past.push(snap()); futureStk = []; syncHist(); };
function undo() {
    if (!past.length) return false;
    futureStk.push(snap());
    restore(past.pop()!);
    rebuild(); syncHist(); return true;
}
function redo() {
    if (!futureStk.length) return false;
    past.push(snap());
    restore(futureStk.pop()!);
    rebuild(); syncHist(); return true;
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
        const el = document.createElement('div');
        el.className = 'cm-fold';
        el.innerHTML = `${UNFOLD_SVG}<span>${this.count} unchanged lines</span>`;
        el.title = 'Click to expand';
        el.onmousedown = (e) => { e.preventDefault(); expanded.add(this.hunk); refreshDecos(); };
        return el;
    }
    ignoreEvent() { return false; }
}

// Collapse a stable region [fromLine, toLine] (1-based, inclusive) if long enough.
function foldRange(doc: any, fromLine: number, toLine: number, hunk: number): Range<Decoration> | null {
    const count = toLine - fromLine + 1;
    if (!collapseOn.value || expanded.has(hunk) || count < COLLAPSE_MIN) return null;
    const from = doc.line(fromLine).from, to = doc.line(toLine).to;
    return Decoration.replace({ widget: new FoldWidget(hunk, count), block: true }).range(from, to);
}

// Highlight class for a hunk: colour by type, dimmed + dashed outline once the user has decided it.
function hunkClass(h: Hunk, i: number): string {
    const cls = h.type === 'conflict' ? 'cm-conflict' : h.type === 'left' ? 'cm-changed-local' : 'cm-changed-online';
    return isDecided(i) ? `${cls} cm-resolved` : cls;
}

// What a hunk reads as in one of the side documents (for a change the other side made, this side
// still holds the base text).
function sideText(h: Hunk, side: 'local' | 'online'): string {
    if (h.type === 'stable') return h.text;
    if (h.type === 'conflict') return side === 'local' ? h.local : h.online;
    return h.type === (side === 'local' ? 'left' : 'right') ? (h.type === 'left' ? h.local : h.online) : h.base;
}

// A side only gets a highlight and controls where it actually differs from the result — otherwise the
// same change would be offered twice, once per gutter. Exactly one side differs for a settled
// one-sided change; both do for a pending conflict.
function differsFromResult(i: number, side: 'local' | 'online'): boolean {
    const h = hunks[i];
    return !!h && h.type !== 'stable' && sideText(h, side) !== hunkText(h, choices[i]);
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
function trimmedFold(doc: any, fromLine: number, toLine: number, i: number, which: 'result' | 'local' | 'online') {
    if (isZeroLen(i - 1, which)) fromLine++;
    if (isZeroLen(i + 1, which)) toLine--;
    return toLine >= fromLine ? foldRange(doc, fromLine, toLine, i) : null;
}

// Line classes for a block: the first/last line carry the top/bottom edge, so a settled block
// reads as one dashed box rather than a stack of open-sided rows.
function blockLines(state: EditorState, fromLine: number, toLine: number, cls: string): Range<Decoration>[] {
    const out: Range<Decoration>[] = [];
    for (let n = fromLine; n <= toLine; n++) {
        const edge = `${n === fromLine ? ' cm-blk-top' : ''}${n === toLine ? ' cm-blk-bottom' : ''}`;
        out.push(Decoration.line({ class: cls + edge }).range(state.doc.line(n).from));
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
        // A pane marks a block only where it differs from the result — the colour still says who
        // changed it, but the same change is never offered from both sides at once.
        if (!differsFromResult(i, side)) return;

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
        out.push(...wordMarks(state.doc.sliceString(from, state.doc.line(toLine).to), hunkText(h, choices[i]), from, state.doc.length));
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
    yoursCount.value = hunks.filter((h) => h.type === 'left').length;
    theirsCount.value = hunks.filter((h) => h.type === 'right').length;
    conflictCount.value = hunks.filter((h) => h.type === 'conflict').length;
    emit('update:result', doc);
    emit('update:conflictsResolved', unresolvedCount.value === 0 && findConflicts(doc).length === 0);
};

const pendingBlocks = () =>
    ranges.filter((r) => hunks[r.hunk].type !== 'stable' && !isDecided(r.hunk)).map((r) => r.hunk);

function goTo(hunkIdx: number) {
    const range = ranges.find((r) => r.hunk === hunkIdx);
    if (!range || !center) return;
    currentConflictIndex.value = hunkIdx;
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
    if (!bodyH) { requestAnimationFrame(recomputeMarkers); return; }
    bodyHeight.value = bodyH;

    const outL: Marker[] = [], outR: Marker[] = [];
    for (const r of ranges) {
        const h = hunks[r.hunk];
        if (h.type === 'stable') continue;
        const mid = blockY(center, r.from, r.to, bodyTop);
        if (!mid) continue;
        const base = {
            i: r.hunk, type: h.type, top: mid[0],
            choice: isDecided(r.hunk) ? choices[r.hunk] : null,
        };
        if (mid[0] < -40 || mid[0] > bodyH) continue;
        // Controls appear on the side(s) the result no longer matches: one gutter for a settled
        // one-sided change, both for a pending conflict. The buttons follow the result block alone —
        // when the counterpart in a side pane can't be measured (scrolled out, or clamped at a shorter
        // doc's end) we drop the ribbon, never the buttons.
        if (differsFromResult(r.hunk, 'local')) {
            const side = left && paneY(left, h.lRange, bodyTop);
            outL.push({ ...base, link: side ? linkPath(side, mid) : '' });
        }
        if (differsFromResult(r.hunk, 'online')) {
            const side = right && paneY(right, h.oRange, bodyTop);
            outR.push({ ...base, link: side ? linkPath(mid, side) : '' });
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

// Narrow a whole-document rewrite down to the part that actually changed. Replacing the full doc
// makes CodeMirror re-measure asynchronously and lose the scroll position (the pane jumps to the top
// and every gutter button scrolls out of view); a change confined to one region keeps the viewport.
function minimalChange(old: string, next: string): { from: number; to: number; insert: string } | null {
    if (old === next) return null;
    let s = 0;
    const max = Math.min(old.length, next.length);
    while (s < max && old[s] === next[s]) s++;
    let e = 0;
    while (e < max - s && old[old.length - 1 - e] === next[next.length - 1 - e]) e++;
    return { from: s, to: old.length - e, insert: next.slice(s, next.length - e) };
}

// ponytail: rebuild re-derives the result from the model — manual edits inside a block that a button
// then changes are discarded. Edit freely for final touch-ups after resolving via buttons.
function rebuild() {
    if (!center) return;
    aiError.value = '';
    const res = buildResult(hunks, choices);
    ranges = res.ranges;
    resultText = res.text;
    const change = minimalChange(center.state.doc.toString(), res.text);
    if (change) center.dispatch({ changes: change, scrollIntoView: false });
    refreshDecos();
    emitState(res.text);
}

function setChoice(idx: number, c: Choice) { pushUndo(); choices[idx] = c; rebuild(); }

// Gutter controls. In both gutters the arrow points into the result and means "use this side's text";
// X means "drop this side's text" (i.e. take the other one). A block is reachable from either gutter,
// so a change one side made is still revertable from the side that didn't make it.
const ICONS = { ArrowRight, ArrowLeft, X, Plus };
type Btn = { icon: keyof typeof ICONS; choice: Choice; tip: string };
function buttons(type: Hunk['type'], side: 'left' | 'right'): Btn[] {
    const into: keyof typeof ICONS = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
    const yours = side === 'left';
    if (type === 'conflict') {
        return [
            { icon: into, choice: yours ? 'left' : 'right', tip: yours ? 'Take yours' : 'Take theirs' },
            { icon: 'Plus', choice: 'both', tip: 'Keep both' },
            { icon: 'X', choice: yours ? 'right' : 'left', tip: yours ? 'Discard yours' : 'Discard theirs' },
        ];
    }
    // Did this gutter's side make the change?
    return (type === 'left') === yours
        ? [
            { icon: into, choice: 'include', tip: yours ? 'Keep your change' : 'Keep their change' },
            { icon: 'X', choice: 'discard', tip: yours ? 'Discard your change' : 'Discard their change' },
        ]
        : [
            { icon: into, choice: 'discard', tip: yours ? 'Keep your version' : 'Keep their version' },
            { icon: 'X', choice: 'include', tip: yours ? 'Use their change' : 'Use your change' },
        ];
}
// A bulk action decides every changed block at once.
function applyAll(map: (h: Hunk) => Choice) { pushUndo(); choices = hunks.map(map); rebuild(); }
const acceptLeft = () => applyAll((h) => (h.type === 'conflict' ? 'left' : h.type === 'right' ? 'discard' : 'include'));
const acceptRight = () => applyAll((h) => (h.type === 'conflict' ? 'right' : h.type === 'left' ? 'discard' : 'include'));
// Apply every one-sided change, leaving conflict decisions untouched.
const acceptBoth = () => {
    pushUndo();
    choices = hunks.map((h, i) => (h.type === 'conflict' ? choices[i] : 'include'));
    rebuild();
};
// Auto-resolve conflicts only — one-sided decisions the user already made are kept.
const smartApply = () => {
    pushUndo();
    const smart = smartChoices(hunks);
    choices = hunks.map((h, i) => (h.type === 'conflict' ? smart[i] : choices[i]));
    rebuild();
};

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
        pushUndo();
        hunks = []; choices = []; ranges = []; // AI output isn't model-tracked → nothing left to decide
        center!.dispatch({ changes: { from: 0, to: center!.state.doc.length, insert: merged }, scrollIntoView: false });
        center!.dispatch({ effects: setDeco.of(Decoration.none) });
        markersL.value = []; markersR.value = [];
        emitState(merged);
    } catch (e: any) {
        aiError.value = e?.message || 'AI merge failed';
    } finally {
        aiLoading.value = false;
    }
}

const undoRedoKeys = Prec.highest(keymap.of([
    { key: 'Mod-z', run: () => undo() },
    { key: 'Mod-y', run: () => redo() },
    { key: 'Mod-Shift-z', run: () => redo() },
]));

function computeModel() {
    hunks = computeHunks(props.local, props.base, props.online);
    choices = defaultChoices(hunks);
    const res = buildResult(hunks, choices);
    ranges = res.ranges;
    resultText = res.text;
    past = []; futureStk = []; expanded.clear(); syncHist();
    currentConflictIndex.value = -1;
}

// Recreates the three editors. Keeps the model and the current result text, so a theme switch (which
// triggers this via MutationObserver) throws away neither the user's resolutions nor their edits.
const buildViews = () => {
    const doc = center ? center.state.doc.toString() : resultText;
    [left, center, right].forEach((v) => v?.destroy());
    const dark = isDark();
    const ro = [...wikitextExtensions(dark), decoField, EditorState.readOnly.of(true), EditorView.editable.of(false)];

    left = new EditorView({ doc: props.local, parent: leftEl.value, extensions: ro });
    right = new EditorView({ doc: props.online, parent: rightEl.value, extensions: ro });

    center = new EditorView({
        doc, parent: centerEl.value,
        extensions: [
            ...wikitextExtensions(dark),
            decoField,
            history(),
            undoRedoKeys,
            EditorView.updateListener.of((u) => {
                if (u.docChanged && !u.transactions.some((t) => t.effects.some((e) => e.is(setDeco)))) {
                    emitState(u.state.doc.toString());
                }
                // Manual typing moves every block below it — the gutter buttons must follow.
                if (u.docChanged || u.geometryChanged) requestAnimationFrame(recomputeMarkers);
            }),
        ],
    });
    refreshDecos();
    emitState(doc);
    syncScroll();
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

// The three docs have different lengths and different collapsed regions, so copying scrollTop drifts
// badly. Anchor instead on the topmost block at or above the viewport edge and align its counterpart.
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
            const y = v.scrollDOM.scrollTop;
            let anchor = -1, delta = y;
            for (let i = 0; i < hunks.length; i++) {
                if (hunks[i].type === 'stable') continue;
                const t = hunkTop(v, i, which);
                if (t === null || t > y + 40) break;
                anchor = i; delta = y - t;
            }
            for (const [o, oWhich] of sides) {
                if (o === v) continue;
                const t = anchor < 0 ? 0 : hunkTop(o, anchor, oWhich);
                const before = o.scrollDOM.scrollTop;
                o.scrollDOM.scrollTop = Math.max(0, (t ?? 0) + delta);
                // Only expect an echo if the value really moved (it clamps at the ends).
                if (o.scrollDOM.scrollTop !== before) echoes.add(o);
            }
            requestAnimationFrame(recomputeMarkers);
        });
    }
}

const onResize = () => requestAnimationFrame(recomputeMarkers);

onMounted(() => {
    computeModel();
    buildViews();
    window.addEventListener('resize', onResize);
    const observer = new MutationObserver(() => buildViews()); // theme only → keep the model
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    onUnmounted(() => observer.disconnect());
});

watch(() => [props.local, props.base, props.online], () => { computeModel(); buildViews(); });

onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    [left, center, right].forEach((v) => v?.destroy());
});
</script>

<template>
    <div class="flex flex-col h-full w-full">
        <!-- Toolbar -->
        <div class="cm-toolbar flex items-center gap-1 px-2 py-1 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
            <Button size="small" severity="secondary" text rounded :disabled="!canUndo" @click="undo" v-tooltip.bottom="'Undo (Ctrl+Z)'">
                <template #icon><Undo2 class="w-4 h-4" /></template>
            </Button>
            <Button size="small" severity="secondary" text rounded :disabled="!canRedo" @click="redo" v-tooltip.bottom="'Redo (Ctrl+Shift+Z)'">
                <template #icon><Redo2 class="w-4 h-4" /></template>
            </Button>
            <div class="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
            <Button size="small" severity="secondary" text rounded @click="acceptLeft" v-tooltip.bottom="'Accept all from local (yours) →'">
                <template #icon><ChevronsRight class="w-4 h-4" /></template>
            </Button>
            <Button size="small" severity="secondary" text rounded @click="acceptRight" v-tooltip.bottom="'← Accept all from online (theirs)'">
                <template #icon><ChevronsLeft class="w-4 h-4" /></template>
            </Button>
            <Button size="small" severity="secondary" text rounded @click="acceptBoth" v-tooltip.bottom="'Apply all non-conflicting changes from both sides'">
                <template #icon><FoldHorizontal class="w-4 h-4" /></template>
            </Button>
            <div class="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
            <Button size="small" severity="secondary" text rounded @click="smartApply" v-tooltip.bottom="'Smart apply — auto-resolve conflicts (no AI)'">
                <template #icon><Wand2 class="w-4 h-4" /></template>
            </Button>
            <Button size="small" severity="primary" text rounded @click="aiResolve" :loading="aiLoading" v-tooltip.bottom="'Resolve the merge with AI'">
                <template #icon><Bot class="w-4 h-4" /></template>
            </Button>
            <div class="w-px h-5 bg-surface-200 dark:bg-surface-700 mx-1" />
            <div class="flex items-center gap-2 text-xs text-surface-500 mr-1">
                <span class="text-blue-600 dark:text-blue-400">{{ yoursCount }} yours</span>
                <span class="text-green-600 dark:text-green-400">{{ theirsCount }} theirs</span>
                <span :class="conflictCount ? 'text-red-600 dark:text-red-400' : ''">{{ conflictCount }} conflicting</span>
            </div>
            <div v-if="unresolvedCount > 0" class="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-semibold">
                <span>{{ unresolvedCount }} to review</span>
                <Button size="small" severity="secondary" text rounded @click="goToPrevConflict" v-tooltip.bottom="'Previous undecided block'">
                    <template #icon><ChevronUp class="w-3.5 h-3.5" /></template>
                </Button>
                <Button size="small" severity="secondary" text rounded @click="goToNextConflict" v-tooltip.bottom="'Next undecided block'">
                    <template #icon><ChevronDown class="w-3.5 h-3.5" /></template>
                </Button>
            </div>
            <div v-else class="flex items-center gap-1 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-xs font-semibold">
                <Check class="w-3.5 h-3.5" />
                <span>All resolved</span>
            </div>
            <div class="flex-1" />
            <Button size="small" severity="secondary" text rounded @click="toggleCollapse" v-tooltip.bottom="collapseOn ? 'Expand all unchanged sections' : 'Collapse unchanged sections'">
                <template #icon><UnfoldVertical v-if="collapseOn" class="w-4 h-4" /><FoldVertical v-else class="w-4 h-4" /></template>
            </Button>
            <span v-if="aiError" class="text-xs text-red-500 ml-1">{{ aiError }}</span>
        </div>

        <!-- Labels -->
        <div class="flex shrink-0 text-xs font-medium text-surface-500 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
            <div class="flex-1 px-3 py-1.5">Local (yours)</div>
            <div class="w-14 shrink-0" />
            <div class="flex-1 px-3 py-1.5 border-l border-surface-200 dark:border-surface-700">Result</div>
            <div class="w-14 shrink-0 border-l border-surface-200 dark:border-surface-700" />
            <div class="flex-1 px-3 py-1.5 border-l border-surface-200 dark:border-surface-700">Online (theirs)</div>
        </div>

        <!-- Body: panes + gutters holding the per-block buttons -->
        <div ref="bodyEl" class="flex flex-1 min-h-0 relative">
            <div ref="leftEl" class="flex-1 min-h-0 overflow-hidden" />

            <div class="gutter-col w-14 shrink-0 relative bg-surface-50 dark:bg-surface-900/30 border-x border-surface-200 dark:border-surface-700">
                <!-- ribbons tying each block in "Local" to its counterpart in "Result" -->
                <svg class="gutter-links" :viewBox="`0 0 ${GUTTER_W} ${bodyHeight}`" preserveAspectRatio="none">
                    <path v-for="m in markersL" :key="'pl' + m.i" v-show="m.link" :d="m.link" :class="['lnk-' + m.type, { decided: !!m.choice }]" />
                </svg>
                <template v-for="m in markersL" :key="'l' + m.i">
                    <div class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <button v-for="b in buttons(m.type, 'left')" :key="b.choice" :class="{ active: m.choice === b.choice }"
                            @click="setChoice(m.i, b.choice)" v-tooltip.left="b.tip">
                            <component :is="ICONS[b.icon]" class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </template>
            </div>

            <div ref="centerEl" class="flex-1 min-h-0 overflow-hidden" />

            <div class="gutter-col w-14 shrink-0 relative bg-surface-50 dark:bg-surface-900/30 border-x border-surface-200 dark:border-surface-700">
                <!-- ribbons tying each block in "Result" to its counterpart in "Online" -->
                <svg class="gutter-links" :viewBox="`0 0 ${GUTTER_W} ${bodyHeight}`" preserveAspectRatio="none">
                    <path v-for="m in markersR" :key="'pr' + m.i" v-show="m.link" :d="m.link" :class="['lnk-' + m.type, { decided: !!m.choice }]" />
                </svg>
                <template v-for="m in markersR" :key="'r' + m.i">
                    <div class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <button v-for="b in buttons(m.type, 'right')" :key="b.choice" :class="{ active: m.choice === b.choice }"
                            @click="setChoice(m.i, b.choice)" v-tooltip.right="b.tip">
                            <component :is="ICONS[b.icon]" class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </template>
            </div>

            <div ref="rightEl" class="flex-1 min-h-0 overflow-hidden" />
        </div>
    </div>
</template>

<style scoped>
:deep(.cm-editor) { height: 100%; }
:deep(.cm-scroller) { overflow: auto; }

.cm-toolbar :deep(.p-button:not(:disabled):hover) {
    background-color: var(--p-content-hover-background);
    color: var(--p-text-color);
}

:deep(.cm-conflict) { background-color: color-mix(in srgb, var(--p-red-500) 14%, transparent); }
:deep(.cm-changed-local) { background-color: color-mix(in srgb, var(--p-blue-500) 12%, transparent); }
:deep(.cm-changed-online) { background-color: color-mix(in srgb, var(--p-green-500) 12%, transparent); }
/* the exact words that changed inside a block — syntax colours stay readable underneath */
:deep(.cm-word-diff) {
    background-color: color-mix(in srgb, var(--p-primary-400) 30%, transparent);
    border-radius: 0.15rem;
}
/* a settled block keeps a dashed outline so you can still see (and revisit) what you resolved */
:deep(.cm-resolved) {
    --blk-edge: var(--p-text-muted-color);
    border-left: 1px dashed var(--blk-edge);
    border-right: 1px dashed var(--blk-edge);
}
:deep(.cm-conflict.cm-resolved) { --blk-edge: color-mix(in srgb, var(--p-red-500) 55%, transparent); }
:deep(.cm-changed-local.cm-resolved) { --blk-edge: color-mix(in srgb, var(--p-blue-500) 55%, transparent); }
:deep(.cm-changed-online.cm-resolved) { --blk-edge: color-mix(in srgb, var(--p-green-500) 55%, transparent); }
:deep(.cm-resolved.cm-blk-top) { border-top: 1px dashed var(--blk-edge); }
:deep(.cm-resolved.cm-blk-bottom) { border-bottom: 1px dashed var(--blk-edge); }

/* resolved blocks stay tinted, just faint — the change is settled but still locatable */
:deep(.cm-conflict.cm-resolved) { background-color: color-mix(in srgb, var(--p-red-500) 5%, transparent); }
:deep(.cm-changed-local.cm-resolved) { background-color: color-mix(in srgb, var(--p-blue-500) 5%, transparent); }
:deep(.cm-changed-online.cm-resolved) { background-color: color-mix(in srgb, var(--p-green-500) 5%, transparent); }

:deep(.cm-fold) {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    padding: 0.15rem 0.75rem;
    color: var(--p-text-muted-color);
    background-color: color-mix(in srgb, var(--p-primary-500) 8%, transparent);
    border-top: 1px solid var(--p-content-border-color);
    border-bottom: 1px solid var(--p-content-border-color);
    cursor: pointer;
}
:deep(.cm-fold:hover) { background-color: color-mix(in srgb, var(--p-primary-500) 16%, transparent); }

/* CodeMirror makes .cm-editor position:relative, so as a later sibling it would paint over the
   gutter's absolutely positioned buttons and swallow their clicks. */
.gutter-col {
    z-index: 2;
}

.gutter-links {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
.gutter-links path {
    stroke-width: 1;
}
.gutter-links .lnk-conflict {
    fill: color-mix(in srgb, var(--p-red-500) 16%, transparent);
    stroke: color-mix(in srgb, var(--p-red-500) 45%, transparent);
}
.gutter-links .lnk-left {
    fill: color-mix(in srgb, var(--p-blue-500) 14%, transparent);
    stroke: color-mix(in srgb, var(--p-blue-500) 40%, transparent);
}
.gutter-links .lnk-right {
    fill: color-mix(in srgb, var(--p-green-500) 14%, transparent);
    stroke: color-mix(in srgb, var(--p-green-500) 40%, transparent);
}
/* decided blocks fade back, matching the dashed outline in the editors */
.gutter-links path.decided {
    fill-opacity: 0.35;
    stroke-dasharray: 3 2;
}

.gutter-grp {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 1px;
}
.gutter-grp button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px;
    border-radius: 0.2rem;
    border: 1px solid var(--p-content-border-color);
    background-color: var(--p-content-background);
    color: var(--p-text-color);
    cursor: pointer;
}
.gutter-grp button:hover {
    background-color: var(--p-primary-500);
    border-color: var(--p-primary-500);
    color: var(--p-primary-contrast-color);
}
.gutter-grp button.active {
    background-color: color-mix(in srgb, var(--p-primary-500) 25%, transparent);
    border-color: var(--p-primary-500);
}
</style>
