# AI Tools Directory 存储 Bucket 设计文档

## 1. 概述

根据当前项目实际上传场景，需要存储 3 类媒体文件：

1. 分类 icon
2. 工具 logo
3. 工具预览图

本方案基于 Supabase Storage 设计，采用 3 个独立 bucket。

---

## 2. Bucket 结构

建议创建以下 bucket：

1. `category-icons`
2. `tool-logos`
3. `tool-previews`

---

## 3. 存储配置详情

### 3.1 `category-icons`

- 用途：存储左侧分类 icon 图片
- 访问权限：公开可读，仅管理员可写
- 文件类型限制：`jpg`, `jpeg`, `png`, `svg`, `webp`
- 文件大小限制：最大 1MB
- 命名规则：`{category_id}.{extension}`

### 3.2 `tool-logos`

- 用途：存储工具 logo 图片
- 访问权限：公开可读，认证用户可上传，仅所有者和管理员可修改
- 文件类型限制：`jpg`, `jpeg`, `png`, `svg`, `webp`
- 文件大小限制：最大 2MB
- 命名规则：`{tool_id}.{extension}` 或 `submissions/{submission_id}/logo.{extension}`

### 3.3 `tool-previews`

- 用途：存储工具预览图
- 访问权限：公开可读，认证用户可上传，仅所有者和管理员可修改
- 文件类型限制：`jpg`, `jpeg`, `png`, `webp`
- 文件大小限制：最大 5MB
- 命名规则：`{tool_id}/{timestamp}_{index}.{extension}` 或 `submissions/{submission_id}/preview.{extension}`

---

## 4. 与数据库字段的对应关系

| 数据类型 | Bucket | 对应字段 |
| --- | --- | --- |
| 分类 icon | `category-icons` | `tool_categories.icon` |
| 工具 logo | `tool-logos` | `ai_tools.logo_url` |
| 工具预览图 | `tool-previews` | `ai_tools.preview_image_url` |
| 提交记录 logo | `tool-logos` | `tool_submissions.logo_url` |
| 提交记录预览图 | `tool-previews` | `tool_submissions.preview_image_url` |

---

## 5. Bucket 创建 SQL

```sql
insert into storage.buckets (id, name, public)
values
  ('category-icons', 'Category Icons', true),
  ('tool-logos', 'Tool Logos', true),
  ('tool-previews', 'Tool Previews', true)
on conflict (id) do nothing;
```

---

## 6. 文件类型与大小限制 SQL

```sql
update storage.buckets
set
  file_size_limit = 1000000,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
where id = 'category-icons';

update storage.buckets
set
  file_size_limit = 2000000,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
where id = 'tool-logos';

update storage.buckets
set
  file_size_limit = 5000000,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'tool-previews';
```

---

## 7. Storage Policy 建议

### 7.1 分类 icon

- 公开可读
- 仅管理员可上传、更新、删除

```sql
create policy "Public read category icons"
on storage.objects
for select
using (bucket_id = 'category-icons');

create policy "Admins can upload category icons"
on storage.objects
for insert
with check (
  bucket_id = 'category-icons'
  and auth.uid() in (select user_id from admin_users)
);

create policy "Admins can update category icons"
on storage.objects
for update
using (
  bucket_id = 'category-icons'
  and auth.uid() in (select user_id from admin_users)
);

create policy "Admins can delete category icons"
on storage.objects
for delete
using (
  bucket_id = 'category-icons'
  and auth.uid() in (select user_id from admin_users)
);
```

### 7.2 工具 logo

- 公开可读
- 登录用户可上传
- 仅所有者和管理员可更新/删除

```sql
create policy "Public read tool logos"
on storage.objects
for select
using (bucket_id = 'tool-logos');

create policy "Authenticated users can upload tool logos"
on storage.objects
for insert
with check (
  bucket_id = 'tool-logos'
  and auth.uid() is not null
);

create policy "Owners and admins can update tool logos"
on storage.objects
for update
using (
  bucket_id = 'tool-logos'
  and (
    auth.uid() = owner
    or auth.uid() in (select user_id from admin_users)
  )
);

create policy "Owners and admins can delete tool logos"
on storage.objects
for delete
using (
  bucket_id = 'tool-logos'
  and (
    auth.uid() = owner
    or auth.uid() in (select user_id from admin_users)
  )
);
```

### 7.3 工具预览图

- 公开可读
- 登录用户可上传
- 仅所有者和管理员可更新/删除

```sql
create policy "Public read tool previews"
on storage.objects
for select
using (bucket_id = 'tool-previews');

create policy "Authenticated users can upload tool previews"
on storage.objects
for insert
with check (
  bucket_id = 'tool-previews'
  and auth.uid() is not null
);

create policy "Owners and admins can update tool previews"
on storage.objects
for update
using (
  bucket_id = 'tool-previews'
  and (
    auth.uid() = owner
    or auth.uid() in (select user_id from admin_users)
  )
);

create policy "Owners and admins can delete tool previews"
on storage.objects
for delete
using (
  bucket_id = 'tool-previews'
  and (
    auth.uid() = owner
    or auth.uid() in (select user_id from admin_users)
  )
);
```

说明：

- 上述策略沿用了参考文档的 `admin_users` 假设
- 如果你项目里还没有 `admin_users` 表，后续需要补一张管理员表，或改成用自定义 claim 判断管理员身份

---

## 8. 前端上传命名建议

### 分类 icon

```text
{category_id}.{extension}
```

### 工具 logo

```text
{tool_id}.{extension}
```

或审核前：

```text
submissions/{submission_id}/logo.{extension}
```

### 工具预览图

```text
{tool_id}/{timestamp}_{index}.{extension}
```

或审核前：

```text
submissions/{submission_id}/preview.{extension}
```

---

## 9. 数据保存建议

推荐直接在数据库中保存完整 public URL：

- `tool_categories.icon`
- `ai_tools.logo_url`
- `ai_tools.preview_image_url`
- `tool_submissions.logo_url`
- `tool_submissions.preview_image_url`

优点：

- 前端展示最直接
- 当前项目接入成本最低

---

## 10. 最终结论

对照参考文档后，这份存储文档补齐了这些原先不够完整的点：

- 每个 bucket 的访问权限说明
- 更完整的上传/更新/删除策略
- 更明确的命名规则
- 独立的文件类型和大小限制 SQL

现在它已经和数据库文档保持一致，并且更贴近实际落地。
