# B7G Kannada Rajyotsava

A premium, bilingual (English + ಕನ್ನಡ) promotional microsite for the B7G Kannada Rajyotsava community celebration — hero storytelling, live community impact counters, a filterable program schedule, a photo/video gallery, a sponsor wall, and a grounded AI assistant (RAG) that answers questions about the event.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config.js` needed)
- Framer Motion for animation, Lucide for icons
- No backend is wired up yet — all data is served from typed mock data under `src/data/`, behind the same interfaces the real API/Supabase/RAG backend will use. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build
npm run lint      # oxlint
npm run preview   # preview the production build
```

Copy `.env.example` to `.env` to configure a real API/Supabase/AI backend later. With no env vars set, the site runs entirely on bundled mock data (`VITE_USE_MOCK_DATA` defaults to `true`).

## Project structure

```
src/
├── components/     # Presentational + section components (Hero, Navbar, Gallery, ...)
├── context/        # LanguageContext (en/kn switcher)
├── config/         # env.ts — reads Vite env vars, exposes USE_MOCK_DATA
├── data/           # Mock/content data: programs, sponsors, gallery, translations, Kannada FAQs
├── hooks/          # useLiveCounters, useSchedule, useAIChat, useReducedMotion
├── pages/          # Home.tsx composes the page from sections
├── services/       # Data access layer (schedule, donations, api) + ai/ (RAG pipeline)
└── types/          # Shared TypeScript types (Program, Sponsor, GalleryItem, ...)
knowledge/          # Markdown knowledge base the AI assistant answers from
```

Content (programs, sponsors, gallery, translations) is intentionally separate from presentation — updating next year's event means editing files in `src/data/`, not component code. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## AI Assistant

The floating "Ask B7G AI" widget is a RAG (retrieval-augmented generation) assistant grounded strictly in event data — it will not invent timings, performers, sponsors, or locations, and says so explicitly when it doesn't know something. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#rag-architecture) for how it works and how to wire in a real LLM.

## AI knowledge base (RAG)

The assistant can answer from a Supabase **pgvector** knowledge base with **Claude** (backend in `backend/`). Knowledge lives in `knowledge/` as JSON or Markdown; add a file and run `npm run rag:ingest` — no code changes. Setup, environment variables and tuning: [docs/RAG.md](docs/RAG.md).

```bash
npm run rag:ingest   # load knowledge/ → chunks → embeddings → Supabase
npm run rag:server   # API on :8787 (POST /api/rag/query), proxied by Vite at /api
npm run rag:test     # offline tests, no keys needed
npm run rag:eval     # live acceptance questions (needs keys)
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — component architecture, data model, RAG pipeline, Supabase schema sketch
- [docs/RAG.md](docs/RAG.md) — Supabase pgvector RAG: setup, env vars, knowledge format, tuning, security
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) — how to update programs, sponsors, gallery and translations for a future event
