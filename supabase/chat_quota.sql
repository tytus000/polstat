-- Run once in the Supabase SQL editor. Only the server secret key may call this function.
create table if not exists public.chat_quota (
  day date not null,
  visitor_hash text not null,
  used integer not null default 0,
  primary key (day, visitor_hash),
  constraint nonnegative_usage check (used >= 0)
);

alter table public.chat_quota enable row level security;
revoke all on public.chat_quota from anon, authenticated;

create or replace function public.consume_chat_quota(p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_day date := (now() at time zone 'utc')::date;
  visitor_used integer;
  global_used integer;
begin
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('allowed', false, 'reason', 'invalid');
  end if;
  perform pg_advisory_xact_lock(hashtext('polstat-chat-' || current_day::text));
  select used into visitor_used from public.chat_quota where day = current_day and visitor_hash = p_ip_hash;
  select used into global_used from public.chat_quota where day = current_day and visitor_hash = '__global__';
  if coalesce(visitor_used, 0) >= 10 then
    return jsonb_build_object('allowed', false, 'reason', 'visitor');
  end if;
  if coalesce(global_used, 0) >= 100 then
    return jsonb_build_object('allowed', false, 'reason', 'global');
  end if;
  insert into public.chat_quota(day, visitor_hash, used) values (current_day, p_ip_hash, 1)
  on conflict (day, visitor_hash) do update set used = public.chat_quota.used + 1;
  insert into public.chat_quota(day, visitor_hash, used) values (current_day, '__global__', 1)
  on conflict (day, visitor_hash) do update set used = public.chat_quota.used + 1;
  return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.consume_chat_quota(text) from public, anon, authenticated;
grant execute on function public.consume_chat_quota(text) to service_role;
