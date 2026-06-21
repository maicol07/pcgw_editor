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

export function conflictMarker(local: string, online: string): string {
    return `${HEAD} LOCAL\n${local}\n${SEP}\n${online}\n${TAIL} ONLINE`;
}

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

// Every change starts unresolved — the user must explicitly include/discard/pick each one.
export function defaultChoices(hunks: Hunk[]): Choice[] {
    return hunks.map((h) => (h.type === 'stable' ? 'include' : 'unresolved'));
}

// True once no non-stable hunk is left pending.
export function allResolved(hunks: Hunk[], choices: Choice[]): boolean {
    return hunks.every((h, i) => h.type === 'stable' || choices[i] !== 'unresolved');
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

function hunkText(h: Hunk, c: Choice): string {
    switch (h.type) {
        case 'stable': return h.text;
        // unresolved one-sided changes preview as included (the change applied).
        case 'left': return c === 'discard' ? h.base : h.local;
        case 'right': return c === 'discard' ? h.base : h.online;
        case 'conflict':
            switch (c) {
                case 'left': return h.local;
                case 'right': return h.online;
                case 'both': return `${h.local}\n${h.online}`;
                case 'base': return h.base;
                default: return conflictMarker(h.local, h.online);
            }
    }
}

// Build the merged document plus the char range of every hunk in the result (for decorations).
export function buildResult(hunks: Hunk[], choices: Choice[]): {
    text: string;
    ranges: { from: number; to: number; hunk: number }[];
} {
    const pieces = hunks
        .map((h, i) => ({ text: hunkText(h, choices[i]), hunk: i }))
        .filter((p) => p.text !== '');

    let text = '';
    const ranges: { from: number; to: number; hunk: number }[] = [];
    pieces.forEach((p, idx) => {
        if (idx > 0) text += '\n';
        const from = text.length;
        text += p.text;
        ranges.push({ from, to: text.length, hunk: p.hunk });
    });
    return { text, ranges };
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
