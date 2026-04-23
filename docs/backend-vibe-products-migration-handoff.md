# Vibe 产品重构后端交接说明

## 文档目的

这份文档用于把当前前端已经完成、但真实数据库和后端管理流程还未完全落地的部分，一次性交接给后端同学处理。

目标是让后端明确：

- 哪些表结构必须改
- 哪些历史数据必须迁
- 哪些旧分类必须清理
- 哪些接口/读写逻辑要按新口径返回
- 哪些内容暂时不要改
- 如果需要我继续直接代执行，还要补哪些 key

## 交接方式说明

这份 handoff 面向“后端仓库未包含前端源文件”的场景做了补充。

也就是说：

- 如果后端仓库里没有 `lib/vibe-product-categories.ts`、`scripts/vibe-product-metadata.cjs`、`scripts/tool-bulk-edit.json` 这些前端侧文件，这是正常的
- 后端实现这次改造时，不应依赖去前端仓库手动翻文件
- 本文档加上同目录的 `backend-vibe-products-source-data.json`，就是这次交接的自包含数据包

推荐后端直接使用以下两份材料：

- 说明文档：`docs/backend-vibe-products-migration-handoff.md`
- 精确数据快照：`docs/backend-vibe-products-source-data.json`

## 当前前端已生效的新口径

### 1. Vibe 产品一级分类已固定为 7 个

当前前端已经统一按以下 7 个主分类工作：

1. `效率协作`
2. `内容创作`
3. `多媒体`
4. `学习教育`
5. `营销增长`
6. `商业金融`
7. `健康生活`

说明：

- 旧的 `页面设计` / `交互体验` / `信息架构` 已不再作为一级分类
- 这些旧概念现在只通过 badge 表达，不再占用分类层级
- 前端对 `Vibe 产品` 的展示、详情页、投稿页，全部按这 7 个主分类运行

### 2. 新增 3 组 badge

前端现在依赖以下 3 组 badge 字段：

- `reference_badges`
- `capability_badges`
- `platform_badges`

当前允许值如下。

`reference_badges`：

- `首页设计`
- `Onboarding`
- `定价设计`
- `结果页`
- `信息架构`
- `增长机制`
- `品牌表达`

`capability_badges`：

- `多媒体`
- `AI Native`
- `社区`
- `协作`

`platform_badges`：

- `Web`
- `移动端`
- `桌面端`

### 3. 前端的显示规则已经变了

- 列表卡片显示：`主分类 + 最多 4 个 badge`
- 详情页显示：`完整 badge`
- 投稿页只允许用户给 `Vibe 产品` 选择 `1 个主分类`
- 投稿页暂时不允许用户自己填写 badge，badge 由后台后续补充

## 前端侧原始来源文件

这些文件存在于当前前端仓库，用于说明这份 handoff 的来源：

- 分类和 badge 常量：`lib/vibe-product-categories.ts`
- 33 个现有 Vibe 产品映射：`scripts/vibe-product-metadata.cjs`
- 批量编辑数据：`scripts/tool-bulk-edit.json`
- 迁移 SQL 草案：`docs/directory-v1-schema.sql`
- 存储约束：`docs/storage-bucket-design.md`

说明：

- `scripts/vibe-product-metadata.cjs` 和 `scripts/tool-bulk-edit.json` 已经与前端口径对齐
- 当前共整理了 `33` 个已有 Vibe 产品映射
- 如果后端仓库里没有这些文件，请以后文档附带的 `backend-vibe-products-source-data.json` 为准

## 后端必须调整的内容

### 一、数据库结构

后端需要保证以下表结构已经存在并可用：

#### 1. `tool_categories`

需要支持：

- `channel_type varchar(32) not null`
- 允许值：`vibe-tools` / `vibe-products`
- `icon` 字段允许直接保存 emoji，不要求一定是文件 URL

对 `Vibe 产品` 而言，最终应只保留以下 7 个分类：

| name | icon | channel_type |
| --- | --- | --- |
| 效率协作 | 🧩 | vibe-products |
| 内容创作 | ✍️ | vibe-products |
| 多媒体 | 🎬 | vibe-products |
| 学习教育 | 📚 | vibe-products |
| 营销增长 | 📣 | vibe-products |
| 商业金融 | 💼 | vibe-products |
| 健康生活 | 🌿 | vibe-products |

#### 2. `tools`

需要补齐以下字段：

- `channel_type varchar(32) not null`
- `reference_badges text[] not null default '{}'`
- `capability_badges text[] not null default '{}'`
- `platform_badges text[] not null default '{}'`

并确保：

- `channel_type` 只允许 `vibe-tools` / `vibe-products`
- `status` 继续可用，前端读取 `published` 状态
- `category_id` 指向 `tool_categories.id`

#### 3. `tool_submissions`

需要补齐以下字段：

- `channel_type varchar(32) not null`
- `tool_id uuid`，指向 `tools.id`
- `reference_badges text[] not null default '{}'`
- `capability_badges text[] not null default '{}'`
- `platform_badges text[] not null default '{}'`

说明：

- 虽然当前投稿页不开放用户填写 badge，但后台审核流最好已经预留这 3 个字段
- 投稿记录在审核通过后，如果要转正为正式条目，最好直接能把 badge 一起写入 `tools`

#### 4. `tool_views`

前端当前会读取近 7 天浏览量，依赖：

- `tool_views.tool_id`
- `tool_views.viewed_at`

如果后端项目还没建这个表，需要补上。

### 二、索引

建议至少补齐以下索引：

- `tools(channel_type)`
- `tools(status)`
- `tools(published_at desc)`
- `tool_categories(channel_type)`
- `tool_submissions(channel_type)`
- `tool_views(tool_id)`
- `tool_views(viewed_at desc)`
- `gin(reference_badges)`
- `gin(capability_badges)`
- `gin(platform_badges)`

## 必须执行的数据迁移

### 一、统一旧的 channel_type

如果库里还有这些旧值，需要改成新值：

- `ai-tools` -> `vibe-tools`
- `vibe-coding` -> `vibe-tools`

适用表：

- `tool_categories`
- `tool_submissions`
- `tools`

### 二、补入 Vibe 产品 7 个新主分类

需要在 `tool_categories` 中保证以下 7 条 `vibe-products` 分类存在：

- `效率协作`
- `内容创作`
- `多媒体`
- `学习教育`
- `营销增长`
- `商业金融`
- `健康生活`

并且 icon 使用 emoji 直接存库：

- `🧩`
- `✍️`
- `🎬`
- `📚`
- `📣`
- `💼`
- `🌿`

### 三、把 33 个已有 Vibe 产品迁到新分类和新 badge

当前前端和脚本已确认的 33 个 slug，后端需要把它们迁到新分类，并写入对应 badge。

#### 1. 按分类分组

`效率协作`：

- `linear`
- `raycast`
- `notion`
- `granola`
- `arc`
- `perplexity`
- `claude`
- `chatgpt`
- `cal-com`
- `airtable`
- `tally`
- `coda`
- `savvycal`
- `tana`
- `readwise-reader`
- `attio`
- `superhuman`
- `discord`
- `obsidian`

`内容创作`：

- `typefully`
- `substack`
- `kit`
- `gumroad`
- `beehiiv`
- `canva`

`多媒体`：

- `descript`
- `riverside`
- `runwayml`
- `elevenlabs`

`营销增长`：

- `dub`

`商业金融`：

- `mercury`
- `midday`

`健康生活`：

- `oura`

说明：

- 当前 `学习教育` 分类已存在于前端口径中，但这 33 个现有案例里还没有落到该分类的历史数据

#### 2. badge 明细来源

每个 slug 的精确 badge，后端优先直接读取：

- `docs/backend-vibe-products-source-data.json`

如果需要核对来源，再回看前端仓库中的：

- `scripts/vibe-product-metadata.cjs`
- `scripts/tool-bulk-edit.json`
- `docs/directory-v1-schema.sql`

不建议后端人工重抄，以免漏项或顺序不一致。

## 附录：精确数据快照说明

同目录下的 `backend-vibe-products-source-data.json` 已经内嵌以下内容：

- 7 个 `vibe-products` 主分类及 icon
- 3 组 badge 的允许值
- 33 个既有 Vibe 产品的 `slug -> category_name -> 3 组 badge` 精确映射

后端如果只想要“无歧义迁移输入”，直接消费这一份 JSON 即可，不需要再去前端仓库找引用文件。

### 四、清理旧的 Vibe 产品一级分类

在 33 个既有产品和历史投稿都被重新指向 7 个主分类之后，需要删除 `vibe-products` 下旧的一级分类。

也就是说，`vibe-products` 最终只能剩下这 7 个：

- `效率协作`
- `内容创作`
- `多媒体`
- `学习教育`
- `营销增长`
- `商业金融`
- `健康生活`

旧的：

- `页面设计`
- `交互体验`
- `信息架构`

不应继续作为 `tool_categories` 中的 `vibe-products` 一级分类存在。

### 五、历史投稿也要一起对齐

不仅正式表 `tools` 要迁，`tool_submissions` 里历史上属于 `vibe-products` 的记录也要同步处理：

- 改成 7 个新主分类之一
- 补齐 `reference_badges`
- 补齐 `capability_badges`
- 补齐 `platform_badges`

这样后续管理员审核或查看历史记录时不会出现分类口径不一致。

## 后端接口或读写逻辑要同步的地方

### 一、频道页数据

前端读取 `Vibe 产品` 时的关键前提：

- `tools.channel_type = 'vibe-products'`
- `tools.status = 'published'`
- `tool.category_id` 能关联到正确的新主分类
- 能返回三组 badge 字段

如果后端有聚合接口，至少要保证能返回这些字段：

- `id`
- `name`
- `slug`
- `description`
- `logo_url`
- `preview_image_url`
- `category_id`
- `channel_type`
- `status`
- `published_at`
- `created_at`
- `user_id`
- `reference_badges`
- `capability_badges`
- `platform_badges`

### 二、详情页数据

详情页除了基础字段，还依赖：

- 分类名
- 三组 badge
- 官网地址
- Markdown/富文本正文
- 近 7 天浏览数

前端详情页会把 badge 分成三组展示：

- `值得借鉴`
- `能力特征`
- `平台形态`

### 三、投稿写入逻辑

当前前端投稿页提交 `tool_submissions` 的 payload 只有这些字段：

- `channel_type`
- `name`
- `slug`
- `description`
- `full_description`
- `website_url`
- `logo_url`
- `preview_image_url`
- `category_id`
- `user_id`

说明：

- 当前前端不会提交 badge
- 如果是 `vibe-products` 投稿，`category_id` 只会是 7 个主分类之一
- badge 需要由后台审核或补录流程来维护

### 四、我的投稿列表

前端“我的投稿”页面当前读取：

- `id`
- `name`
- `status`
- `created_at`
- `channel_type`
- `tool_id`

并在 `approved` 后通过 `tool_id -> tools.slug` 跳详情页。

因此后端审核通过时，最好保证：

- `tool_submissions.status = 'approved'`
- `tool_submissions.tool_id` 正确回填到新 `tools` 记录

## 明确不要改的内容

### 一、不要改 Storage bucket 名

当前 bucket 继续沿用：

1. `category-icons`
2. `tool-logos`
3. `tool-previews`

这次重构明确：

- 不改 bucket 名
- 不做 bucket rename
- 不迁移现有 logo / preview 文件
- 不新增分类 icon 文件迁移任务

### 二、Vibe 产品分类 icon 直接存 emoji

新的 7 个 `Vibe 产品` 主分类，`tool_categories.icon` 直接存 emoji。

不要额外要求上传分类 icon 文件。

### 三、不要把 badge 再做回一级分类

这些值现在只能出现在 badge 中，不要重新做回 `tool_categories`：

- `首页设计`
- `Onboarding`
- `定价设计`
- `结果页`
- `信息架构`
- `增长机制`
- `品牌表达`
- `多媒体`
- `AI Native`
- `社区`
- `协作`
- `Web`
- `移动端`
- `桌面端`

## 推荐后端落地顺序

1. 先执行 schema 变更
2. 补齐 7 个 `vibe-products` 主分类
3. 回填 `tools` 的 33 个现有 Vibe 产品分类和 badge
4. 回填 `tool_submissions` 的历史 Vibe 产品分类和 badge
5. 删除旧的 `vibe-products` 一级分类
6. 再跑一次批量 upsert / 列表读取 / 详情页读取验证

## 建议验收项

后端处理完成后，至少验证以下几点：

1. `tool_categories` 中 `vibe-products` 只剩 7 个主分类。
2. `tools` 和 `tool_submissions` 都存在 3 个 badge 数组字段。
3. 33 个既有 Vibe 产品的 `slug -> 分类 -> badge` 与 `scripts/tool-bulk-edit.json` 完全一致。
4. `Vibe 产品` 列表卡片能显示主分类和 badge。
5. `Vibe 产品` 详情页能按三组 badge 展示完整内容。
6. `pnpm tools:upsert -- --dry-run` 不再报“缺少迁移后的 Vibe 产品分类”。

## 如果要我继续直接代执行，还需要你提供哪些 key

你可以按下面三选一给我，推荐优先给第一种。

### 方案 A：直接给数据库连接串

这是最直接、最好执行 schema migration 的方案。

请提供：

- `DATABASE_URL`

要求：

- 能连接到真实 Supabase/Postgres 数据库
- 有执行 `ALTER TABLE` / `CREATE INDEX` / `UPDATE` / `DELETE` 的权限

### 方案 B：走 Supabase CLI

如果你希望我用 Supabase CLI 执行迁移，请提供：

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

可选但常见还会需要：

- 已经 `link` 好项目的本地环境，或者项目 ref 明确可用

### 方案 C：只让我做数据级验证或 upsert

这个方案不能执行 schema migration，但可以在迁移做完后让我继续验证或跑数据脚本。

请提供：

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

说明：

- 当前仓库已经有 `NEXT_PUBLIC_SUPABASE_URL`
- 但没有 `SUPABASE_SERVICE_ROLE_KEY`
- 没有 service role key 时，我无法可靠地做更高权限的数据检查和回填

## 最后说明

当前前端代码已经完全按新口径工作。

现在真正还没落到真实数据库的核心，不是前端逻辑，而是：

- schema migration 还没在真实库执行
- 33 个现有 Vibe 产品的正式数据还没全部落库
- 历史投稿还没一起对齐

只要后端按本文档把这三层补齐，前后端口径就会闭环。
