-- 신영회계법인 홈페이지 ♥ 좋아요 · 조회수 저장소 (Supabase SQL Editor에 통째로 붙여넣고 Run)
create table if not exists public.post_stats (
  slug text primary key,
  likes integer not null default 0 check (likes >= 0),
  views integer not null default 0 check (views >= 0),
  updated_at timestamptz not null default now()
);

alter table public.post_stats enable row level security;

-- 새 표 자동 공개를 꺼 두었어도 읽기는 되도록 직접 허용합니다(쓰기 권한은 주지 않음).
grant usage on schema public to anon, authenticated;
grant select on public.post_stats to anon, authenticated;

-- 누구나 숫자는 읽을 수 있고, 직접 수정은 못 합니다(아래 함수로만 +1/-1).
drop policy if exists "anyone can read stats" on public.post_stats;
create policy "anyone can read stats" on public.post_stats
  for select to anon, authenticated using (true);

-- 좋아요 +1 / -1 (취소)
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
  insert into public.post_stats (slug, likes) values (p_slug, greatest(p_delta, 0))
  on conflict (slug) do update
    set likes = greatest(public.post_stats.likes + p_delta, 0), updated_at = now()
  returning likes into n;
  return n;
end;
$$;

-- 조회수 +1, 현재 조회수 · 좋아요 수를 함께 돌려줍니다
create or replace function public.view_post(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r public.post_stats;
begin
  if p_slug !~ '^(art-story|inherit-newsletter)-[0-9]{1,3}$' then
    raise exception 'invalid slug';
  end if;
  insert into public.post_stats (slug, views) values (p_slug, 1)
  on conflict (slug) do update
    set views = public.post_stats.views + 1, updated_at = now()
  returning * into r;
  return json_build_object('views', r.views, 'likes', r.likes);
end;
$$;

revoke all on function public.like_post(text, integer) from public;
revoke all on function public.view_post(text) from public;
grant execute on function public.like_post(text, integer) to anon, authenticated;
grant execute on function public.view_post(text) to anon, authenticated;
