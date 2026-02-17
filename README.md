# Open Higgsfield AI

An open-source AI image and cinema studio that mirrors the Higgsfield product experience. It delivers multi-model image generation with cinematic controls, a premium glassy UI, and local-first history — powered by [Muapi.ai](https://muapi.ai).

![Studio Demo](docs/assets/studio_demo.webp)

> Deep dive into the philosophy and "Infinite Budget" workflow: [Building Open Higgsfield AI](https://medium.com/@anilmatcha/building-open-higgsfield-ai-an-open-source-ai-cinema-studio-83c1e0a2a5f1).

## ✨ What’s Inside

- **Cinema Studio** — Pro camera controls (camera body, lens, focal length, aperture) that translate into prompt modifiers for photorealistic cinematic shots.
- **Multi-Model Switching** — 20+ T2I models (Flux, Nano Banana, Ideogram, Midjourney, SDXL, and more) with per-model controls.
- **Adaptive Controls** — Aspect ratio and resolution pickers adapt to each model’s capabilities (e.g., 4K for Nano Banana Pro in Cinema Studio).
- **Generation History** — Persistent, local-only history with quick re-open, download, and sidebar browsing.
- **One-Click Downloads** — Save full-resolution outputs, up to 4K where supported.
- **API Key Vault** — Keys live in `localStorage` only; never sent anywhere except Muapi.
- **Responsive UI** — Dark, glassy interface optimized for desktop and mobile.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- A [Muapi.ai](https://muapi.ai) API key

### Installation
```bash
git clone https://github.com/Asan1900/Higgsfield-Open.git
cd Higgsfield-Open
npm install
```

### Run Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` and enter your Muapi API key when prompted.

### Production Build / Preview
```bash
npm run build
npm run preview
```

## 🧭 Usage Guide

1) **Enter API Key** — Click the key icon or wait for the prompt. The key is stored locally.
2) **Pick a Model** — Choose from the model gallery; options adapt to model capabilities.
3) **Set Camera/Resolution** — In Cinema Studio, pick body, lens, focal length, and aperture; for models with resolution enums, select up to 4K.
4) **Prompt & Generate** — Write a prompt, hit Generate, and watch progress.
5) **Review History** — Reopen or download any past generation from the sidebar (persisted locally).

## 🏗️ Architecture Overview

```
src/
├── components/
│   ├── ImageStudio.js    # Core studio: prompts, pickers, canvas, history
│   ├── CinemaStudio.js   # Pro studio with camera controls + infinite canvas flow
│   ├── CameraControls.js # Picker for camera/lens/focal/aperture
│   ├── Header.js         # App header with settings & API key entry
│   ├── AuthModal.js      # API key modal
│   ├── SettingsModal.js  # API key management panel
│   └── Sidebar.js        # Navigation / history sidebar
├── lib/
│   ├── muapi.js          # API client (submit + poll with x-api-key)
│   └── models.js         # Model definitions and endpoint mappings
├── styles/               # Tailwind v4 + custom CSS (global, studio, variables)
├── main.js               # App entry
└── style.css             # Tailwind entry
```

Design system: dark theme (`#050505`) with neon accents, heavy glassmorphism, and custom animations (see `src/styles/global.css`).

## 🔌 API Integration (Muapi)

- **Auth**: `x-api-key` header only. Key stored locally.
- **Pattern**: Submit -> Poll
  1. `POST /api/v1/{model-endpoint}` with prompt/params
  2. `GET /api/v1/predictions/{request_id}/result` until status is `completed`
- **CORS**: In dev, Vite proxy routes `/api` to `https://api.muapi.ai`.
- **Normalization**: `muapi.js` normalizes poll responses so `url` is always available.

## 🎥 Cinema Controls Cheat Sheet

| Category | Options |
| --- | --- |
| Cameras | Modular 8K Digital, Full-Frame Cine Digital, Grand Format 70mm Film, Studio Digital S35, Classic 16mm Film, Premium Large Format Digital |
| Lenses | Creative Tilt, Compact Anamorphic, Extreme Macro, 70s Cinema Prime, Classic Anamorphic, Premium Modern Prime, Warm Cinema Prime, Swirl Bokeh Portrait, Vintage Prime, Halation Diffusion, Clinical Sharp Prime |
| Focal Lengths | 8mm (Ultra-Wide), 14mm, 24mm, 35mm (Human Eye), 50mm (Portrait), 85mm (Tight Portrait) |
| Apertures | f/1.4 (Shallow DoF), f/4 (Balanced), f/11 (Deep Focus) |

## 🛠️ Tech Stack
- **Vite** (bundler & dev server)
- **Tailwind CSS v4** (utility-first)
- **Vanilla JS** (no framework)
- **Puppeteer** (bundled for potential automation/snapshots)
- **Muapi.ai** (model gateway)

## 🧱 Project Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview the build locally

## 🔮 Roadmap (next up)
- Wire video models and timeline-like canvas
- In/out-painting tools for the canvas
- Server-backed histories and teams
- Expanded model presets and style bundles

## 🩺 Troubleshooting
- **No response / CORS in dev**: Ensure dev server runs and the Vite proxy is active; calls must go to `/api`.
- **Key not saving**: LocalStorage must be enabled; clear site data and re-enter the key.
- **Model controls missing**: Some models intentionally hide resolution/AR pickers when unsupported.

## 📚 Additional Docs
- `project_knowledge.md` — deeper technical notes and gotchas.
- Medium article — product philosophy and roadmap.

## 🙏 Credits & License
- Built with [Muapi.ai](https://muapi.ai).
- License: **MIT** (see `LICENSE`).
