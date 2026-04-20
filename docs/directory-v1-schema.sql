-- Directory v1 schema for MemFire / Supabase-compatible PostgreSQL
-- This file is not auto-applied by the app. Run it manually in your SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  channel_type varchar(32) not null check (channel_type in ('vibe-tools', 'vibe-products')),
  name varchar(200) not null,
  slug varchar(200) not null unique,
  description text not null,
  full_description text,
  website_url varchar(255),
  logo_url varchar(255),
  preview_image_url varchar(255),
  category_id uuid not null references public.tool_categories(id),
  status varchar(20) not null default 'published' check (status in ('draft', 'pending', 'published')),
  published_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  user_id uuid references auth.users(id)
);

alter table public.tools
  drop constraint if exists tools_channel_type_check;

alter table public.tool_categories
  add column if not exists channel_type varchar(32);

alter table public.tool_categories
  drop constraint if exists tool_categories_channel_type_check;

update public.tool_categories
set channel_type = case
  when channel_type = 'vibe-products' then 'vibe-products'
  when channel_type = 'vibe-coding' then 'vibe-tools'
  else 'vibe-tools'
end
where channel_type is null
   or channel_type in ('ai-tools', 'vibe-coding');

alter table public.tool_categories
  alter column channel_type set not null;

alter table public.tool_categories
  add constraint tool_categories_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

alter table public.tool_submissions
  add column if not exists channel_type varchar(32);

alter table public.tool_submissions
  drop constraint if exists tool_submissions_channel_type_check;

update public.tool_submissions
set channel_type = case
  when channel_type = 'vibe-products' then 'vibe-products'
  when channel_type = 'vibe-coding' then 'vibe-tools'
  else 'vibe-tools'
end
where channel_type is null
   or channel_type in ('ai-tools', 'vibe-coding');

alter table public.tool_submissions
  alter column channel_type set not null;

alter table public.tool_submissions
  add constraint tool_submissions_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

alter table public.tool_submissions
  add column if not exists tool_id uuid references public.tools(id);

create table if not exists public.tool_views (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  viewed_at timestamp not null default now()
);

create index if not exists idx_tools_channel_type on public.tools(channel_type);
create index if not exists idx_tools_status on public.tools(status);
create index if not exists idx_tools_published_at on public.tools(published_at desc);
create index if not exists idx_tool_categories_channel_type on public.tool_categories(channel_type);
create index if not exists idx_tool_submissions_channel_type on public.tool_submissions(channel_type);
create index if not exists idx_tool_views_tool_id on public.tool_views(tool_id);
create index if not exists idx_tool_views_viewed_at on public.tool_views(viewed_at desc);

insert into public.tool_categories (name, icon, channel_type)
select seed.name, seed.icon, seed.channel_type
from (
  values
    ('灵感原型', '💡', 'vibe-tools'),
    ('页面生成', '🪄', 'vibe-tools'),
    ('全栈构建', '🧱', 'vibe-tools'),
    ('AI 编程环境', '⌘', 'vibe-tools'),
    ('Agent 编程', '🤖', 'vibe-tools'),
    ('数据后端', '🗄️', 'vibe-tools'),
    ('自动化流程', '🔄', 'vibe-tools'),
    ('部署发布', '🚀', 'vibe-tools'),
    ('SaaS 产品', '📦', 'vibe-products'),
    ('导航站', '🧭', 'vibe-products'),
    ('落地页', '🪧', 'vibe-products'),
    ('作品集', '🗂️', 'vibe-products'),
    ('AI Web 应用', '🌐', 'vibe-products'),
    ('内容工具', '✍️', 'vibe-products'),
    ('效率产品', '⚡', 'vibe-products'),
    ('社区平台', '👥', 'vibe-products')
) as seed(name, icon, channel_type)
where not exists (
  select 1
  from public.tool_categories tc
  where tc.name = seed.name
    and tc.channel_type = seed.channel_type
);

update public.tools
set channel_type = case
  when channel_type = 'vibe-products' then 'vibe-products'
  when channel_type = 'vibe-coding' then 'vibe-tools'
  else 'vibe-tools'
end
where channel_type in ('ai-tools', 'vibe-coding')
   or channel_type is null;

alter table public.tools
  alter column channel_type set not null;

alter table public.tools
  add constraint tools_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

do $$
begin
  if to_regclass('public.ai_tools') is not null then
    insert into public.tools (
      channel_type,
      name,
      slug,
      description,
      full_description,
      website_url,
      logo_url,
      preview_image_url,
      category_id,
      status,
      published_at,
      created_at,
      updated_at,
      user_id
    )
    select
      'vibe-tools' as channel_type,
      t.name,
      t.slug,
      t.description,
      t.full_description,
      t.website_url,
      t.logo_url,
      t.preview_image_url,
      (
        select tc.id
        from public.tool_categories tc
        where tc.channel_type = 'vibe-tools'
        order by tc.created_at asc
        limit 1
      ) as category_id,
      'published' as status,
      coalesce(t.created_at, now()) as published_at,
      coalesce(t.created_at, now()) as created_at,
      coalesce(t.updated_at, coalesce(t.created_at, now())) as updated_at,
      t.user_id
    from public.ai_tools t
    where not exists (
      select 1
      from public.tools nt
      where nt.slug = t.slug
    );
  end if;
end $$;
