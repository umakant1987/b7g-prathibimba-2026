# Architecture

## Component architecture

```
src/pages/Home.tsx
├── Navbar                 fixed header, language switcher, mobile menu
├── Hero                   cinematic hero, animated title lines, CTAs
├── WhyKannada             storytelling cards (SectionHeader + 4 cards)
├── ImpactCounters         live donation/contributor stats (AnimatedCounter)
├── ProgramSchedule        search + category filters, ProgramCard grid
├── Gallery                masonry-style grid, GalleryLightbox on click
├── Sponsors               grouped by SponsorCategory, SponsorLogo wall
├── CommunityCTA           closing call-to-action
├── Footer
└── AIChatAssistant        floating widget, mounted once at page level
```

Shared primitives: `SectionHeader` (eyebrow/title/subtitle + scroll-reveal) and `AnimatedCounter` (eased number tween, respects `prefers-reduced-motion`).

State/data flow is pulled out of components into **hooks** (`useSchedule`, `useLiveCounters`, `useAIChat`, `useReducedMotion`) which call the **services** layer, which in turn reads either mock data (`src/data/`) or a real API, gated by `USE_MOCK_DATA` (`src/config/env.ts`). Components never import `src/data/*` directly except where the data genuinely is static content (translations, sponsor/gallery lists) rather than live/queryable state.

Language: `LanguageContext` holds the current language (`en` | `kn`) and a `t(localizedText)` helper. Every piece of user-facing copy is modeled as `{ en: string; kn: string }` (`LocalizedText`), so nothing is hardcoded to one language inside a component.

## Data model

Defined in `src/types/index.ts`:

- `Program` — id, bilingual title/description, date, startTime/endTime (`HH:mm`), venue, category, status, performers
- `Sponsor` — id, name, logo, category (`Title Sponsor` | `Powered By` | `Gold Sponsor` | `Silver Sponsor` | `Community Partner`)
- `GalleryItem` — id, type (`photo` | `video`), bilingual title, thumbnail, url, year
- `ImpactStats` — contributors, familiesParticipating, programsCount, updatedAt
- `Venue`, `FAQ` — used by the AI assistant's knowledge base

### Suggested Supabase schema (production)

```sql
programs (
  id uuid primary key,
  title_en text, title_kn text,
  description_en text, description_kn text,
  date date, start_time time, end_time time,
  venue text, category text, status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

sponsors (
  id uuid primary key,
  name text, logo_url text, category text, website text
);

donations (
  id uuid primary key,
  contributor_name text,
  amount numeric,
  status text check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);
```

Public endpoints must only ever expose **aggregates** over `donations` (`SUM(amount) where status = 'approved'`, `COUNT(DISTINCT contributor_name)`), never raw donor/payment rows — see `src/services/donations.ts`.

## Live counters

```
Supabase (donations table, realtime or polled aggregate)
   -> API (/impact-stats)
   -> services/donations.ts (fetchImpactStats)
   -> hooks/useLiveCounters.ts
   -> components/ImpactCounters.tsx -> AnimatedCounter
```

In dev (`USE_MOCK_DATA=true`), `mockNextTick` simulates small periodic increments so the animated-counter UI can be exercised without a backend. Replace the polling `setInterval` in `useLiveCounters` with a Supabase realtime subscription when wiring up the real backend — the hook's public shape (`{ stats, loading, error }`) doesn't need to change.

## Community Love (reactions)

```
components/Hero.tsx (compact CTA) ─┐
                                    ├─ context/ReactionsContext.tsx (single useReactions() instance)
components/CommunityLove.tsx ──────┘        |
                                             v
                                   hooks/useReactions.ts
                                             |
                                   services/reactions.ts  <-> Supabase `reactions` table (production)
```

One `useReactions()` instance lives in `ReactionsProvider` (mounted in `App.tsx`), so the Hero's compact "Show Your Love" CTA and the full `CommunityLove` section always show the same live counts — clicking either updates both.

- **Optimistic UI**: `react(type)` increments `countsRef`/`counts` synchronously before `services/reactions.submitReaction` resolves, so the heart burst and counter update happen with zero perceived latency. The confirmed value from the service call then replaces the optimistic one (a no-op in mock mode, since the mock just increments the same base).
- **Anti-spam**: a rolling 4-second/12-click window (`CLICK_WINDOW_MS`/`CLICK_LIMIT` in `useReactions.ts`) caps client-side increments and surfaces a brief "slow down" message; this is a UX safety net, not the source of truth. Production must also rate-limit server-side (e.g., a Postgres function or RLS policy keyed on `session_id`) since a client can always be bypassed.
- **Milestones**: crossing a threshold in `data/reactions.ts` (`MILESTONES`) triggers `MilestoneCelebration` (confetti + banner) once per browser, tracked via a `localStorage` flag so it doesn't repeat on refresh.
- **Milestone progress**: a bar shows progress from the last reached milestone to the next one, and how many more ❤️ are needed.
- **Learn a Kannada word**: every accepted reaction increments `wordsLearned`, and `CommunityLove` reveals the next word from `KANNADA_WORDS` in `data/reactions.ts` (Kannada script, pronunciation, meaning).
- **Shared counter (Supabase)**: with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set, totals live in the `reaction_counts` table ([supabase/reactions.sql](../supabase/reactions.sql)). Visitors can only read counts; taps go through the `add_reaction` function, which rate-limits each anonymous `session_id` (20 taps / 10 s). Realtime `UPDATE` events on `reaction_counts` push other visitors' taps to every open page. The displayed number is the latest server total plus this visitor's in-flight taps, so it never jumps backwards.
- **Fallback**: without Supabase, or if it can't be reached, counts are kept in this browser's localStorage and the section says it's counting this browser only. There is no simulated activity.
- No personal data is stored or shown — a real backend should store only `reaction_type` and an anonymous `session_id` (`services/reactions.getSessionId()`).

### Suggested Supabase schema

```sql
reactions (
  id uuid primary key default gen_random_uuid(),
  reaction_type text check (reaction_type in ('love','proud','support','respect','celebrate')),
  session_id text not null,
  created_at timestamptz default now()
);

create index reactions_session_window_idx on reactions (session_id, created_at);
-- Rate limit: reject inserts where this session already has >= N rows in the last M seconds.
```

## RAG architecture

```
knowledge/*.md (+ Kannada entries in data/knowledgeBase.ts)
        |
        v
  Document chunking        services/ai/knowledgeLoader.ts (one chunk per ## section)
                           services/ai/retrieval.ts: buildCorpus()
        |
        v
  Embeddings                (mock: term-overlap scoring; prod: real embedding model)
        |
        v
  Vector store               (mock: in-memory array; prod: Supabase pgvector)
        |
User -> Chat UI -> Intent detection -> [structured query | retrieval] -> LLM -> Grounded answer
```

- **Intent detection** (`services/ai/intentDetection.ts`) is a fast rule-based classifier: `schedule_now`, `schedule_next`, `schedule_at_time`, `schedule_category`, `schedule_today`, `sponsors`, `venue`, `faq`, `general`.
- **Guests first.** `services/ai/guestService.ts` handles guest questions from the `type: guest` knowledge files: a bare name or nickname returns a profile card, "who are the guests?" returns cards with each guest's exact role and date, and specific questions ("What movies has he acted in?") return that guest's matching section. The last guest discussed is passed back as `ChatContext.lastGuestId` so "he/his" follow-ups resolve.
- **Structured queries first.** Anything schedule-shaped ("what's happening now", "what's at 6pm", "programs for kids") is answered directly from `programs` data (`services/schedule.ts`) — never from the LLM — so timings can't be hallucinated. This matches the explicit requirement that schedule questions prioritize structured data over vector search.
- **Retrieval fallback.** Everything else (Chief Guests, FAQs, Kannada Rajyotsava, B7G, previous events) goes through `retrieveRelevantDocs` — a term-overlap "mock embedding" over the `knowledge/*.md` sections (loaded via `import.meta.glob` in `knowledgeLoader.ts`), plus the bilingual entries in `data/knowledgeBase.ts` for Kannada questions. Heading matches rank the most on-topic section first. It requires a minimum match score before returning a document, so a single incidental word match doesn't produce a misleading answer.
- **Backend RAG** (when `VITE_RAG_API_URL` is set): non-structured questions go to `POST /api/rag/query` (`backend/server.ts`), which runs hybrid pgvector + keyword retrieval in Supabase and answers with Claude from the retrieved knowledge only. See [RAG.md](RAG.md).
- **Grounding / safety.** If nothing relevant is found, the assistant says it doesn't have that information rather than guessing. If the backend is unreachable, the chat falls back to the offline retrieval above.

### Swapping in a real backend

1. Point `VITE_API_URL` at a REST API backed by Supabase (`programs`, `sponsors`, `impact-stats` endpoints) — `services/api.ts` + `services/schedule.ts` / `services/donations.ts` already call through `apiGet`, so no component changes are needed.
2. For the AI assistant, follow [RAG.md](RAG.md) (Supabase pgvector + backend API).
