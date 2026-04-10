# AI Tools Directory 数据库设计文档

## 1. 概述

结合当前项目页面和上传场景，数据库只保留 3 张核心表：

1. `tool_categories`：首页左侧分类
2. `ai_tools`：正式展示的 AI 工具
3. `tool_submissions`：用户提交记录

这次在最小结构基础上，已经补齐和当前上传逻辑一致的图片字段：

- 工具 logo
- 工具预览图

---

## 2. 表关系

关系如下：

- `ai_tools.category_id` -> `tool_categories.id`
- `tool_submissions.category_id` -> `tool_categories.id`
- `ai_tools.user_id` -> `auth.users.id`
- `tool_submissions.user_id` -> `auth.users.id`
- `tool_submissions.ai_tool_id` -> `ai_tools.id`

数据流转如下：

1. 用户提交工具，写入 `tool_submissions`
2. 管理员审核
3. 审核通过后，将数据写入 `ai_tools`
4. 回填 `tool_submissions.ai_tool_id`

---

## 3. 表结构设计

### 3.1 分类表 `tool_categories`

参考当前项目 [category-sidebar.tsx](C:/Users/admin/ai-coding/ai-tools-directory/components/category-sidebar.tsx)，分类只需要：

- 名称
- icon

字段设计如下：

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 分类唯一标识符 |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| icon | VARCHAR(255) | NOT NULL | 分类 icon 图片 URL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

索引：

- PRIMARY KEY (`id`)

---

### 3.2 工具表 `ai_tools`

字段设计如下：

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 工具唯一标识符 |
| name | VARCHAR(200) | NOT NULL | 工具名称 |
| slug | VARCHAR(200) | NOT NULL, UNIQUE | 工具 URL 友好标识 |
| description | TEXT | NOT NULL | 工具简短描述 |
| full_description | TEXT | | 工具详细描述 |
| website_url | VARCHAR(255) | | 工具官网 URL |
| logo_url | VARCHAR(255) | | 工具 logo 图片 URL |
| preview_image_url | VARCHAR(255) | | 工具预览图 URL |
| category_id | UUID | NOT NULL, REFERENCES tool_categories(id) | 所属分类 ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |
| user_id | UUID | REFERENCES auth.users(id) | 提交者 ID（如果适用） |
| is_approved | BOOLEAN | NOT NULL, DEFAULT true | 是否已审核通过 |

索引：

- PRIMARY KEY (`id`)
- UNIQUE (`slug`)
- INDEX (`category_id`)
- INDEX (`user_id`)

---

### 3.3 提交记录表 `tool_submissions`

字段设计如下：

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 提交记录唯一标识符 |
| name | VARCHAR(200) | NOT NULL | 工具名称 |
| description | TEXT | NOT NULL | 工具简短描述 |
| full_description | TEXT | | 工具详细描述 |
| website_url | VARCHAR(255) | NOT NULL | 工具官网 URL |
| logo_url | VARCHAR(255) | | 工具 logo 图片 URL |
| preview_image_url | VARCHAR(255) | | 工具预览图 URL |
| category_id | UUID | NOT NULL, REFERENCES tool_categories(id) | 所属分类 ID |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) | 提交者 ID |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 状态（pending、approved、rejected） |
| admin_comments | TEXT | | 管理员审核意见 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |
| processed_at | TIMESTAMP | | 处理时间 |
| ai_tool_id | UUID | REFERENCES ai_tools(id) | 关联的已审核工具 ID（如果已通过审核） |

索引：

- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`status`)
- INDEX (`category_id`)
- INDEX (`created_at`)

---

## 4. 完整 SQL

以下 SQL 基于 Supabase PostgreSQL。

### 4.1 启用 UUID 扩展

```sql
create extension if not exists "pgcrypto";
```

### 4.2 建表 SQL

```sql
create table if not exists public.tool_categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  icon varchar(255) not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

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
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  user_id uuid references auth.users(id),
  is_approved boolean not null default true
);

create table if not exists public.tool_submissions (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  description text not null,
  full_description text,
  website_url varchar(255) not null,
  logo_url varchar(255),
  preview_image_url varchar(255),
  category_id uuid not null references public.tool_categories(id),
  user_id uuid not null references auth.users(id),
  status varchar(20) not null default 'pending',
  admin_comments text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  processed_at timestamp,
  ai_tool_id uuid references public.ai_tools(id),
  constraint chk_tool_submissions_status
    check (status in ('pending', 'approved', 'rejected'))
);
```

---

## 5. 索引 SQL

```sql
create index if not exists idx_ai_tools_category_id
  on public.ai_tools(category_id);

create index if not exists idx_ai_tools_user_id
  on public.ai_tools(user_id);

create index if not exists idx_tool_submissions_category_id
  on public.tool_submissions(category_id);

create index if not exists idx_tool_submissions_user_id
  on public.tool_submissions(user_id);

create index if not exists idx_tool_submissions_status
  on public.tool_submissions(status);

create index if not exists idx_tool_submissions_created_at
  on public.tool_submissions(created_at);
```

---

## 6. updated_at 自动更新时间

```sql
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
for each row
execute function public.set_updated_at();

drop trigger if exists trg_ai_tools_updated_at on public.ai_tools;
create trigger trg_ai_tools_updated_at
before update on public.ai_tools
for each row
execute function public.set_updated_at();

drop trigger if exists trg_tool_submissions_updated_at on public.tool_submissions;
create trigger trg_tool_submissions_updated_at
before update on public.tool_submissions
for each row
execute function public.set_updated_at();
```

---

## 7. 初始化分类数据 SQL

如果后续分类 icon 采用图片方式，可以直接插入 URL：

```sql
insert into public.tool_categories (name, icon)
values
  ('AI写作', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/writing.png'),
  ('图像生成', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/image.png'),
  ('视频制作', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/video.png'),
  ('语音处理', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/audio.png'),
  ('代码开发', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/coding.png'),
  ('设计工具', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/design.png'),
  ('效率工具', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/productivity.png'),
  ('教育学习', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/education.png'),
  ('商业应用', 'https://your-project.supabase.co/storage/v1/object/public/category-icons/business.png');
```

---

## 8. 审核流程 SQL

### 8.1 用户提交

```sql
insert into public.tool_submissions (
  name,
  description,
  full_description,
  website_url,
  logo_url,
  preview_image_url,
  category_id,
  user_id
)
values (
  :name,
  :description,
  :full_description,
  :website_url,
  :logo_url,
  :preview_image_url,
  :category_id,
  :user_id
);
```

### 8.2 审核通过

```sql
with inserted_tool as (
  insert into public.ai_tools (
    name,
    slug,
    description,
    full_description,
    website_url,
    logo_url,
    preview_image_url,
    category_id,
    user_id,
    is_approved
  )
  select
    ts.name,
    :slug,
    ts.description,
    ts.full_description,
    ts.website_url,
    ts.logo_url,
    ts.preview_image_url,
    ts.category_id,
    ts.user_id,
    true
  from public.tool_submissions ts
  where ts.id = :submission_id
  returning id
)
update public.tool_submissions
set
  status = 'approved',
  processed_at = now(),
  ai_tool_id = (select id from inserted_tool),
  admin_comments = :admin_comments
where id = :submission_id;
```

### 8.3 审核拒绝

```sql
update public.tool_submissions
set
  status = 'rejected',
  admin_comments = :admin_comments,
  processed_at = now()
where id = :submission_id;
```

---

## 9. 常用查询 SQL

### 9.1 查询左侧分类

```sql
select
  id,
  name,
  icon
from public.tool_categories
order by created_at asc;
```

### 9.2 查询工具列表

```sql
select
  t.id,
  t.name,
  t.slug,
  t.description,
  t.logo_url,
  t.preview_image_url,
  t.category_id
from public.ai_tools t
where t.is_approved = true
order by t.created_at desc;
```

### 9.3 查询某个分类下的工具

```sql
select
  t.id,
  t.name,
  t.slug,
  t.description,
  t.logo_url,
  t.preview_image_url
from public.ai_tools t
where t.category_id = :category_id
  and t.is_approved = true
order by t.created_at desc;
```

### 9.4 查询工具详情

```sql
select
  t.id,
  t.name,
  t.slug,
  t.description,
  t.full_description,
  t.website_url,
  t.logo_url,
  t.preview_image_url,
  t.category_id,
  t.user_id,
  t.created_at
from public.ai_tools t
where t.slug = :slug
  and t.is_approved = true
limit 1;
```

### 9.5 查询当前用户提交记录

```sql
select
  ts.id,
  ts.name,
  ts.description,
  ts.logo_url,
  ts.preview_image_url,
  ts.status,
  ts.admin_comments,
  ts.created_at,
  ts.processed_at,
  ts.ai_tool_id
from public.tool_submissions ts
where ts.user_id = :user_id
order by ts.created_at desc;
```

---

## 10. RLS 权限控制建议

参考 `reference_database.md`，补充最小 RLS 设计如下。

### 10.1 分类表

- 所有人可读
- 仅管理员可写

```sql
alter table public.tool_categories enable row level security;

create policy "Anyone can view categories"
on public.tool_categories
for select
using (true);
```

### 10.2 AI 工具表

- 所有人可读已审核工具
- 写操作仅管理员处理

```sql
alter table public.ai_tools enable row level security;

create policy "Anyone can view approved ai tools"
on public.ai_tools
for select
using (is_approved = true);
```

### 10.3 提交记录表

- 用户只能查看自己的提交
- 用户只能创建自己的提交

```sql
alter table public.tool_submissions enable row level security;

create policy "Users can view their own submissions"
on public.tool_submissions
for select
using (auth.uid() = user_id);

create policy "Users can insert their own submissions"
on public.tool_submissions
for insert
with check (auth.uid() = user_id);
```

说明：

- 如果后续有管理员表，例如 `admin_users`，可以继续补充 update/delete 权限

---

## 11. 最终结论

对照参考文档后，这份版本已经补齐了以下原先遗漏点：

- 分类表 icon 改为非空
- 补充了 `tool_submissions.created_at` 索引
- 补充了 RLS 权限建议
- 保留了和当前项目上传逻辑一致的 `logo_url` / `preview_image_url`

现在数据库结构已经和 bucket 设计完整对齐。
