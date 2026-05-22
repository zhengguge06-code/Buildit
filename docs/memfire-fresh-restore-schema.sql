-- Fresh MemFire/Supabase restore schema for ai-tools-directory.
-- Run this once in the MemFire SQL editor before running the local import scripts.

create extension if not exists "pgcrypto";

create table if not exists public.tool_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  icon text not null default '',
  channel_type varchar(32) not null check (channel_type in ('vibe-tools', 'vibe-products')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tool_categories_channel_name
  on public.tool_categories(channel_type, name);

create table if not exists public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  slug varchar(200) not null unique,
  description text not null,
  full_description text,
  website_url varchar(255),
  logo_url varchar(255),
  preview_image_url varchar(255),
  category_id uuid not null references public.tool_categories(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  is_approved boolean not null default true
);

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
  sort_score integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  reference_badges text[] not null default '{}',
  capability_badges text[] not null default '{}',
  platform_badges text[] not null default '{}'
);

create table if not exists public.tool_submissions (
  id uuid primary key default gen_random_uuid(),
  channel_type varchar(32) not null default 'vibe-tools' check (channel_type in ('vibe-tools', 'vibe-products')),
  name varchar(200) not null,
  slug varchar(200),
  description text not null,
  full_description text,
  website_url varchar(255) not null,
  logo_url varchar(255),
  preview_image_url varchar(255),
  category_id uuid not null references public.tool_categories(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status varchar(20) not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  tool_id uuid references public.tools(id),
  ai_tool_id uuid references public.ai_tools(id),
  reference_badges text[] not null default '{}',
  capability_badges text[] not null default '{}',
  platform_badges text[] not null default '{}'
);

create table if not exists public.tool_views (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_ai_tools_category_id on public.ai_tools(category_id);
create index if not exists idx_ai_tools_user_id on public.ai_tools(user_id);
create index if not exists idx_tools_channel_type on public.tools(channel_type);
create index if not exists idx_tools_status on public.tools(status);
create index if not exists idx_tools_published_at on public.tools(published_at desc);
create index if not exists idx_tools_category_id on public.tools(category_id);
create index if not exists idx_tools_reference_badges on public.tools using gin (reference_badges);
create index if not exists idx_tools_capability_badges on public.tools using gin (capability_badges);
create index if not exists idx_tools_platform_badges on public.tools using gin (platform_badges);
create index if not exists idx_tool_submissions_category_id on public.tool_submissions(category_id);
create index if not exists idx_tool_submissions_user_id on public.tool_submissions(user_id);
create index if not exists idx_tool_submissions_status on public.tool_submissions(status);
create index if not exists idx_tool_submissions_created_at on public.tool_submissions(created_at);
create index if not exists idx_tool_submissions_channel_type on public.tool_submissions(channel_type);
create index if not exists idx_tool_views_tool_id on public.tool_views(tool_id);
create index if not exists idx_tool_views_viewed_at on public.tool_views(viewed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tool_categories_updated_at on public.tool_categories;
create trigger trg_tool_categories_updated_at
before update on public.tool_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_tools_updated_at on public.ai_tools;
create trigger trg_ai_tools_updated_at
before update on public.ai_tools
for each row execute function public.set_updated_at();

drop trigger if exists trg_tools_updated_at on public.tools;
create trigger trg_tools_updated_at
before update on public.tools
for each row execute function public.set_updated_at();

drop trigger if exists trg_tool_submissions_updated_at on public.tool_submissions;
create trigger trg_tool_submissions_updated_at
before update on public.tool_submissions
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values
  ('category-icons', 'category-icons', true),
  ('tool-logos', 'tool-logos', true),
  ('tool-previews', 'tool-previews', true)
on conflict (id) do nothing;

insert into public.tool_categories (name, icon, channel_type)
values
  ('设计与原型', '💡', 'vibe-tools'),
  ('界面生成', '🪄', 'vibe-tools'),
  ('AI 编程环境', '⌘', 'vibe-tools'),
  ('Agent 编程', '🤖', 'vibe-tools'),
  ('全栈应用构建', '🧱', 'vibe-tools'),
  ('数据后端', '🗄️', 'vibe-tools'),
  ('自动化流程', '🔄', 'vibe-tools'),
  ('部署发布', '🚀', 'vibe-tools'),
  ('效率协作', '🧩', 'vibe-products'),
  ('内容创作', '✍️', 'vibe-products'),
  ('多媒体', '🎬', 'vibe-products'),
  ('学习教育', '📚', 'vibe-products'),
  ('营销增长', '📣', 'vibe-products'),
  ('商业金融', '💼', 'vibe-products'),
  ('健康生活', '🌿', 'vibe-products')
on conflict (channel_type, name)
do update set icon = excluded.icon;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.tool_categories to anon, authenticated;
grant select on public.tools to anon, authenticated;
grant select on public.ai_tools to anon, authenticated;
grant insert on public.tool_views to anon, authenticated;
grant select, insert, update on public.tool_submissions to authenticated;
grant all privileges on public.tool_categories to service_role;
grant all privileges on public.tools to service_role;
grant all privileges on public.ai_tools to service_role;
grant all privileges on public.tool_submissions to service_role;
grant all privileges on public.tool_views to service_role;

alter table public.tool_categories enable row level security;
alter table public.tools enable row level security;
alter table public.ai_tools enable row level security;
alter table public.tool_submissions enable row level security;
alter table public.tool_views enable row level security;

drop policy if exists "Public can read categories" on public.tool_categories;
create policy "Public can read categories"
on public.tool_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read published tools" on public.tools;
create policy "Public can read published tools"
on public.tools
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can read approved legacy tools" on public.ai_tools;
create policy "Public can read approved legacy tools"
on public.ai_tools
for select
to anon, authenticated
using (is_approved = true);

drop policy if exists "Authenticated users can create own submissions" on public.tool_submissions;
create policy "Authenticated users can create own submissions"
on public.tool_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read own submissions" on public.tool_submissions;
create policy "Authenticated users can read own submissions"
on public.tool_submissions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Authenticated users can update own pending submissions" on public.tool_submissions;
create policy "Authenticated users can update own pending submissions"
on public.tool_submissions
for update
to authenticated
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id);

drop policy if exists "Anyone can create tool views" on public.tool_views;
create policy "Anyone can create tool views"
on public.tool_views
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read tool assets" on storage.objects;
create policy "Public can read tool assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('category-icons', 'tool-logos', 'tool-previews'));

drop policy if exists "Authenticated users can upload submission assets" on storage.objects;
create policy "Authenticated users can upload submission assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('tool-logos', 'tool-previews')
  and name like 'submissions/%'
);
