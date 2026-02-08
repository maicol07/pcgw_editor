# PCGamingWiki Editor

![Deploy Status](https://github.com/maicol07/pcgw_editor/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/github/license/maicol07/pcgw_editor)
![Vibecoding](https://img.shields.io/badge/Vibecoding-100%25-8A2BE2)

A modern, high-performance visual editor for PCGamingWiki. Transform wikitext editing into a sleek, real-time experience.

> [!IMPORTANT]
> **Experience the Bleeding Edge**: Try the latest version deployed automatically from the `main` branch at [pcgw-editor.vercel.app](https://pcgw-editor.vercel.app/).

---

## ✨ The Vibecoding Philosophy

This project wasn't just built; it was **manifested**.

Developing this editor was an exercise in *Vibecoding*—a synergy between human intent and artificial intelligence. By leveraging **Google Gemini 3 Pro**, **Google Gemini 3 Flash**, and **Claude 3.5 Sonnet** via the [Antigravity](https://deepmind.google/technologies/antigravity/) platform, we achieved:

-   **Velocity**: Accelerating from concept to production-ready code in hours.
-   **Precision**: Generating complex parsing logic and type-safe interfaces instantly.
-   **Flow**: Maintaining a continuous state of creative momentum, bypassing boilerplate and focusing on high-level architecture.

This is what happens when you code at the speed of thought.

---

## 🚀 Key Features

### 🖥️ Modern Interface
-   **Split-Pane Editing**: Real-time visual feedback with a dedicated preview pane.
-   **Dark Mode Native**: Designed for comfort during late-night editing sessions.
-   **Visual & Code Modes**: Seamlessly switch between intuitive forms and raw wikitext tailored for power users.

### 🧠 Intelligent Analysis
-   **AI Screenshot Analysis**: Paste a screenshot of game video settings, and let our Gemini-powered engine automatically extract and populate the configuration fields. No more manual data entry.

### ⚡ Performance & Usability
-   **Virtual Scrolling**: Effortlessly handle large lists of workspaces and pages without UI lag.
-   **Floating Table of Contents**: Navigate long articles instantly with the new, responsive floating legend in the preview pane.
-   **Auto-Save**: Your work is persisted locally in real-time. Never lose an edit again.

### 🔧 Advanced Tooling
-   **Refined Input System**: Comprehensive support for detailed peripheral configurations including Arcade Sticks, Flight Sticks, and Racing Wheels.
-   **Wikitext Parsing**: Robust bidirectional transformation between wikitext and JSON models.

---

## 🛠️ Tech Stack

Built on the bleeding edge of web technology:

-   **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [PrimeVue 4](https://primevue.org/)
-   **State Management**: [Pinia](https://pinia.vuejs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Utilities**: [VueUse](https://vueuse.org/), [Wikitext Parser](https://github.com/maicol07/wikiparser-node)

---

## 🏁 Getting Started

### Prerequisites
-   Node.js 20+
-   pnpm 9+

### Installation

```bash
git clone https://github.com/maicol07/pcgw_editor.git
cd pcgw_editor
pnpm install
```

### Development

```bash
pnpm run dev
```

### Production Build

```bash
pnpm run build
```

---

## 🤝 Contributing

Join the vibe! Contributions are welcome. Whether it's a bug fix, a new feature, or a design tweak, feel free to open a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.
