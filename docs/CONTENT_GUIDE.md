# Updating content for a future event

All event content lives in `src/data/` as typed TypeScript objects — no component code needs to change to update next year's event.

## Program schedule

The programme lives in `knowledge/programme-2026.json` — one record per day/session and one per programme item (`event_date`, `session`, `sequence`, `performer`, `performance_type`). The website's Programme section (`src/data/programs.ts`) and the AI assistant both read this file, so edit it once, then rebuild the site and run `npm run rag:ingest`.

- Keep names exactly as the organisers write them.
- Timings: add `"start_time": "18:30", "end_time": "18:45"` to performance records once announced. Until then the page shows "Timings to be announced" and the LIVE NOW / UP NEXT badges stay off.
- The filter chips (Music, Dance, Drama, Kids, Talks, Ceremony, More) are derived from `performance_type` in `categorize()` in `src/data/programs.ts`.

## Releasing the detailed programme

Until the organisers release it, the detailed programme is switched off with `VITE_SHOW_PROGRAMME_DETAILS=false` in `.env` (one setting for both the website and the AI):

- **Website:** the Programmes section shows the four posters (`public/posters/`) instead of the running order.
- **AI assistant:** the programme records (category `programme`) are excluded from search, so it shares only the poster highlights (`knowledge/programme-highlights.json`) and says the detailed programme is coming (`knowledge/programme-coming-soon.md`). Schedule suggestions are hidden.

**To release it:** set `VITE_SHOW_PROGRAMME_DETAILS=true`, run `npm run build`, and restart `npm run rag:server`. The running order, performer answers and schedule suggestions return exactly as before, and the "coming soon" note is hidden. No re-ingestion needed.

## Sponsors

Edit `src/data/sponsors.ts`. Put the logo file under `public/sponsors/` and reference it by path. Categories are fixed to `Title Sponsor | Powered By | Gold Sponsor | Silver Sponsor | Community Partner` (the display order is `sponsorCategoryOrder` in the same file).

## Gallery

Edit `src/data/gallery.ts`. Two kinds of entries:

- **`type: 'video'`** — set `youtubeId` to the YouTube video ID (the part after `youtu.be/` or `v=`, not the full URL). The thumbnail is derived automatically via `youtubeThumbnail(id)`, and the lightbox embeds an actual YouTube player (`<iframe>`) for it.
- **`type: 'photo'`** — set `thumbnail` and `url` to an image path under `public/gallery/`.

## Translations / UI copy

All UI copy (nav, hero, section headers, chat strings) lives in `src/data/translations.ts` as `{ en, kn }` pairs — edit text there, not inside components.

## AI assistant knowledge base

The assistant answers from the markdown files in `knowledge/` (project root):

```
knowledge/
├── event.md
├── chief-guests/
│   ├── prakash-belawadi.md
│   ├── dharmendra-kumar-arenahalli.md
│   └── nagabhushana-ns.md        # 31 October guest
├── kannada-rajyotsava.md
├── b7g-community.md
├── programme-2026.json       # official cultural programme (website + AI assistant)
├── sponsors.md
├── previous-events.md
└── faq.md
```

- Every file starts with frontmatter (`title`, `type`, `status`). Use `status: provisional` for anything not yet confirmed by the organisers — the assistant labels it as subject to confirmation.
- Each `## Heading` becomes one searchable section, so give sections descriptive headings. In `faq.md`, write each heading as the question people actually ask.
- Sections headed `Positioning rules`, `How to talk about it`, `Welcome message` or `Not yet in the knowledge base` are guidance for the assistant and are never shown to visitors.
- New `.md` files anywhere under `knowledge/` are picked up automatically at build time.
- Never add a fact that hasn't been confirmed. If something isn't known yet, list it under `## Not yet in the knowledge base`.

### Guest files (`knowledge/chief-guests/*.md`)

Each guest file has `type: guest` and structured frontmatter that drives name searches and guest cards:

| Field | Purpose |
|---|---|
| `name`, `honorific`, `emoji`, `tagline`, `short` | Shown on the guest card |
| `photo` | Image path under `public/`, e.g. `/guests/prakash-belawadi.jpg`. Leave empty to show the emoji avatar |
| `event_role`, `event_date` (+ `_kn` versions) | The exact role and date — the assistant never assumes everyone is a Chief Guest |
| `aliases` | Names people may type, separated by `\|` — include nicknames, misspellings and Kannada spellings |
| `topics` | Things tied to the guest (e.g. `ikkat`) that should find them, while staying part of the question |
| `known_for`, `ask` | "Known for" bullets on the profile and "You can ask me" suggestions |
| `summary_kn` | Kannada profile text |

Write each `##` heading as the question people will ask ("What movies and films has he acted in?"), and keep each section self-contained by naming the person. When something isn't known yet, add a section saying so (e.g. "What books has he written?" → titles not yet added) so the assistant declines precisely instead of guessing.

### Testing the assistant

`evals/question-bank.json` lists the questions people are likely to ask, each with its expected behaviour. Run `npm run eval:ai` after editing knowledge files; add `-- --write` to refresh the readable report in [AI_QUESTION_BANK.md](AI_QUESTION_BANK.md). Add a case whenever you notice the assistant answering a real question badly.

Keep these in sync:

- The official programme is `knowledge/programme-2026.json`, read by both the website and the backend RAG.
- `sponsors.md` ↔ `src/data/sponsors.ts`.
- Kannada questions are also answered from the bilingual entries in `src/data/knowledgeBase.ts` — when you add an important FAQ, add its Kannada version there too.

The same `knowledge/` files feed the backend RAG (Supabase pgvector + Claude): after editing them, run `npm run rag:ingest`. The assistant's behaviour rules (tone, language, accuracy, never impersonating guests) are in `SYSTEM_PROMPT` in `backend/rag/generation/prompt.ts`. See [RAG.md](RAG.md) for the JSON format, metadata fields and setup.

## Community Love (reactions)

Edit `src/data/reactions.ts`:

- `MILESTONES` — the counter values that trigger the confetti celebration.
- `REACTION_CONFIG` — emoji and bilingual label per reaction type.
- `KANNADA_WORDS` — the words revealed one per tap in "Learn a Kannada word with every tap" (Kannada script, pronunciation, meaning). Add or reorder freely.

The shared counts live in Supabase (`reaction_counts` table). To reset them to zero, run the two statements at the bottom of [supabase/reactions.sql](../supabase/reactions.sql) in the Supabase SQL Editor.

## Live impact stats

`src/services/donations.ts` has a `BASE_STATS` mock. Once a real donations backend exists, set `VITE_API_URL` and remove/ignore `BASE_STATS` — see [ARCHITECTURE.md](ARCHITECTURE.md).
