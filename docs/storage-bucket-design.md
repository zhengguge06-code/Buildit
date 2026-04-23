# AI Tools Directory 存储 Bucket 设计文档

## 概述

当前项目继续沿用 3 个 Supabase Storage bucket：

1. `category-icons`
2. `tool-logos`
3. `tool-previews`

本次 `Vibe 产品` 重构不改 bucket 名，不迁移现有 logo / preview 资源，也不新增分类 icon 对象迁移任务。

## 本次重构的明确约束

- `tool-logos` 保持不变
- `tool-previews` 保持不变
- `category-icons` bucket 保留，但新的 `Vibe 产品` 主分类 icon 直接写入 `tool_categories.icon` 的 emoji，不要求上传新的分类 icon 文件
- 不做 bucket rename
- 不做对象路径迁移

## Bucket 结构

### 1. `category-icons`

- 用途：历史分类 icon 图片或未来仍需图片化的分类 icon
- 当前状态：保留，不强制参与本次 `Vibe 产品` 重构
- 访问权限：公开可读，仅管理员可写

### 2. `tool-logos`

- 用途：工具和产品的 logo
- 访问权限：公开可读，认证用户可上传，仅所有者和管理员可修改
- 命名规则：`{tool_id}.{extension}` 或 `submissions/{submission_id}/logo.{extension}`

### 3. `tool-previews`

- 用途：工具和产品的预览图
- 访问权限：公开可读，认证用户可上传，仅所有者和管理员可修改
- 命名规则：`{tool_id}/{timestamp}_{index}.{extension}` 或 `submissions/{submission_id}/preview.{extension}`

## 与数据库字段的对应关系

| 数据类型 | Bucket | 对应字段 |
| --- | --- | --- |
| 分类 icon 图片 | `category-icons` | `tool_categories.icon` |
| 工具或产品 logo | `tool-logos` | `tools.logo_url` |
| 工具或产品预览图 | `tool-previews` | `tools.preview_image_url` |
| 提交记录 logo | `tool-logos` | `tool_submissions.logo_url` |
| 提交记录预览图 | `tool-previews` | `tool_submissions.preview_image_url` |

说明：

- 新的 `Vibe 产品` 7 个主分类直接使用 emoji，例如 `🧩`、`✍️`、`🎬`
- 因此 `tool_categories.icon` 对于这些分类会直接存 emoji，而不是 `category-icons` 的文件 URL

## Bucket 创建 SQL

```sql
insert into storage.buckets (id, name, public)
values
  ('category-icons', 'Category Icons', true),
  ('tool-logos', 'Tool Logos', true),
  ('tool-previews', 'Tool Previews', true)
on conflict (id) do nothing;
```

## 结论

这次重构的存储策略是：

- 只改分类数据和前后端读写
- 不改 bucket 名
- 不迁移 logo / preview 文件
- 不要求给新的 `Vibe 产品` 分类上传新的 icon 文件
