# PCGW Editor

Vue 3 and TypeScript application for editing PCGamingWiki wikitext. Vite builds the
PWA, Pinia manages UI state, OpenVue supplies controls, and CodeMirror 6 renders
code and diff editors. Use Bun and the existing `bun.lock`.

## Conventions

- Keep changes scoped and preserve unrelated worktree changes.
- Follow existing Vue script-setup and TypeScript conventions.
- Comments and UI text are in English.
- Do not commit, push, or change branches without explicit instructions.
- Run `bun run typecheck`, focused `bun run test --run <paths>`, and `bun run build`.
- Tests use Vitest, Vue Test Utils, and jsdom. Prefer real editor state/history
  integration over mocks for merge behavior.

## Three-way merge

- Local and Online are read-only. Result starts from Base and remains editable.
- Accept and Ignore decide each side independently. Resolve using Left/Right
  accepts that side and ignores the other. Accepting both preserves click order.
- Bulk non-conflicting actions must preserve existing decisions and manual edits
  outside the applied blocks. Simple conflicts only merge disjoint character edits.
- Merge metadata and typing share CodeMirror's native undo history.
- Keep `@codemirror/state` and `@codemirror/view` overrides tied to direct
  dependencies. Multiple installed copies break editor extensions and types.

## Validation limits

- Chromium smoke checks cover merge controls, manual typing, keyboard actions,
  light/dark themes, and undo/redo. Firefox and Safari have not been checked.
- AI-provider merge requests require separate live validation with credentials.
- Build warnings about upstream wiki asset URLs and chunk sizes are outside the
  merge editor scope.
