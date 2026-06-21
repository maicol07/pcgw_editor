<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { EditorView, Decoration, WidgetType, keymap, type DecorationSet } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Prec, type Range } from '@codemirror/state';
import { history } from '@codemirror/commands';
import Button from 'primevue/button';
import {
    ChevronsLeft, ChevronsRight, FoldHorizontal, Wand2, Bot, ArrowLeft, ArrowRight, X, Plus,
    Undo2, Redo2, UnfoldVertical, FoldVertical,
} from 'lucide-vue-next';
import {
    computeHunks, defaultChoices, smartChoices, buildResult, findConflicts, allResolved,
    type Hunk, type Choice,
} from './merge3';
import { resolveMerge } from '../../../services/ai/AIService';
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
const expanded = new Set<number>(); // stable hunks the user expanded
const collapseOn = ref(true);
const aiLoading = ref(false);
const aiError = ref('');

const markers = ref<{ i: number; type: Hunk['type']; top: number }[]>([]);

// ---- model undo/redo (actions are state changes, not just text) ----
type Snap = { hunks: Hunk[]; choices: Choice[] };
let past: Snap[] = [], futureStk: Snap[] = [];
const canUndo = ref(false), canRedo = ref(false);
const syncHist = () => { canUndo.value = past.length > 0; canRedo.value = futureStk.length > 0; };
const snap = (): Snap => ({ hunks: hunks.slice(), choices: choices.slice() });
const pushUndo = () => { past.push(snap()); futureStk = []; syncHist(); };
function undo() {
    if (!past.length) return false;
    futureStk.push(snap());
    const s = past.pop()!; hunks = s.hunks; choices = s.choices;
    rebuild(); syncHist(); return true;
}
function redo() {
    if (!futureStk.length) return false;
    past.push(snap());
    const s = futureStk.pop()!; hunks = s.hunks; choices = s.choices;
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

function buildCenterDeco(state: EditorState): DecorationSet {
    const out: Range<Decoration>[] = [];
    for (const r of ranges) {
        const h = hunks[r.hunk];
        const fromLine = state.doc.lineAt(r.from).number, toLine = state.doc.lineAt(r.to).number;
        if (h.type === 'stable') {
            const fold = foldRange(state.doc, fromLine, toLine, r.hunk);
            if (fold) out.push(fold);
        } else if (choices[r.hunk] === 'unresolved') {
            const cls = h.type === 'conflict' ? 'cm-conflict' : h.type === 'left' ? 'cm-changed-local' : 'cm-changed-online';
            for (let n = fromLine; n <= toLine; n++) out.push(Decoration.line({ class: cls }).range(state.doc.line(n).from));
        }
    }
    return Decoration.set(out, true);
}

// side: 'local' uses lRange + (left|conflict); 'online' uses oRange + (right|conflict).
function buildPaneDeco(state: EditorState, side: 'local' | 'online'): DecorationSet {
    const out: Range<Decoration>[] = [];
    const lines = state.doc.lines;
    hunks.forEach((h, i) => {
        const [from0, to0] = side === 'local' ? h.lRange : h.oRange;
        if (to0 <= from0) return;
        const fromLine = from0 + 1, toLine = Math.min(to0, lines);
        if (h.type === 'stable') {
            const fold = foldRange(state.doc, fromLine, toLine, i);
            if (fold) out.push(fold);
            return;
        }
        const owns = side === 'local' ? (h.type === 'left' || h.type === 'conflict') : (h.type === 'right' || h.type === 'conflict');
        if (!owns || choices[i] !== 'unresolved') return; // resolved → clear origin highlight too
        const cls = h.type === 'conflict' ? 'cm-conflict' : side === 'local' ? 'cm-changed-local' : 'cm-changed-online';
        for (let n = fromLine; n <= toLine; n++) out.push(Decoration.line({ class: cls }).range(state.doc.line(n).from));
    });
    return Decoration.set(out, true);
}

const centerEl = ref<HTMLDivElement>();
const leftEl = ref<HTMLDivElement>();
const rightEl = ref<HTMLDivElement>();
const bodyEl = ref<HTMLDivElement>();
let left: EditorView | null = null, center: EditorView | null = null, right: EditorView | null = null;

const emitState = (doc: string) => {
    emit('update:result', doc);
    emit('update:conflictsResolved', allResolved(hunks, choices) && findConflicts(doc).length === 0);
};

function recomputeMarkers() {
    if (!center || !bodyEl.value) { markers.value = []; return; }
    const bodyTop = bodyEl.value.getBoundingClientRect().top;
    const bodyH = bodyEl.value.clientHeight;
    const out: { i: number; type: Hunk['type']; top: number }[] = [];
    for (const r of ranges) {
        if (hunks[r.hunk].type === 'stable' || choices[r.hunk] !== 'unresolved') continue;
        const coords = center.coordsAtPos(r.from);
        if (!coords) continue;
        const top = coords.top - bodyTop;
        if (top < 0 || top > bodyH) continue;
        out.push({ i: r.hunk, type: hunks[r.hunk].type, top });
    }
    markers.value = out;
}

function refreshDecos() {
    if (!center) return;
    center.dispatch({ effects: setDeco.of(buildCenterDeco(center.state)) });
    left?.dispatch({ effects: setDeco.of(buildPaneDeco(left.state, 'local')) });
    right?.dispatch({ effects: setDeco.of(buildPaneDeco(right.state, 'online')) });
    nextTick(() => requestAnimationFrame(recomputeMarkers));
}

// ponytail: rebuild replaces the whole result doc from the model — manual edits made before
// pressing a button are discarded. Edit freely for final touch-ups after resolving via buttons.
function rebuild() {
    if (!center) return;
    aiError.value = '';
    const scroll = center.scrollDOM.scrollTop; // preserve position — no jump on button press
    const res = buildResult(hunks, choices);
    ranges = res.ranges;
    center.dispatch({
        changes: { from: 0, to: center.state.doc.length, insert: res.text },
        selection: { anchor: Math.min(center.state.selection.main.anchor, res.text.length) },
        scrollIntoView: false,
    });
    center.scrollDOM.scrollTop = scroll;
    refreshDecos();
    emitState(res.text);
}

function setChoice(idx: number, c: Choice) { pushUndo(); choices[idx] = c; rebuild(); }
function applyAll(map: (h: Hunk) => Choice) { pushUndo(); choices = hunks.map(map); rebuild(); }
const acceptLeft = () => applyAll((h) => (h.type === 'conflict' ? 'left' : h.type === 'right' ? 'discard' : 'include'));
const acceptRight = () => applyAll((h) => (h.type === 'conflict' ? 'right' : h.type === 'left' ? 'discard' : 'include'));
const acceptBoth = () => applyAll((h) => (h.type === 'conflict' ? 'unresolved' : 'include'));
const smartApply = () => { pushUndo(); choices = smartChoices(hunks); rebuild(); };

function toggleCollapse() {
    collapseOn.value = !collapseOn.value;
    if (collapseOn.value) expanded.clear(); // re-collapse everything
    refreshDecos();
}

async function aiResolve() {
    aiLoading.value = true; aiError.value = '';
    try {
        const merged = await resolveMerge(props.local, props.base, props.online);
        pushUndo();
        hunks = []; choices = []; ranges = []; // AI output isn't model-tracked → fully resolved
        center!.dispatch({ changes: { from: 0, to: center!.state.doc.length, insert: merged }, scrollIntoView: false });
        center!.dispatch({ effects: setDeco.of(Decoration.none) });
        markers.value = [];
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

const build = () => {
    [left, center, right].forEach((v) => v?.destroy());
    past = []; futureStk = []; expanded.clear(); syncHist();
    const dark = isDark();
    const ro = [...wikitextExtensions(dark), decoField, EditorState.readOnly.of(true), EditorView.editable.of(false)];

    left = new EditorView({ doc: props.local, parent: leftEl.value, extensions: ro });
    right = new EditorView({ doc: props.online, parent: rightEl.value, extensions: ro });

    hunks = computeHunks(props.local, props.base, props.online);
    choices = defaultChoices(hunks);
    center = new EditorView({
        doc: '', parent: centerEl.value,
        extensions: [
            ...wikitextExtensions(dark),
            decoField,
            history(),
            undoRedoKeys,
            EditorView.updateListener.of((u) => {
                if (u.docChanged && !u.transactions.some((t) => t.effects.some((e) => e.is(setDeco)))) {
                    emitState(u.state.doc.toString());
                }
            }),
        ],
    });
    rebuild();
    syncScroll();
};

function syncScroll() {
    const views = [left, center, right].filter(Boolean) as EditorView[];
    let locked = false;
    for (const v of views) {
        v.scrollDOM.addEventListener('scroll', () => {
            if (!locked) {
                locked = true;
                for (const o of views) if (o !== v) o.scrollDOM.scrollTop = v.scrollDOM.scrollTop;
                locked = false;
            }
            requestAnimationFrame(recomputeMarkers);
        });
    }
}

const onResize = () => requestAnimationFrame(recomputeMarkers);

onMounted(() => {
    build();
    window.addEventListener('resize', onResize);
    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    onUnmounted(() => observer.disconnect());
});

watch(() => [props.local, props.base, props.online], build);

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
            <div class="flex-1" />
            <Button size="small" severity="secondary" text rounded @click="toggleCollapse" v-tooltip.bottom="collapseOn ? 'Expand all unchanged sections' : 'Collapse unchanged sections'">
                <template #icon><UnfoldVertical v-if="collapseOn" class="w-4 h-4" /><FoldVertical v-else class="w-4 h-4" /></template>
            </Button>
            <span v-if="aiError" class="text-xs text-red-500 ml-1">{{ aiError }}</span>
        </div>

        <!-- Labels -->
        <div class="flex shrink-0 text-xs font-medium text-surface-500 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
            <div class="flex-1 px-3 py-1.5">Local (yours)</div>
            <div class="w-10 shrink-0" />
            <div class="flex-1 px-3 py-1.5 border-l border-surface-200 dark:border-surface-700">Result</div>
            <div class="w-10 shrink-0 border-l border-surface-200 dark:border-surface-700" />
            <div class="flex-1 px-3 py-1.5 border-l border-surface-200 dark:border-surface-700">Online (theirs)</div>
        </div>

        <!-- Body: panes + gutters holding the per-block buttons -->
        <div ref="bodyEl" class="flex flex-1 min-h-0 relative">
            <div ref="leftEl" class="flex-1 min-h-0 overflow-hidden" />

            <div class="w-10 shrink-0 relative bg-surface-50 dark:bg-surface-900/30 border-x border-surface-200 dark:border-surface-700">
                <template v-for="m in markers" :key="'l' + m.i">
                    <div v-if="m.type === 'left' || m.type === 'conflict'" class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <button v-if="m.type === 'left'" @click="setChoice(m.i, 'include')" v-tooltip.left="'Include your change'"><ArrowRight class="w-3.5 h-3.5" /></button>
                        <button v-if="m.type === 'left'" @click="setChoice(m.i, 'discard')" v-tooltip.left="'Discard your change'"><X class="w-3.5 h-3.5" /></button>
                        <button v-if="m.type === 'conflict'" @click="setChoice(m.i, 'left')" v-tooltip.left="'Take yours'"><ArrowRight class="w-3.5 h-3.5" /></button>
                        <button v-if="m.type === 'conflict'" @click="setChoice(m.i, 'both')" v-tooltip.left="'Keep both'"><Plus class="w-3.5 h-3.5" /></button>
                    </div>
                </template>
            </div>

            <div ref="centerEl" class="flex-1 min-h-0 overflow-hidden" />

            <div class="w-10 shrink-0 relative bg-surface-50 dark:bg-surface-900/30 border-x border-surface-200 dark:border-surface-700">
                <template v-for="m in markers" :key="'r' + m.i">
                    <div v-if="m.type === 'right' || m.type === 'conflict'" class="gutter-grp" :style="{ top: m.top + 'px' }">
                        <button v-if="m.type === 'right'" @click="setChoice(m.i, 'include')" v-tooltip.right="'Include their change'"><ArrowLeft class="w-3.5 h-3.5" /></button>
                        <button v-if="m.type === 'right'" @click="setChoice(m.i, 'discard')" v-tooltip.right="'Discard their change'"><X class="w-3.5 h-3.5" /></button>
                        <button v-if="m.type === 'conflict'" @click="setChoice(m.i, 'right')" v-tooltip.right="'Take theirs'"><ArrowLeft class="w-3.5 h-3.5" /></button>
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

.gutter-grp {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 2px;
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
</style>
