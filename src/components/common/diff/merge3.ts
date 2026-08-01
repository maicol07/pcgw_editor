// Pure 3-way merge helpers (no DOM) — unit-testable, used by ThreeWayMerge.vue.
import { diffComm, diffIndices } from 'node-diff3';

export const HEAD = '<<<<<<<';
export const SEP = '=======';
export const TAIL = '>>>>>>>';

export type Conflict = { from: number; to: number; ours: string; theirs: string };

// A change block between the three versions.
//  stable   = identical across all (or both sides made the same edit) → always kept
//  left     = only the local version differs (edit or insertion)
//  right    = only the online version differs
//  conflict = both sides changed the same region differently
type LineRanges = { lRange: [number, number]; oRange: [number, number] };
export type Hunk =
    | ({ type: 'stable'; text: string } & LineRanges)
    | ({ type: 'left'; base: string; local: string } & LineRanges)
    | ({ type: 'right'; base: string; online: string } & LineRanges)
    | ({ type: 'conflict'; base: string; local: string; online: string } & LineRanges);

// Per-hunk resolution. left/right use include|discard; conflict uses the rest.
export type Choice = 'include' | 'discard' | 'left' | 'right' | 'both' | 'base' | 'unresolved';

// A change of one side against the base: base lines [bs, be) replaced by `lines`.
type Diff = { bs: number; be: number; lines: string[] };

function sideDiffs(baseL: string[], sideL: string[]): Diff[] {
    return (diffIndices(baseL, sideL) as any[]).map((d) => ({
        bs: d.buffer1[0],
        be: d.buffer1[0] + d.buffer1[1],
        lines: d.buffer2Content,
    }));
}

// Reconstruct one side's content over base range [bs, be) by applying its diffs.
function applySide(baseL: string[], bs: number, be: number, diffs: Diff[]): string {
    const out: string[] = [];
    let cur = bs;
    for (const d of diffs) {
        out.push(...baseL.slice(cur, d.bs), ...d.lines);
        cur = d.be;
    }
    out.push(...baseL.slice(cur, be));
    return out.join('\n');
}

const lineCount = (s: string) => (s === '' ? 0 : s.split('\n').length);

// Classify the three versions into an ordered list of hunks (diff3 over two 2-way diffs).
// Each hunk also carries its 0-based line range in the local and online docs (lRange/oRange),
// so the side panes can highlight exactly the lines a hunk owns.
export function computeHunks(local: string, base: string, online: string): Hunk[] {
    const baseL = base.split('\n');
    const L = sideDiffs(baseL, local.split('\n'));
    const R = sideDiffs(baseL, online.split('\n'));

    const hunks: Hunk[] = [];
    let pos = 0, li = 0, ri = 0, lLine = 0, oLine = 0;
    const advance = (ll: number, ol: number): { lRange: [number, number]; oRange: [number, number] } => {
        const r = { lRange: [lLine, lLine + ll] as [number, number], oRange: [oLine, oLine + ol] as [number, number] };
        lLine += ll; oLine += ol;
        return r;
    };
    const stable = (from: number, to: number) => {
        if (to > from) hunks.push({ type: 'stable', text: baseL.slice(from, to).join('\n'), ...advance(to - from, to - from) });
    };

    while (li < L.length || ri < R.length) {
        const l = L[li], r = R[ri];
        if (r === undefined || (l !== undefined && l.be <= r.bs)) {
            stable(pos, l.bs);
            hunks.push({
                type: 'left', base: baseL.slice(l.bs, l.be).join('\n'), local: l.lines.join('\n'),
                ...advance(l.lines.length, l.be - l.bs),
            });
            pos = l.be; li++;
        } else if (l === undefined || r.be <= l.bs) {
            stable(pos, r.bs);
            hunks.push({
                type: 'right', base: baseL.slice(r.bs, r.be).join('\n'), online: r.lines.join('\n'),
                ...advance(r.be - r.bs, r.lines.length),
            });
            pos = r.be; ri++;
        } else {
            // Overlapping changes → conflict. Expand to cover all chained overlaps.
            let bs = Math.min(l.bs, r.bs), be = Math.max(l.be, r.be);
            stable(pos, bs);
            const cl: Diff[] = [], cr: Diff[] = [];
            for (let grew = true; grew;) {
                grew = false;
                while (li < L.length && L[li].bs < be) { be = Math.max(be, L[li].be); cl.push(L[li++]); grew = true; }
                while (ri < R.length && R[ri].bs < be) { be = Math.max(be, R[ri].be); cr.push(R[ri++]); grew = true; }
            }
            const localT = applySide(baseL, bs, be, cl), onlineT = applySide(baseL, bs, be, cr);
            hunks.push({
                type: 'conflict', base: baseL.slice(bs, be).join('\n'), local: localT, online: onlineT,
                ...advance(lineCount(localT), lineCount(onlineT)),
            });
            pos = be;
        }
    }
    stable(pos, baseL.length);
    return hunks;
}

// Nothing is applied up front: the result starts as the common ancestor and each block enters it only
// when the user picks a side.
export function defaultChoices(hunks: Hunk[]): Choice[] {
    return hunks.map((h) => (h.type === 'stable' ? 'include' : 'unresolved'));
}

// Heuristic auto-resolution: keep both sides of a conflict, preferring the non-empty one.
export function smartChoices(hunks: Hunk[]): Choice[] {
    return hunks.map((h): Choice => {
        if (h.type !== 'conflict') return 'include';
        if (!h.local.trim()) return 'right';
        if (!h.online.trim()) return 'left';
        return 'both';
    });
}

// The text a hunk contributes to the merged result under a given choice. Anything still undecided
// contributes the ancestor's text, so the result reads as "the old page plus what you have accepted".
export function hunkText(h: Hunk, c: Choice): string {
    switch (h.type) {
        case 'stable': return h.text;
        case 'left': return c === 'include' ? h.local : h.base;
        case 'right': return c === 'include' ? h.online : h.base;
        case 'conflict':
            switch (c) {
                case 'left': return h.local;
                case 'right': return h.online;
                case 'both': return `${h.local}\n${h.online}`;
                default: return h.base;
            }
    }
}

// Build the merged document plus the char range of every hunk in the result (for decorations).
// Hunks whose text is empty (a pure deletion) still get a zero-width range so the UI can anchor
// a gutter button and a marker there — otherwise they'd be invisible and unresolvable.
export function buildResult(hunks: Hunk[], choices: Choice[]): {
    text: string;
    ranges: { from: number; to: number; hunk: number }[];
} {
    let text = '';
    let first = true;
    const ranges: { from: number; to: number; hunk: number }[] = [];
    hunks.forEach((h, i) => {
        const piece = hunkText(h, choices[i]);
        if (piece === '') {
            ranges.push({ from: text.length, to: text.length, hunk: i });
            return;
        }
        if (!first) text += '\n';
        first = false;
        const from = text.length;
        text += piece;
        ranges.push({ from, to: text.length, hunk: i });
    });
    return { text, ranges };
}

// Split into words, punctuation and whitespace runs, keeping each token's char offsets.
function tokenize(s: string): { text: string; from: number; to: number }[] {
    const out: { text: string; from: number; to: number }[] = [];
    for (const m of s.matchAll(/\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g)) {
        out.push({ text: m[0], from: m.index!, to: m.index! + m[0].length });
    }
    return out;
}

// Char ranges that differ between two versions of the same block, on each side. Used to tint the
// exact words that changed inside an already highlighted block.
const WORD_DIFF_LIMIT = 20000; // chars — beyond this the token diff isn't worth the work
export function wordDiff(a: string, b: string): { a: [number, number][]; b: [number, number][] } {
    const empty = { a: [] as [number, number][], b: [] as [number, number][] };
    if (a === b || a.length > WORD_DIFF_LIMIT || b.length > WORD_DIFF_LIMIT) return empty;

    const ta = tokenize(a), tb = tokenize(b);
    const out = { a: [] as [number, number][], b: [] as [number, number][] };
    const span = (toks: typeof ta, start: number, len: number): [number, number] | null =>
        len > 0 ? [toks[start].from, toks[start + len - 1].to] : null;

    for (const d of diffIndices(ta.map((t) => t.text), tb.map((t) => t.text)) as any[]) {
        const ra = span(ta, d.buffer1[0], d.buffer1[1]);
        const rb = span(tb, d.buffer2[0], d.buffer2[1]);
        if (ra) out.a.push(ra);
        if (rb) out.b.push(rb);
    }
    return out;
}

// 0-based line indices in `side` that differ from `base` (added or modified lines).
export function changedLineSet(base: string, side: string): Set<number> {
    const changed = new Set<number>();
    let line = 0;
    for (const chunk of diffComm(base.split('\n'), side.split('\n')) as any[]) {
        if (chunk.common) {
            line += chunk.common.length;
        } else {
            const n = chunk.buffer2.length;
            for (let i = 0; i < n; i++) changed.add(line + i);
            line += n;
        }
    }
    return changed;
}

// Scan a document for conflict blocks; positions are absolute character offsets.
export function findConflicts(doc: string): Conflict[] {
    const lines = doc.split('\n');
    const lineStart: number[] = [];
    let offset = 0;
    for (const l of lines) { lineStart.push(offset); offset += l.length + 1; }

    const conflicts: Conflict[] = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].startsWith(HEAD)) {
            const head = i;
            let sep = -1, tail = -1;
            for (let j = i + 1; j < lines.length; j++) {
                if (sep === -1 && lines[j].startsWith(SEP)) sep = j;
                else if (sep !== -1 && lines[j].startsWith(TAIL)) { tail = j; break; }
            }
            if (sep !== -1 && tail !== -1) {
                conflicts.push({
                    from: lineStart[head],
                    to: lineStart[tail] + lines[tail].length,
                    ours: lines.slice(head + 1, sep).join('\n'),
                    theirs: lines.slice(sep + 1, tail).join('\n'),
                });
                i = tail + 1;
                continue;
            }
        }
        i++;
    }
    return conflicts;
}
