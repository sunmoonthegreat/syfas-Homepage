-- 신영회계법인 홈페이지 ♥ 좋아요 저장소 (Supabase SQL Editor에 통째로 붙여넣고 Run)
create table if not exists public.post_likes (
  slug text primary key,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.post_likes enable row level security;

-- 누구나 숫자는 읽을 수 있고, 직접 수정은 못 합니다(아래 함수로만 +1/-1).
drop policy if exists "anyone can read likes" on public.post_likes;
create policy "anyone can read likes" on public.post_likes
  for select to anon, authenticated using (true);

create or replace function public.like_post(p_slug text, p_delta integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if p_slug !~ '^(art-story|inherit-newsletter)-[0-9]{1,3}$' then
    raise exception 'invalid slug';
  end if;
  if p_delta not in (1, -1) then
    raise exception 'invalid delta';
  end if;
  insert into public.post_likes (slug, count) values (p_slug, greatest(p_delta, 0))
  on conflict (slug) do update
    set count = greatest(public.post_likes.count + p_delta, 0), updated_at = now()
  returning count into n;
  return n;
end;
$$;

revoke all on function public.like_post(text, integer) from public;
grant execute on function public.like_post(text, integer) to anon, authenticated;
