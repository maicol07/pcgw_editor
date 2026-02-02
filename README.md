# PCGamingWiki Editor


A modern, two-pane visual editor for PCGamingWiki articles with live preview functionality.

> [!TIP]
> **Edge Version**: You can try the latest version (updated on every commit) at [pcgw-editor.vercel.app](https://pcgw-editor.vercel.app/).


## About This Project

This project was **vibecoded** using AI assistance from **Google Gemini 3 Pro** and **Claude Sonnet 4.5** via the [Antigravity](https://deepmind.google/technologies/antigravity/) AI coding platform.

### Why Vibecoding?

I chose to develop this project with AI assistance for three main reasons:

- **Speed**: Deliver a complete, production-ready application in a fraction of the time traditional development would require
- **Automatic Documentation**: AI-generated comprehensive code comments, README, and technical documentation throughout the codebase
- **Efficient Effort**: Since this is a tool I use occasionally rather than daily, vibecoding allowed me to get a fully-functional editor without investing extensive manual development time

The result is a working editor with modern architecture, proper TypeScript typing, and clean code – all developed in hours instead of weeks.

## Features

- **Split-pane interface**: Visual form editor on the left, live preview on the right
- **Visual & Code modes**: Switch between visual forms and raw wikitext editing
- **Live preview**: See your changes rendered in real-time (API or local rendering)
- **Multiple workspaces**: Work on multiple articles simultaneously with workspace management
- **Auto-save**: All changes are automatically saved to browser localStorage
- **Import/Export**: Export your work as JSON and import it later
- **Optimized storage**: Stores only generated wikitext instead of verbose data structures
- **Modern UI**: Built with PrimeVue and Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/maicol07/pcgw_editor.git
cd pcgw_editor

# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

The application will be available at `http://localhost:5174`

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist/` directory.

## Usage

1. **Create a page**: Click the sidebar icon to open the workspace manager and create a new page
2. **Fill in the forms**: Use the visual editor to fill in article information (Infobox, Availability, Technical Specs, etc.)
3. **Preview**: See the rendered output in real-time on the right pane
4. **Switch modes**: Toggle between Visual and Code mode to edit raw wikitext if needed
5. **Export**: Export your work as JSON for backup or sharing

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **PrimeVue** - Rich UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **VueUse** - Vue composition utilities

## Project Structure

```
src/
├── components/       # Vue components (forms, UI elements)
├── models/          # TypeScript interfaces and data models
├── stores/          # Pinia stores for state management
├── utils/           # Utilities (wikitext parser, renderer, generators)
├── composables/     # Vue composables
└── App.vue          # Main application component
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Deployment

The project is automatically deployed via GitHub Actions on every push to the `main` branch.

The live application is available at a custom domain (configured via GitHub Pages).
