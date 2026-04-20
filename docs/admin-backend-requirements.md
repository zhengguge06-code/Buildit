# AI 导航站后台管理系统需求文档

## 1. 文档目标

本文档用于定义 AI 导航站后台管理系统的完整需求，覆盖以下内容：

- 后台信息架构与页面划分
- 管理员权限控制方案
- 概览、审核、用户管理 3 个后台模块
- Supabase 数据表变更方案
- 审核通过后写入正式工具表的业务流程
- 主要验收标准

本文档面向产品、设计、前端、后端和测试同学，作为后续开发与验收依据。

---

## 2. 项目背景

当前导航站基于 Supabase，已有以下 3 张核心业务表：

1. `ai_tools`：正式展示的 AI 工具数据
2. `tool_categories`：AI 工具分类数据
3. `tool_submissions`：用户提交的 AI 工具审核记录

当前站点已经具备：

- 前台工具展示能力
- 用户登录注册能力
- 用户提交 AI 工具能力
- 用户查看自己提交记录能力

当前缺失：

- 后台管理入口
- 管理员权限控制
- 工具审核后台
- 后台直接维护 AI 工具数据的能力

因此需要新增一个后台管理系统，供管理员统一完成工具新增、编辑、审核与管理员设置。

---

## 3. 建设目标

### 3.1 业务目标

- 让管理员可以直接在后台新增 AI 工具到 `ai_tools`
- 让管理员可以审核用户提交的 AI 工具，并在通过后自动进入正式工具库
- 让系统具备后台权限控制，只有管理员可以进入后台
- 让管理员可以维护哪些用户拥有后台权限

### 3.2 产品目标

- 后台结构清晰，操作路径短
- 审核流明确，避免重复录入
- 关键数据在概览页可快速查看
- 所有操作具备明确反馈，避免误操作

---

## 4. 角色定义

### 4.1 普通用户

- 可以登录前台
- 可以提交 AI 工具
- 不允许进入后台

### 4.2 管理员

- 可以登录前台
- 可以进入后台
- 可以查看后台概览
- 可以新增和编辑 AI 工具
- 可以审核用户提交
- 可以管理管理员名单

---

## 5. 后台信息架构

后台新增一级路由建议为 `/admin`，左侧侧边栏包含 3 个菜单：

1. `概览`
2. `审核`
3. `用户管理`

建议对应页面路由如下：

- `/admin/overview`
- `/admin/review`
- `/admin/users`

也可将 `/admin` 默认重定向到 `/admin/overview`。

---

## 6. 权限与访问控制

## 6.1 访问规则

- 未登录用户访问 `/admin` 下任意页面时，跳转到登录页
- 已登录但不是管理员的用户访问 `/admin` 下任意页面时，不允许进入后台
- 只有管理员用户可以访问后台页面、后台接口和后台写操作

建议跳转规则：

- 未登录：跳转 `/auth/login?next=/admin/overview`
- 非管理员：跳转首页 `/` 或进入一个 `403` 无权限页面

## 6.2 权限校验时机

后台权限校验至少应在以下两个层级同时生效：

1. 页面级校验
2. 服务端数据写入级校验

不能只做前端按钮隐藏，必须在服务端再次验证管理员身份。

---

## 7. 数据库设计变更

## 7.1 新增 `admin_users` 表

为实现“只有管理员可以登录进入后台”的逻辑，新增一张后台管理员表：`admin_users`。

说明：

- 当前项目用户登录体系基于 Supabase Auth
- 推荐 `admin_users.user_id` 关联 `auth.users.id`
- 如果项目已经维护了 `public.users` 镜像表，也可以改为关联 `public.users.id`
- 本文档默认按 `auth.users.id` 设计

### 7.1.1 表结构建议

```sql
create table public.admin_users (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  is_active boolean not null default true,
  role varchar(20) not null default 'admin',
  granted_by uuid null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_user_id_key unique (user_id),
  constraint admin_users_role_check check (role in ('admin')),
  constraint admin_users_user_id_fkey foreign key (user_id) references auth.users (id),
  constraint admin_users_granted_by_fkey foreign key (granted_by) references auth.users (id)
) tablespace pg_default;

create index idx_admin_users_is_active on public.admin_users (is_active);
```

### 7.1.2 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | uuid | 主键 |
| `user_id` | uuid | 被授予后台权限的用户 |
| `is_active` | boolean | 是否仍然拥有后台权限 |
| `role` | varchar(20) | 角色，当前固定为 `admin`，便于未来扩展 |
| `granted_by` | uuid | 由哪个管理员授予 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

### 7.1.3 使用规则

- 当用户在 `admin_users` 中存在记录且 `is_active = true` 时，视为管理员
- 当记录不存在，或 `is_active = false` 时，视为非管理员
- 不建议物理删除管理员记录，优先改为 `is_active = false`

### 7.1.4 `admin_users` 的 RLS 设计要求

`admin_users` 属于高敏感权限表，必须开启 RLS。

设计目标如下：

- 普通登录用户只能读取“自己是否是管理员”
- 管理员可以读取完整管理员列表，用于后台“用户管理”页面
- 普通用户不能直接新增、修改、删除 `admin_users`
- 管理员的新增、启用、禁用操作，建议统一通过服务端受保护接口执行
- 首个管理员账号的创建，不走前台页面，需通过 Supabase SQL Editor、迁移脚本或 service role 完成初始化

推荐权限策略如下：

- `SELECT`
  - 普通已登录用户：允许读取自己的管理员记录
  - 管理员：允许读取所有管理员记录
- `INSERT`
  - 不对普通前端客户端开放
  - 建议仅允许管理员通过服务端受保护逻辑执行
- `UPDATE`
  - 不对普通前端客户端开放
  - 建议仅允许管理员通过服务端受保护逻辑执行
- `DELETE`
  - 本期不开放
  - 管理员取消权限时，统一使用 `is_active = false`

### 7.1.5 `admin_users` RLS 推荐 SQL

由于策略本身需要判断“当前用户是否是管理员”，直接在 `admin_users` 的 policy 中查询本表，容易让实现变得复杂。建议先创建一个 `security definer` 函数专门判断管理员身份，再在 policy 中复用。

```sql
create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = coalesce(check_user_id, auth.uid())
      and is_active = true
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

alter table public.admin_users enable row level security;

create policy "Users can read their own admin record"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin(auth.uid()));
```

### 7.1.6 写操作策略建议

`admin_users` 是权限控制核心表，推荐将写操作统一放在服务端完成，避免浏览器端直接对该表执行 `insert` 或 `update`。

推荐实现方式：

1. 页面层使用当前登录态访问后台
2. 服务端再次校验 `public.is_admin(auth.uid())`
3. 校验通过后，再通过受保护服务端逻辑执行管理员写操作
4. 写入时自动补齐 `granted_by = auth.uid()`

如果项目必须让“带用户会话的服务端请求”直接受 RLS 控制，则可补充以下策略：

```sql
create policy "Admins can insert admin users"
on public.admin_users
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  and granted_by = auth.uid()
);

create policy "Admins can update admin users"
on public.admin_users
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

补充说明：

- 以上 `INSERT` / `UPDATE` policy 仅用于“管理员在登录态下通过服务端请求写库”的场景
- 如果使用 `service role` 执行写入，则 `service role` 默认绕过 RLS
- 若使用 `service role`，必须确保对应接口本身已经在服务端完成管理员身份校验
- 本期不建议为 `DELETE` 建立 policy

### 7.1.7 自保护约束建议

仅靠 RLS 还不够，建议补充以下业务约束：

- 不允许删除 `admin_users` 记录
- 不允许最后一个有效管理员被禁用
- 不建议管理员自己禁用自己，建议由其他管理员操作

其中“最后一个管理员不能被禁用”建议通过服务端业务逻辑或数据库触发器实现，而不要只依赖前端限制。

---

## 7.2 对现有表的使用约定

### 7.2.1 `ai_tools`

后台“概览”中的新增工具、编辑工具，直接对 `ai_tools` 进行增删改查。

### 7.2.2 `tool_categories`

后台概览中的分类数量卡片，来源于 `tool_categories` 总数。

### 7.2.3 `tool_submissions`

后台审核模块从 `tool_submissions` 读取待审核数据，并在审核时更新：

- `status`
- `admin_comments`
- `processed_at`
- `ai_tool_id`

---

## 8. 关键数据口径

后台概览顶部 4 个卡片的数据口径如下：

### 8.1 AI 工具数量

- 数据来源：`ai_tools`
- 统计口径：总记录数

### 8.2 AI 分类数量

- 数据来源：`tool_categories`
- 统计口径：总记录数

### 8.3 当日用户提交

- 数据来源：`tool_submissions`
- 统计口径：当天 00:00:00 至 23:59:59 之间创建的记录数
- 时间标准建议统一为后台系统所使用的业务时区

### 8.4 未审核的用户提交

- 数据来源：`tool_submissions`
- 统计口径：`status = 'pending'` 的记录数

---

## 9. 状态字段说明与冲突处理

你当前的描述里提到“审核后将 `tool_submissions.status` 改为 `success`”，但现有表约束中只允许以下 3 个状态：

- `pending`
- `approved`
- `rejected`

因此当前版本必须先做一个明确决策：

### 方案 A：沿用现有表结构，审核通过状态使用 `approved`

这是推荐方案，改动最小，也与当前项目现有页面兼容。

### 方案 B：将审核通过状态统一改为 `success`

如果坚持使用 `success`，则需要同步修改以下内容：

- `tool_submissions` 的 `check constraint`
- 所有前端状态文案与枚举
- 所有依赖状态判断的查询逻辑

本文档默认采用方案 A，即：

- 待审核：`pending`
- 审核通过：`approved`
- 审核拒绝：`rejected`

---

## 10. 功能需求

## 10.1 概览

### 10.1.1 页面目标

让管理员进入后台后，能够快速看到核心运营数据，并直接维护正式 AI 工具数据。

### 10.1.2 页面组成

页面分为 3 个区域：

1. 顶部操作区
2. 统计卡片区
3. AI 工具列表区

### 10.1.3 顶部操作区

页面右上角提供一个 `添加 AI 工具` 按钮。

交互要求：

- 点击按钮后，从页面右侧弹出 `Drawer`
- Drawer 内展示新增 AI 工具表单
- 提交成功后关闭 Drawer
- 提交成功后刷新概览页列表与统计卡片
- 提交失败时展示错误提示

### 10.1.4 新增 AI 工具表单字段

表单字段建议如下：

| 字段 | 是否必填 | 对应数据库字段 |
| --- | --- | --- |
| 工具名称 | 是 | `name` |
| 工具 slug | 是 | `slug` |
| 简短描述 | 是 | `description` |
| 详细描述 | 否 | `full_description` |
| 官网地址 | 否 | `website_url` |
| Logo 地址 | 否 | `logo_url` |
| 预览图地址 | 否 | `preview_image_url` |
| 分类 | 是 | `category_id` |
| 类型 | 否 | `type` |

新增时默认写入规则：

- `is_approved = true`
- `created_at`、`updated_at` 使用数据库默认值
- `user_id` 可为空，或记录当前管理员用户 ID

### 10.1.5 表单校验规则

- `name` 必填，长度不超过 200
- `slug` 必填，且必须唯一
- `description` 必填
- `website_url` 如填写，必须为合法 URL
- `logo_url` 如填写，必须为合法 URL
- `preview_image_url` 如填写，必须为合法 URL
- `category_id` 必须是有效分类
- `type` 如填写，需满足系统定义的可选值

### 10.1.6 统计卡片区

顶部展示 4 个统计卡片：

1. AI 工具数量
2. AI 分类数量
3. 当日用户提交
4. 未审核的用户提交

卡片要求：

- 页面加载时自动拉取
- 新增工具和审核操作后自动刷新
- 加载中显示骨架屏或 loading 状态
- 查询失败时展示兜底错误提示

### 10.1.7 AI 工具列表区

底部展示所有 `ai_tools` 数据。

列表字段建议至少包含：

- Logo
- 工具名称
- slug
- 分类名称
- 简短描述
- 类型
- 官网地址
- 创建时间
- 更新时间

操作项至少包含：

- 查看
- 编辑

### 10.1.8 查看功能

- 点击查看后，展示该工具完整信息
- 展示形式可为 Drawer、Dialog 或详情页
- 建议优先使用 Drawer，与新增/编辑交互保持一致

### 10.1.9 编辑功能

- 点击编辑后，从右侧弹出 Drawer
- 表单默认回填当前工具信息
- 保存后更新 `ai_tools`
- 更新成功后刷新列表

### 10.1.10 列表增强能力

以下能力建议纳入本期：

- 分页
- 按名称搜索
- 按分类筛选
- 按创建时间倒序排序

---

## 10.2 审核

### 10.2.1 页面目标

让管理员高效处理用户提交的 AI 工具，审核通过后自动进入正式工具库。

### 10.2.2 数据范围

默认展示 `tool_submissions` 中 `status = 'pending'` 的记录。

### 10.2.3 页面内容

待审核列表建议展示以下字段：

- 提交名称
- 简短描述
- 分类
- 官网地址
- Logo
- 预览图
- 提交用户 ID
- 提交时间
- 当前状态

### 10.2.4 审核操作

管理员至少可以执行以下操作：

1. 查看提交详情
2. 审核通过
3. 审核拒绝

虽然你的描述重点强调“审核通过”，但从完整业务闭环考虑，本期应同时支持“拒绝”，否则待审核数据无法关闭。

### 10.2.5 审核通过流程

管理员点击“通过”后，系统需要一次性完成以下动作：

1. 校验当前提交记录仍为 `pending`
2. 校验 `slug` 是否为空
3. 若为空，则自动生成 slug
4. 校验 slug 在 `ai_tools` 中是否唯一
5. 向 `ai_tools` 新增正式工具记录
6. 回写 `tool_submissions.ai_tool_id`
7. 更新 `tool_submissions.status = 'approved'`
8. 更新 `tool_submissions.processed_at = now()`
9. 更新 `tool_submissions.updated_at = now()`
10. 如管理员填写备注，则更新 `admin_comments`

建议该流程通过事务或等价的原子方式执行，避免出现“工具已写入正式表，但提交记录未更新”的不一致情况。

### 10.2.6 审核通过写入 `ai_tools` 的字段映射

| `tool_submissions` 字段 | `ai_tools` 字段 |
| --- | --- |
| `name` | `name` |
| `slug` | `slug` |
| `description` | `description` |
| `full_description` | `full_description` |
| `website_url` | `website_url` |
| `logo_url` | `logo_url` |
| `preview_image_url` | `preview_image_url` |
| `category_id` | `category_id` |
| `user_id` | `user_id` |

补充写入规则：

- `is_approved = true`
- `type` 可默认空值，或在审核时允许管理员补充

### 10.2.7 审核拒绝流程

管理员点击“拒绝”后，系统需要完成：

1. 更新 `tool_submissions.status = 'rejected'`
2. 更新 `tool_submissions.processed_at = now()`
3. 更新 `tool_submissions.updated_at = now()`
4. 保存管理员填写的 `admin_comments`
5. 不向 `ai_tools` 写入任何数据

### 10.2.8 审核交互要求

- 审核前需要二次确认
- 审核中按钮进入 loading 状态，避免重复提交
- 审核成功后自动从待审核列表中移除
- 审核成功后同步刷新概览页的“未审核用户提交”统计
- 审核失败时保留当前数据并提示失败原因

### 10.2.9 审核详情建议

审核详情中建议支持管理员修改以下信息后再通过：

- 名称
- slug
- 简短描述
- 详细描述
- 分类
- 官网地址
- Logo
- 预览图
- `type`
- 管理员备注

原因：

- 用户提交内容可能不规范
- 审核时往往需要顺手修正格式、文案、slug 或分类

---

## 10.3 用户管理

### 10.3.1 页面目标

让管理员可以配置“谁有后台权限”，并控制后台访问资格。

### 10.3.2 页面内容

建议页面分为两个区域：

1. 当前管理员列表
2. 添加管理员操作区

### 10.3.3 当前管理员列表

列表建议展示：

- 用户 ID
- 用户邮箱
- 角色
- 状态（启用 / 禁用）
- 创建时间
- 授权人
- 操作

操作至少包含：

- 启用
- 禁用

### 10.3.4 添加管理员

管理员可以通过用户 ID 或邮箱搜索用户，并将其加入 `admin_users`。

建议流程：

1. 输入用户 ID 或邮箱
2. 查询用户是否存在
3. 若存在，则写入 `admin_users`
4. 若该用户已有记录，则提示已存在

### 10.3.5 取消管理员权限

不建议直接删除记录，建议将：

- `is_active = false`

这样可以保留授权历史，便于排查问题。

### 10.3.6 自保护规则

系统应至少考虑以下保护逻辑：

- 不允许最后一名管理员把自己禁用
- 不允许普通管理员绕过系统前端限制直接调用接口修改权限
- 所有用户管理写操作必须校验当前操作者本身仍是管理员

---

## 11. 页面与交互要求

## 11.1 布局要求

- 后台使用统一的 Admin Layout
- 左侧为固定侧边栏
- 右侧为主内容区
- 页面顶部保留标题、说明和操作按钮区域

## 11.2 Drawer 交互要求

- 从右侧滑出
- 支持关闭按钮
- 点击遮罩可关闭
- 表单内容过长时支持内部滚动
- 提交中禁止重复提交

## 11.3 反馈要求

所有新增、编辑、审核、权限变更操作，必须给出明确反馈：

- 成功提示
- 失败提示
- 校验错误提示

---

## 12. 服务端能力要求

后台功能建议通过服务端完成敏感操作，不应只依赖客户端直连数据库。

建议至少将以下写操作放在服务端：

- 新增 AI 工具
- 编辑 AI 工具
- 审核通过
- 审核拒绝
- 新增管理员
- 启用/禁用管理员

服务端在执行写操作前，必须再次校验：

- 当前用户已登录
- 当前用户在 `admin_users` 中存在有效权限

---

## 13. 推荐接口能力

如项目采用 Server Actions 或 API Route，建议至少具备以下能力：

- 获取后台概览统计
- 获取 AI 工具列表
- 新增 AI 工具
- 编辑 AI 工具
- 获取待审核提交列表
- 审核通过提交
- 审核拒绝提交
- 获取管理员列表
- 新增管理员
- 启用/禁用管理员
- 校验当前用户是否为管理员

---

## 14. 验收标准

## 14.1 后台访问控制

- 未登录用户访问后台会被拦截并跳转登录页
- 非管理员用户访问后台会被拦截
- 管理员用户可以正常进入后台

## 14.2 概览页

- 页面展示 4 个统计卡片
- 右上角存在“添加 AI 工具”按钮
- 点击按钮可以打开右侧 Drawer
- 表单提交后，数据成功写入 `ai_tools`
- AI 工具列表可以展示全部工具
- 列表支持查看和编辑

## 14.3 审核页

- 只展示 `pending` 状态的提交
- 点击通过后，`tool_submissions.status` 更新为 `approved`
- 点击通过后，`ai_tools` 新增一条正式工具记录
- 点击通过后，`tool_submissions.ai_tool_id` 回填成功
- 点击拒绝后，`tool_submissions.status` 更新为 `rejected`
- 审核成功后列表自动刷新

## 14.4 用户管理页

- 可以查看当前管理员列表
- 可以新增管理员
- 可以禁用管理员
- 被禁用的管理员不能进入后台

---

## 15. 非功能需求

- 后台页面需兼容桌面端
- 关键操作响应时间应可接受，避免明显卡顿
- 所有关键写操作需具备错误处理
- 审核通过流程需尽量保证数据一致性
- 文案统一使用中文

---

## 16. 本期范围与非本期范围

## 16.1 本期范围

- 后台管理 Layout
- 概览页
- 审核页
- 用户管理页
- `admin_users` 表
- 后台权限校验
- 审核通过写入正式工具表

## 16.2 非本期范围

- 操作日志系统
- 超级管理员与普通管理员分级
- 分类管理后台
- 批量审核
- 批量导入/导出
- 后台图表分析

---

## 17. 开发建议

结合当前项目技术栈，建议按以下方式实现：

- 前端框架：Next.js App Router
- UI：沿用现有组件体系，右侧弹层可复用 `Sheet/Drawer`
- 数据层：Supabase
- 权限判断：服务端读取当前登录用户后查询 `admin_users`
- 后台路由保护：页面级 + 服务端写操作双重校验

---

## 18. 最终结论

本次后台建设的核心是 3 件事：

1. 建立后台权限体系，新增 `admin_users`
2. 建立后台管理入口，支持概览、审核、用户管理 3 个模块
3. 打通“用户提交 -> 管理员审核 -> 正式入库”的完整闭环

其中最需要优先统一的实现细节是审核状态字段：

- 如果不改表结构，请使用 `approved`
- 如果必须使用 `success`，需先做数据库与前端状态枚举迁移

当前建议优先采用 `approved`，这样可以最小成本完成后台落地。
