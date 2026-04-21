const toolDetailTemplate = (name: string, summary: string, highlights: string[]) => `# ${name}

${summary}

## 适合谁看

- 想快速判断这个条目是否值得收藏的人
- 想了解主要能力、适用场景和上手方式的人
- 希望在同类产品里快速做选择的人

## 主要亮点

${highlights.map((item) => `- ${item}`).join("\n")}

## 使用建议

1. 先访问官网或产品页，确认它当前的功能边界和定价策略。
2. 再结合你的工作流判断它更适合做原型验证、协作开发，还是内容生产。
3. 如果准备长期使用，建议顺手确认导出能力、协作方式和稳定性。
`

export const fallbackCategories = [
  { id: "vibe-prototyping", name: "灵感原型", icon: "💡", channelType: "vibe-tools" },
  { id: "vibe-pages", name: "页面生成", icon: "🪄", channelType: "vibe-tools" },
  { id: "vibe-fullstack", name: "全栈构建", icon: "🧱", channelType: "vibe-tools" },
  { id: "vibe-ide", name: "AI 编程环境", icon: "⌘", channelType: "vibe-tools" },
  { id: "vibe-agent-coding", name: "Agent 编程", icon: "🤖", channelType: "vibe-tools" },
  { id: "vibe-backend", name: "数据后端", icon: "🗄️", channelType: "vibe-tools" },
  { id: "vibe-automation", name: "自动化流程", icon: "🔄", channelType: "vibe-tools" },
  { id: "vibe-deploy", name: "部署发布", icon: "🚀", channelType: "vibe-tools" },
  { id: "product-interface", name: "界面表现", icon: "🖼️", channelType: "vibe-products" },
  { id: "product-interaction", name: "交互体验", icon: "🫶", channelType: "vibe-products" },
  { id: "product-structure", name: "产品结构", icon: "🧭", channelType: "vibe-products" },
  { id: "product-conversion", name: "商业转化", icon: "💸", channelType: "vibe-products" },
  { id: "product-growth", name: "增长运营", icon: "📈", channelType: "vibe-products" },
  { id: "product-brand", name: "品牌表达", icon: "✨", channelType: "vibe-products" },
] as const

export const fallbackTools = [
  {
    id: "tool-cursor",
    name: "Cursor",
    slug: "cursor",
    description: "最常被提到的 AI 编程工具之一，适合以代码为中心的 Vibe Coding 工作流。",
    logo: "/placeholder-logo.svg",
    categoryId: "vibe-ide",
    channelType: "vibe-tools",
    websiteUrl: "https://cursor.com",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Cursor", "一款围绕 AI 编程协作体验打造的 IDE 产品。", [
      "适合重度代码编辑、重构和连续开发",
      "在 Vibe Coding 语境里讨论度很高",
      "从需求到实现的协作链路比较顺滑",
    ]),
    publishedAt: "2026-04-19T02:00:00.000Z",
    weeklyViews: 213,
    status: "published",
  },
  {
    id: "tool-lovable",
    name: "Lovable",
    slug: "lovable",
    description: "用自然语言快速搭产品原型和 Web 应用，适合非传统开发者快速试错。",
    logo: "/placeholder-logo.png",
    categoryId: "vibe-fullstack",
    channelType: "vibe-tools",
    websiteUrl: "https://lovable.dev",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Lovable", "一款强调自然语言生成应用原型与页面的构建工具。", [
      "适合快速验证产品想法",
      "更偏向原型和轻量 Web 应用生成",
      "很适合非工程背景用户参与产品搭建",
    ]),
    publishedAt: "2026-04-17T05:00:00.000Z",
    weeklyViews: 164,
    status: "published",
  },
  {
    id: "tool-bolt",
    name: "Bolt",
    slug: "bolt",
    description: "强调在线生成、运行和修改应用，适合快速迭代 MVP。",
    logo: "/placeholder.svg",
    categoryId: "vibe-pages",
    channelType: "vibe-tools",
    websiteUrl: "https://bolt.new",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Bolt", "一款强调即时生成、即时运行、即时修改的在线构建工具。", [
      "适合快速生成 MVP 和页面实验",
      "像一个可以立刻运行的产品沙盒",
      "适合做短链路设计验证",
    ]),
    publishedAt: "2026-04-13T08:30:00.000Z",
    weeklyViews: 137,
    status: "published",
  },
  {
    id: "tool-supabase",
    name: "Supabase",
    slug: "supabase",
    description: "适合做登录、数据库、对象存储和实时能力的后端底座。",
    logo: "/placeholder-logo.svg",
    categoryId: "vibe-backend",
    channelType: "vibe-tools",
    websiteUrl: "https://supabase.com",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Supabase", "一套适合中小团队快速起步的后端基础设施组合。", [
      "数据库、鉴权、存储和 Edge Functions 能力集中",
      "适合和生成式前端一起搭配",
      "很适合快速上线 MVP",
    ]),
    publishedAt: "2026-04-11T08:00:00.000Z",
    weeklyViews: 102,
    status: "published",
  },
  {
    id: "tool-n8n",
    name: "n8n",
    slug: "n8n",
    description: "把 AI、Webhook 和第三方服务串起来的自动化工作流工具。",
    logo: "/placeholder-logo.svg",
    categoryId: "vibe-automation",
    channelType: "vibe-tools",
    websiteUrl: "https://n8n.io",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("n8n", "一款适合把 AI 流程、表单和通知系统串联起来的自动化平台。", [
      "适合快速验证 Agent 工作流",
      "连接外部服务的能力很强",
      "对非纯工程团队也比较友好",
    ]),
    publishedAt: "2026-04-08T07:20:00.000Z",
    weeklyViews: 88,
    status: "published",
  },
  {
    id: "tool-vercel",
    name: "Vercel",
    slug: "vercel",
    description: "适合前端产品的部署发布与预览协作，和生成式开发流程搭配顺滑。",
    logo: "/placeholder-logo.svg",
    categoryId: "vibe-deploy",
    channelType: "vibe-tools",
    websiteUrl: "https://vercel.com",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Vercel", "一款适合快速部署前端产品和 AI Web 应用的发布平台。", [
      "预览环境和上线链路很顺",
      "适合快节奏试错和产品迭代",
      "和现代 React 技术栈兼容度高",
    ]),
    publishedAt: "2026-04-06T06:30:00.000Z",
    weeklyViews: 59,
    status: "published",
  },
  {
    id: "product-linear",
    name: "Linear",
    slug: "linear",
    description: "界面克制、层级清晰，是很多产品团队在信息密度和节奏感上的参考样本。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-interface",
    channelType: "vibe-products",
    websiteUrl: "https://linear.app/",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Linear", "一个很适合参考界面表现的现代产品案例。", [
      "信息密度高但依然清晰",
      "层级、留白和节奏控制得很好",
      "适合参考专业工具型产品的视觉组织方式",
    ]),
    publishedAt: "2026-04-21T08:00:00.000Z",
    weeklyViews: 0,
    status: "published",
  },
  {
    id: "product-raycast",
    name: "Raycast",
    slug: "raycast",
    description: "界面统一性很强，桌面效率产品的视觉表达和功能呈现都很完整。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-interface",
    channelType: "vibe-products",
    websiteUrl: "https://www.raycast.com/",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Raycast", "一个适合参考界面表现与产品包装结合方式的案例。", [
      "品牌气质与界面表现一致",
      "功能展示和视觉样式整合得很好",
      "适合参考桌面效率产品的表达方式",
    ]),
    publishedAt: "2026-04-20T08:00:00.000Z",
    weeklyViews: 0,
    status: "published",
  },
  {
    id: "product-notion",
    name: "Notion",
    slug: "notion",
    description: "在复杂信息组织和简洁界面之间拿捏得很好，适合参考多层内容产品的视觉秩序。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-interface",
    channelType: "vibe-products",
    websiteUrl: "https://www.notion.com/",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Notion", "一个适合参考内容型产品界面表现的长期样本。", [
      "复杂结构下仍然保持清楚的页面秩序",
      "视觉风格克制但辨识度高",
      "适合参考多模块产品如何保持统一感",
    ]),
    publishedAt: "2026-04-19T08:00:00.000Z",
    weeklyViews: 0,
    status: "published",
  },
  {
    id: "product-granola",
    name: "Granola",
    slug: "granola",
    description: "AI 会议笔记产品里界面气质非常完整，适合参考轻盈、友好的产品呈现方式。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-interface",
    channelType: "vibe-products",
    websiteUrl: "https://www.granola.ai/",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Granola", "一个适合参考轻量 AI 产品界面表达的案例。", [
      "整体氛围轻但不幼稚",
      "视觉节奏和留白处理舒服",
      "适合参考 AI 产品如何做亲和表达",
    ]),
    publishedAt: "2026-04-18T08:00:00.000Z",
    weeklyViews: 0,
    status: "published",
  },
  {
    id: "product-arc",
    name: "Arc",
    slug: "arc",
    description: "界面表达和品牌气质高度统一，适合参考具有明显个性的产品视觉组织方式。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-interface",
    channelType: "vibe-products",
    websiteUrl: "https://arc.net/",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("Arc", "一个适合参考强个性产品界面表现的案例。", [
      "界面风格和品牌表达高度一体化",
      "视觉记忆点明确",
      "适合参考有态度产品的呈现方式",
    ]),
    publishedAt: "2026-04-17T08:00:00.000Z",
    weeklyViews: 0,
    status: "published",
  },
] as const

export function getFallbackToolBySlug(slug: string) {
  return fallbackTools.find((tool) => tool.slug === slug) ?? null
}
