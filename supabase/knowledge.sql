-- B7G AI knowledge base: Supabase PostgreSQL + pgvector.
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to re-run.
-- Filled by `npm run rag:ingest`; queried by the backend RAG service (backend/rag).
--
-- Embedding dimension: the column is a plain `vector`, so any embedding model
-- works (text-embedding-3-small = 1536, -large = 3072, …). Each row records
-- the model and dimension that produced it, a check constraint keeps them
-- consistent, and searches only compare vectors from the same model — so
-- switching models never mixes dimensions; re-run ingestion to re-embed.

create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),

  -- Stable identity of a chunk: "<document id>#<section>#<part>". Upsert key.
  chunk_key text not null unique,
  document_id text not null,
  chunk_index int not null default 0,

  title text not null,
  section text,
  content text not null,

  embedding extensions.vector,
  embedding_model text,
  embedding_dimensions int,

  category text,
  subcategory text,
  entity_type text,
  entity_name text,
  -- Names people may type for the entity (nicknames, misspellings, Kannada script).
  aliases text[] not null default '{}',

  source text,
  source_url text,
  event_date date,
  language text not null default 'en',
  metadata jsonb not null default '{}'::jsonb,

  -- Knowledge versioning: outdated chunks are deactivated, not deleted.
  version int not null default 1,
  is_active boolean not null default true,

  -- SHA-256 of the embedded text; unchanged content is never re-embedded.
  content_hash text not null,
  -- SHA-256 of the metadata; metadata-only edits update without re-embedding.
  metadata_hash text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint knowledge_embedding_dimensions_match
    check (embedding is null or extensions.vector_dims(embedding) = embedding_dimensions)
);

create index if not exists knowledge_documents_document_idx on public.knowledge_documents (document_id);
create index if not exists knowledge_documents_active_model_idx on public.knowledge_documents (is_active, embedding_model);
create index if not exists knowledge_documents_entity_idx on public.knowledge_documents (entity_name);
create index if not exists knowledge_documents_category_idx on public.knowledge_documents (category);
create index if not exists knowledge_documents_event_date_idx on public.knowledge_documents (event_date);

-- No approximate (ivfflat/hnsw) index on purpose: the event knowledge base is a
-- few hundred chunks, where an exact scan is fast and gives perfect recall.
-- If it grows past ~10,000 chunks, fix the column to the model's dimension
-- (e.g. extensions.vector(1536)) and add:
--   create index on public.knowledge_documents
--     using hnsw (embedding extensions.vector_cosine_ops);

-- Only the backend (service role) may read or write. No policies = no access
-- for the browser's publishable/anon key.
alter table public.knowledge_documents enable row level security;

-- Vector similarity search. Compares only rows embedded by the same model and
-- dimension as the query; optional filters support entity- and date-aware
-- retrieval.
create or replace function public.match_knowledge_documents(
  query_embedding extensions.vector,
  embedding_model_name text,
  match_threshold float default 0.3,
  match_count int default 8,
  filter_entity text default null,
  filter_category text default null,
  filter_event_date date default null
)
returns table (
  id uuid,
  chunk_key text,
  document_id text,
  title text,
  section text,
  content text,
  category text,
  subcategory text,
  entity_type text,
  entity_name text,
  event_date date,
  language text,
  metadata jsonb,
  similarity float
)
language sql
stable
set search_path = public, extensions
as $$
  with candidates as (
    select
      d.*,
      -- CASE guarantees vectors of different dimensions are never compared.
      case
        when vector_dims(d.embedding) = vector_dims(query_embedding)
          then 1 - (d.embedding <=> query_embedding)
      end as similarity
    from knowledge_documents d
    where d.is_active
      and d.embedding is not null
      and d.embedding_model = embedding_model_name
      and (filter_entity is null or d.entity_name = filter_entity)
      and (filter_category is null or d.category = filter_category)
      and (filter_event_date is null or d.event_date = filter_event_date)
  )
  select c.id, c.chunk_key, c.document_id, c.title, c.section, c.content,
         c.category, c.subcategory, c.entity_type, c.entity_name, c.event_date,
         c.language, c.metadata, c.similarity
  from candidates c
  where c.similarity >= match_threshold
  order by c.similarity desc
  limit match_count;
$$;

-- Keyword / alias search: the "hybrid" half of retrieval. Counts how many of
-- the search terms appear in a chunk (title, section, content, aliases).
-- English terms match whole words (plurals allowed); Kannada terms match as
-- word prefixes, since Kannada adds suffixes to words.
create or replace function public.search_knowledge_keywords(
  search_terms text[],
  match_count int default 8,
  filter_entity text default null
)
returns table (
  id uuid,
  chunk_key text,
  document_id text,
  title text,
  section text,
  content text,
  category text,
  subcategory text,
  entity_type text,
  entity_name text,
  event_date date,
  language text,
  metadata jsonb,
  keyword_hits int
)
language sql
stable
set search_path = public
as $$
  with docs as (
    select
      d.*,
      lower(d.title || ' ' || coalesce(d.section, '') || ' ' || d.content || ' ' || array_to_string(d.aliases, ' ')) as haystack
    from knowledge_documents d
    where d.is_active
      and (filter_entity is null or d.entity_name = filter_entity)
  ),
  scored as (
    select
      docs.*,
      (
        select count(*)::int
        from unnest(search_terms) as t(term)
        where case
          when t.term ~ '^[a-z0-9]+$' then docs.haystack ~ ('\m' || t.term || '(s|es)?\M')
          else position(lower(t.term) in docs.haystack) > 0
        end
      ) as keyword_hits
    from docs
  )
  select s.id, s.chunk_key, s.document_id, s.title, s.section, s.content,
         s.category, s.subcategory, s.entity_type, s.entity_name, s.event_date,
         s.language, s.metadata, s.keyword_hits
  from scored s
  where s.keyword_hits > 0
  order by s.keyword_hits desc, length(s.content) asc
  limit match_count;
$$;

-- Search functions are for the backend only.
revoke all on function public.match_knowledge_documents(extensions.vector, text, float, int, text, text, date) from public, anon, authenticated;
revoke all on function public.search_knowledge_keywords(text[], int, text) from public, anon, authenticated;
grant execute on function public.match_knowledge_documents(extensions.vector, text, float, int, text, text, date) to service_role;
grant execute on function public.search_knowledge_keywords(text[], int, text) to service_role;
