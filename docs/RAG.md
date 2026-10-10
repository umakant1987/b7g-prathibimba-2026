# AI knowledge base (RAG)

The chat assistant answers from the B7G knowledge base using retrieval-augmented generation: knowledge files are split into chunks, embedded, and stored in **Supabase PostgreSQL + pgvector**; each question retrieves the most relevant chunks and **Claude** answers from them alone.

```text
knowledge/*.json, knowledge/**/*.md
   → load + validate        backend/rag/knowledge/
   → chunk (by section)     backend/rag/ingestion/chunkDocuments.ts
   → hash (skip unchanged)  backend/rag/ingestion/hash.ts
   → embed                  backend/rag/embeddings/
   → upsert                 backend/rag/store/supabaseVectorStore.ts → knowledge_documents

question (+ recent conversation)
   → rewrite follow-ups     backend/rag/retrieval/queryRewriter.ts   "when is he coming?" → "when is Nagabhushana NS coming?"
   → analyse                backend/rag/retrieval/queryAnalysis.ts   language, entities, dates, categories
   → hybrid retrieval       backend/rag/retrieval/hybridRetriever.ts vector + keyword/alias + entity/date/category ranking
   → labelled context       backend/rag/generation/contextBuilder.ts
   → grounded answer        backend/rag/generation/llm.ts            Claude, ONLY from the context
```

The browser only talks to `POST /api/rag/query`; every key stays on the server.

## Setup

1. **Database** — in Supabase, open **SQL Editor → New query**, paste [supabase/knowledge.sql](../supabase/knowledge.sql), click **Run**. It creates the `knowledge_documents` table (pgvector), the search functions and access rules. Safe to re-run.
2. **Keys** — add these to `.env` yourself (never commit them, never paste them in chat):
   ```env
   SUPABASE_SERVICE_ROLE_KEY=...   # Supabase → Project Settings → API Keys → secret / service_role
   OPENAI_API_KEY=...              # embeddings
   ANTHROPIC_API_KEY=...           # answers (Claude)
   ```
3. **Ingest** — `npm run rag:ingest`. Re-run whenever knowledge changes; unchanged chunks are skipped.
4. **Run the API** — `npm run rag:server` (port 8787).
5. **Connect the chat** — set `VITE_RAG_API_URL=/api/rag/query` in `.env` and restart `npm run dev` (or rebuild for `npm run preview`). Vite proxies `/api` to the API server.
6. **Check** — `npm run rag:eval` runs the 8 acceptance questions against the live stack and prints each answer with its sources.

Without `VITE_RAG_API_URL`, or if the API is unreachable, the chat falls back to the offline assistant (keyword search over the same `knowledge/` files), so the site never breaks.

## Environment variables

Server-side only (no `VITE_` prefix, never bundled into the site):

| Variable | Default | Purpose |
|---|---|---|
| `SUPABASE_URL` | `VITE_SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **Secret.** Lets the backend read/write `knowledge_documents` |
| `EMBEDDING_PROVIDER` | `openai` | `openai`, or `local` (offline, lexical only — tests/dev, not production) |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Any OpenAI embedding model |
| `EMBEDDING_DIMENSIONS` | from the model (1536) | Override for custom dimensions (text-embedding-3 supports shortening) |
| `OPENAI_API_KEY` | — | **Secret.** Needed when `EMBEDDING_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | — | **Secret.** Claude, for answers and follow-up rewriting |
| `RAG_LLM_MODEL` | `claude-opus-5-5` | Claude model |
| `RAG_LLM_EFFORT` | `medium` | `low` … `max` — answer depth vs cost/latency |
| `RAG_TOP_K` | `8` | Candidates fetched per search |
| `RAG_CONTEXT_CHUNKS` | `5` | Chunks sent to Claude |
| `RAG_SIMILARITY_THRESHOLD` | `0.3` | Minimum cosine similarity (see tuning below) |
| `RAG_KEYWORD_MIN_COVERAGE` | `0.5` | Share of question terms a chunk must contain to qualify on keywords alone |
| `RAG_MAX_CHUNKS_PER_DOCUMENT` | `3` | Keeps one long document from crowding out others |
| `RAG_CHUNK_MAX_TOKENS` / `RAG_CHUNK_OVERLAP_TOKENS` | `600` / `80` | Splitting of long sections |
| `RAG_KNOWLEDGE_DIR` | `knowledge` | Where ingestion reads files |
| `RAG_PORT` | `8787` | API port |
| `RAG_CORS_ORIGINS` | localhost:5173, 4173 | Allowed browser origins when not using the proxy |
| `RAG_RATE_LIMIT_PER_MINUTE` | `20` | Questions per visitor per minute (protects AI spend) |
| `RAG_TRUST_PROXY` | `true` | Read the visitor IP from `X-Forwarded-For` (set `false` if the API is exposed directly) |
| `RAG_DEBUG` | `false` | Log each question's rewrite, entities, dates, retrieved chunks and scores |

Browser:

| Variable | Purpose |
|---|---|
| `VITE_RAG_API_URL` | e.g. `/api/rag/query`. Empty = offline assistant only |

## Adding knowledge

Add or edit a file in `knowledge/`, then run `npm run rag:ingest`. No code changes.

- **JSON** (canonical): `{ "documents": [ { "title", "category", "content" | "sections", … } ] }` — see [knowledge/_schema/knowledge-document.schema.json](../knowledge/_schema/knowledge-document.schema.json) and the example in [knowledge/_examples/](../knowledge/_examples/).
- **Markdown** with frontmatter (`title`, `category`, `entity_name`, `event_date`, `aliases`, …); each `## Heading` becomes a section.
- Files/folders starting with `_` are ignored (schemas, examples, drafts).

What makes retrieval work well:

- **`entity_name` + `aliases`** for people, groups and places — include nicknames, misspellings and Kannada script (`ಪ್ರಕಾಶ್ ಬೆಳವಾಡಿ`). Questions naming any alias are routed to that entity.
- **`event_date` (YYYY-MM-DD)** on anything tied to a day — "Who is the guest on October 31?" prefers that date and demotes other days' guests.
- **`category`** — free-form; `chief_guest` vs `guest` is what keeps Chief Guests and other guests apart.
- **Headings phrased as questions** ("What awards has he received?") and **self-contained sections** — each chunk is embedded with a header naming its entity and date, but the text itself should still make sense alone.
- **Retire, don't delete**: set `"is_active": false` (or remove the section) — ingestion deactivates chunks that disappear, so outdated schedules stop being retrievable but stay in the table for history. Bump `version` and `updated_at` when information changes.
- `metadata.status: "provisional"` makes the assistant say information is subject to confirmation.

Ingestion skips chunks whose SHA-256 content hash and embedding model are unchanged (no embedding calls), updates metadata-only changes without re-embedding, and reports invalid files without stopping the rest.

## Cultural programme

The official programme is [knowledge/programme-2026.json](../knowledge/programme-2026.json): one overview record, one record per day/session (31 October evening; 1 November morning, afternoon, evening) listing items in running order, and one record per programme item with `event_date`, `session`, `sequence`, `performer`, `performance_type`, `aliases` and its before/after neighbours. Names are exactly as supplied by the organisers. No timings, durations or venues are included because none have been published — the assistant says so and gives the day, session and position instead.

How programme questions are understood:

- **Days** — "October 31", "31st October", "Nov 1", "on the 31st", "ಅಕ್ಟೋಬರ್ 31". A bare "31st" resolves to the only event date with that day.
- **Sessions** — morning / afternoon / evening (also ಬೆಳಿಗ್ಗೆ / ಮಧ್ಯಾಹ್ನ / ಸಂಜೆ). Items from the asked session rank higher; other sessions' items are demoted.
- **Broad questions** ("What's happening on 1 November?") rank the day/session schedules first, so answers list the whole running order by session; specific ones ("Who is performing violin?") rank the single item first.
- **Follow-ups** — "What's happening in the evening?" after discussing 31 October means 31 October; "What about November 1?" switches day. With no day in the conversation, an ambiguous session gets a short clarifying question instead of a guess, and replying "1 November" keeps the session.
- "Mr. Dharmi" and "Mr. Belawadi" in the programme are linked to the Chief Guests' profiles.

To change the programme (new item, reordering, timings once published), edit `programme-2026.json` — or regenerate it — and run `npm run rag:ingest`. Changed records are re-embedded; removed ones are deactivated.

The website's Programme section reads the same file (`src/data/programs.ts` loads it at build time), so the page and the assistant always agree. When timings are announced, add `start_time` / `end_time` (HH:mm) to the performance records: the page then shows them and the LIVE NOW / UP NEXT badges and "what's on now?" answers switch on automatically.

## Releasing the detailed programme

Until the organisers release it, the detailed programme is switched off with `VITE_SHOW_PROGRAMME_DETAILS=false` in `.env` (one setting for both the website and the AI):

- **Website:** the Programmes section shows the four posters (`public/posters/`) instead of the running order.
- **AI assistant:** the programme records (category `programme`) are excluded from search, so it shares only the poster highlights (`knowledge/programme-highlights.json`) and says the detailed programme is coming (`knowledge/programme-coming-soon.md`). Schedule suggestions are hidden.

**To release it:** set `VITE_SHOW_PROGRAMME_DETAILS=true`, run `npm run build`, and restart `npm run rag:server`. The running order, performer answers and schedule suggestions return exactly as before, and the "coming soon" note is hidden. No re-ingestion needed.

## Tuning

Run with `RAG_DEBUG=true` to see, per question, each retrieved chunk's score, similarity, keyword coverage and boosts (`entity`, `date`, `other-date`, `category`, `profile`).

- **Similarity threshold** — OpenAI `text-embedding-3` models typically score relevant passages ~0.3–0.6, so the commonly quoted 0.70 would reject almost everything. Start at 0.3; raise it if unrelated chunks pass, lower it if relevant ones are missed.
- **Ranking weights** are at the top of `hybridRetriever.ts`.
- **Vector index** — none on purpose: a few hundred chunks are searched exactly (fast, perfect recall). Past ~10,000 chunks, fix the column dimension and add an HNSW index (see the comment in `supabase/knowledge.sql`).
- **Switching embedding models** — just change `EMBEDDING_MODEL` and re-run ingestion. Each row records its model and dimension; searches only compare like with like, so mixed dimensions never collide.

## Tests

- `npm run rag:test` — offline, no keys: the real pipeline against an in-memory store with the 8 acceptance questions, follow-up rewriting, Kannada/mixed-language questions, date parsing, ingestion (unchanged skip, re-embed on edit, deactivation, new JSON file answerable without code changes, invalid files) and failure handling.
- `npm run rag:eval` — live (costs a little): the 8 questions against Supabase + OpenAI + Claude.

## Security

- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` are read only by `backend/`; they have no `VITE_` prefix, so Vite never bundles them.
- `knowledge_documents` has row-level security with no policies, and the search functions are granted only to `service_role` — the browser's publishable key can't read or search it.
- The API returns answers and source titles only — never chunk text, embeddings or database details — validates input size, and rate-limits each visitor.

## Claude settings

Answers use `claude-opus-5-5` through the official Anthropic SDK with **refusal fallbacks enabled** (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`): if a safety classifier declines a question, the API re-runs it on Anthropic's recommended fallback model instead of failing. The system prompt is byte-stable and marked for prompt caching.
