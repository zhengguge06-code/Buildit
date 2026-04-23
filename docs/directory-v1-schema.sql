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

alter table public.tool_categories
  add column if not exists channel_type varchar(32);

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
  drop constraint if exists tool_categories_channel_type_check;

alter table public.tool_categories
  add constraint tool_categories_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

alter table public.tool_submissions
  add column if not exists channel_type varchar(32);

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
  drop constraint if exists tool_submissions_channel_type_check;

alter table public.tool_submissions
  add constraint tool_submissions_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

alter table public.tool_submissions
  add column if not exists tool_id uuid references public.tools(id);

alter table public.tools
  add column if not exists reference_badges text[] not null default '{}';

alter table public.tools
  add column if not exists capability_badges text[] not null default '{}';

alter table public.tools
  add column if not exists platform_badges text[] not null default '{}';

alter table public.tool_submissions
  add column if not exists reference_badges text[] not null default '{}';

alter table public.tool_submissions
  add column if not exists capability_badges text[] not null default '{}';

alter table public.tool_submissions
  add column if not exists platform_badges text[] not null default '{}';

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
create index if not exists idx_tools_reference_badges on public.tools using gin (reference_badges);
create index if not exists idx_tools_capability_badges on public.tools using gin (capability_badges);
create index if not exists idx_tools_platform_badges on public.tools using gin (platform_badges);

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
    ('效率协作', '🧩', 'vibe-products'),
    ('内容创作', '✍️', 'vibe-products'),
    ('多媒体', '🎬', 'vibe-products'),
    ('学习教育', '📚', 'vibe-products'),
    ('营销增长', '📣', 'vibe-products'),
    ('商业金融', '💼', 'vibe-products'),
    ('健康生活', '🌿', 'vibe-products')
) as seed(name, icon, channel_type)
where not exists (
  select 1
  from public.tool_categories tc
  where tc.name = seed.name
    and tc.channel_type = seed.channel_type
);

update public.tool_categories as tc
set icon = seed.icon
from (
  values
    ('效率协作', '🧩', 'vibe-products'),
    ('内容创作', '✍️', 'vibe-products'),
    ('多媒体', '🎬', 'vibe-products'),
    ('学习教育', '📚', 'vibe-products'),
    ('营销增长', '📣', 'vibe-products'),
    ('商业金融', '💼', 'vibe-products'),
    ('健康生活', '🌿', 'vibe-products')
) as seed(name, icon, channel_type)
where tc.name = seed.name
  and tc.channel_type = seed.channel_type;

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
  drop constraint if exists tools_channel_type_check;

alter table public.tools
  add constraint tools_channel_type_check
  check (channel_type in ('vibe-tools', 'vibe-products'));

with vibe_product_mapping(slug, category_name, reference_badges, capability_badges, platform_badges) as (
  values
    ('linear', '效率协作', array['首页设计','信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('raycast', '效率协作', array['首页设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('notion', '效率协作', array['首页设计','信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('granola', '效率协作', array['首页设计','Onboarding','品牌表达']::text[], array['AI Native']::text[], array['桌面端']::text[]),
    ('arc', '效率协作', array['首页设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('perplexity', '效率协作', array['Onboarding','结果页']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('claude', '效率协作', array['Onboarding','结果页']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('chatgpt', '效率协作', array['Onboarding','结果页','信息架构']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('cal-com', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('airtable', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('tally', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('coda', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('savvycal', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('tana', '效率协作', array['信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('readwise-reader', '效率协作', array['信息架构','结果页']::text[], array[]::text[], array['Web']::text[]),
    ('attio', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('superhuman', '效率协作', array['首页设计','定价设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('discord', '效率协作', array['增长机制']::text[], array['社区']::text[], array['Web','移动端','桌面端']::text[]),
    ('obsidian', '效率协作', array['品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('typefully', '内容创作', array['增长机制','信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('substack', '内容创作', array['增长机制','信息架构']::text[], array['社区']::text[], array['Web']::text[]),
    ('kit', '内容创作', array['增长机制','信息架构','定价设计']::text[], array[]::text[], array['Web']::text[]),
    ('gumroad', '内容创作', array['Onboarding','增长机制']::text[], array[]::text[], array['Web']::text[]),
    ('beehiiv', '内容创作', array['增长机制','信息架构','定价设计']::text[], array[]::text[], array['Web']::text[]),
    ('canva', '内容创作', array['信息架构','增长机制']::text[], array['多媒体','协作']::text[], array['Web']::text[]),
    ('descript', '多媒体', array['首页设计','定价设计','结果页']::text[], array['多媒体','AI Native']::text[], array['桌面端']::text[]),
    ('riverside', '多媒体', array['首页设计','定价设计']::text[], array['多媒体']::text[], array['Web']::text[]),
    ('runwayml', '多媒体', array['首页设计','品牌表达']::text[], array['多媒体','AI Native']::text[], array['Web']::text[]),
    ('elevenlabs', '多媒体', array['首页设计','品牌表达']::text[], array['多媒体','AI Native']::text[], array['Web']::text[]),
    ('dub', '营销增长', array['增长机制','信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('mercury', '商业金融', array['首页设计','Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('midday', '商业金融', array['首页设计','品牌表达']::text[], array[]::text[], array['Web']::text[]),
    ('oura', '健康生活', array['首页设计','品牌表达']::text[], array[]::text[], array['移动端']::text[])
)
update public.tools as t
set
  category_id = tc.id,
  reference_badges = mapping.reference_badges,
  capability_badges = mapping.capability_badges,
  platform_badges = mapping.platform_badges
from vibe_product_mapping as mapping
join public.tool_categories as tc
  on tc.channel_type = 'vibe-products'
 and tc.name = mapping.category_name
where t.channel_type = 'vibe-products'
  and t.slug = mapping.slug;

with vibe_product_mapping(slug, category_name, reference_badges, capability_badges, platform_badges) as (
  values
    ('linear', '效率协作', array['首页设计','信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('raycast', '效率协作', array['首页设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('notion', '效率协作', array['首页设计','信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('granola', '效率协作', array['首页设计','Onboarding','品牌表达']::text[], array['AI Native']::text[], array['桌面端']::text[]),
    ('arc', '效率协作', array['首页设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('perplexity', '效率协作', array['Onboarding','结果页']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('claude', '效率协作', array['Onboarding','结果页']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('chatgpt', '效率协作', array['Onboarding','结果页','信息架构']::text[], array['AI Native']::text[], array['Web']::text[]),
    ('cal-com', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('airtable', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('tally', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('coda', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('savvycal', '效率协作', array['Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('tana', '效率协作', array['信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('readwise-reader', '效率协作', array['信息架构','结果页']::text[], array[]::text[], array['Web']::text[]),
    ('attio', '效率协作', array['信息架构']::text[], array['协作']::text[], array['Web']::text[]),
    ('superhuman', '效率协作', array['首页设计','定价设计','品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('discord', '效率协作', array['增长机制']::text[], array['社区']::text[], array['Web','移动端','桌面端']::text[]),
    ('obsidian', '效率协作', array['品牌表达']::text[], array[]::text[], array['桌面端']::text[]),
    ('typefully', '内容创作', array['增长机制','信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('substack', '内容创作', array['增长机制','信息架构']::text[], array['社区']::text[], array['Web']::text[]),
    ('kit', '内容创作', array['增长机制','信息架构','定价设计']::text[], array[]::text[], array['Web']::text[]),
    ('gumroad', '内容创作', array['Onboarding','增长机制']::text[], array[]::text[], array['Web']::text[]),
    ('beehiiv', '内容创作', array['增长机制','信息架构','定价设计']::text[], array[]::text[], array['Web']::text[]),
    ('canva', '内容创作', array['信息架构','增长机制']::text[], array['多媒体','协作']::text[], array['Web']::text[]),
    ('descript', '多媒体', array['首页设计','定价设计','结果页']::text[], array['多媒体','AI Native']::text[], array['桌面端']::text[]),
    ('riverside', '多媒体', array['首页设计','定价设计']::text[], array['多媒体']::text[], array['Web']::text[]),
    ('runwayml', '多媒体', array['首页设计','品牌表达']::text[], array['多媒体','AI Native']::text[], array['Web']::text[]),
    ('elevenlabs', '多媒体', array['首页设计','品牌表达']::text[], array['多媒体','AI Native']::text[], array['Web']::text[]),
    ('dub', '营销增长', array['增长机制','信息架构']::text[], array[]::text[], array['Web']::text[]),
    ('mercury', '商业金融', array['首页设计','Onboarding']::text[], array[]::text[], array['Web']::text[]),
    ('midday', '商业金融', array['首页设计','品牌表达']::text[], array[]::text[], array['Web']::text[]),
    ('oura', '健康生活', array['首页设计','品牌表达']::text[], array[]::text[], array['移动端']::text[])
)
update public.tool_submissions as ts
set
  category_id = tc.id,
  reference_badges = mapping.reference_badges,
  capability_badges = mapping.capability_badges,
  platform_badges = mapping.platform_badges
from vibe_product_mapping as mapping
join public.tool_categories as tc
  on tc.channel_type = 'vibe-products'
 and tc.name = mapping.category_name
where ts.channel_type = 'vibe-products'
  and ts.slug = mapping.slug;

update public.tools as t
set
  category_id = (
    select tc.id
    from public.tool_categories tc
    where tc.channel_type = 'vibe-products'
      and tc.name = '效率协作'
    limit 1
  ),
  reference_badges = coalesce(t.reference_badges, array[]::text[]),
  capability_badges = coalesce(t.capability_badges, array[]::text[]),
  platform_badges = coalesce(t.platform_badges, array[]::text[])
where t.channel_type = 'vibe-products'
  and exists (
    select 1
    from public.tool_categories old_tc
    where old_tc.id = t.category_id
      and old_tc.channel_type = 'vibe-products'
      and old_tc.name not in ('效率协作', '内容创作', '多媒体', '学习教育', '营销增长', '商业金融', '健康生活')
  );

update public.tool_submissions as ts
set
  category_id = (
    select tc.id
    from public.tool_categories tc
    where tc.channel_type = 'vibe-products'
      and tc.name = '效率协作'
    limit 1
  ),
  reference_badges = coalesce(ts.reference_badges, array[]::text[]),
  capability_badges = coalesce(ts.capability_badges, array[]::text[]),
  platform_badges = coalesce(ts.platform_badges, array[]::text[])
where ts.channel_type = 'vibe-products'
  and exists (
    select 1
    from public.tool_categories old_tc
    where old_tc.id = ts.category_id
      and old_tc.channel_type = 'vibe-products'
      and old_tc.name not in ('效率协作', '内容创作', '多媒体', '学习教育', '营销增长', '商业金融', '健康生活')
  );

delete from public.tool_categories
where channel_type = 'vibe-products'
  and name not in ('效率协作', '内容创作', '多媒体', '学习教育', '营销增长', '商业金融', '健康生活');

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
      user_id,
      reference_badges,
      capability_badges,
      platform_badges
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
      t.user_id,
      array[]::text[],
      array[]::text[],
      array[]::text[]
    from public.ai_tools t
    where not exists (
      select 1
      from public.tools nt
      where nt.slug = t.slug
    );
  end if;
end $$;
