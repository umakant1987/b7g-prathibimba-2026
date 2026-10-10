-- Shared "Show Your Love" reaction counters.
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- The site reads/writes these through src/services/reactions.ts.

-- One shared counter per reaction type, starting at zero
create table public.reaction_counts (
  reaction_type text primary key
    check (reaction_type in ('love', 'proud', 'support', 'respect', 'celebrate')),
  count bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.reaction_counts (reaction_type)
values ('love'), ('proud'), ('support'), ('respect'), ('celebrate');

-- Log of taps, used only for rate limiting (no personal data, just an anonymous browser id)
create table public.reaction_events (
  id bigint generated always as identity primary key,
  reaction_type text not null references public.reaction_counts (reaction_type),
  session_id text not null,
  created_at timestamptz not null default now()
);
create index reaction_events_session_idx on public.reaction_events (session_id, created_at);

-- Visitors can read the counts; nobody can write directly
alter table public.reaction_counts enable row level security;
alter table public.reaction_events enable row level security;
create policy "Anyone can read counts" on public.reaction_counts for select using (true);

-- The only way to add a tap: validates input and rate-limits each browser
create or replace function public.add_reaction(p_type text, p_session text)
returns setof public.reaction_counts
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_session is null or length(p_session) > 64 then
    raise exception 'invalid session';
  end if;
  if (select count(*) from reaction_events
      where session_id = p_session and created_at > now() - interval '10 seconds') >= 20 then
    raise exception 'slow down';
  end if;
  insert into reaction_events (reaction_type, session_id) values (p_type, p_session);
  update reaction_counts set count = count + 1, updated_at = now() where reaction_type = p_type;
  return query select * from reaction_counts;
end;
$$;
revoke all on function public.add_reaction(text, text) from public;
grant execute on function public.add_reaction(text, text) to anon, authenticated;

-- Push count changes to everyone with the page open
alter publication supabase_realtime add table public.reaction_counts;

-- To reset all counters to zero later:
--   update public.reaction_counts set count = 0, updated_at = now();
--   truncate public.reaction_events;
