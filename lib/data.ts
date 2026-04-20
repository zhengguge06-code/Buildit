const toolDetailTemplate = (name: string, summary: string, highlights: string[]) => `# ${name}

${summary}

## 适合谁
- 想尽快判断这个条目是否值得收藏的人
- 需要了解主要能力、适用场景和上手方式的人
- 希望在同类产品里快速做选择的人

## 主要亮点

${highlights.map((item) => `- ${item}`).join("\n")}

## 使用建议

1. 先访问官网或产品页了解最新功能与定价边界。
2. 再结合你的工作流判断它更适合原型验证、开发协作，还是内容生产。
3. 如果准备长期使用，建议同时关注它的导出能力、团队协作和稳定性。`

export const fallbackCategories = [
  { id: "vibe-prototyping", name: "灵感原型", icon: "💡", channelType: "vibe-tools" },
  { id: "vibe-pages", name: "页面生成", icon: "🪄", channelType: "vibe-tools" },
  { id: "vibe-fullstack", name: "全栈构建", icon: "🧱", channelType: "vibe-tools" },
  { id: "vibe-ide", name: "AI 编程环境", icon: "⌘", channelType: "vibe-tools" },
  { id: "vibe-agent-coding", name: "Agent 编程", icon: "🤖", channelType: "vibe-tools" },
  { id: "vibe-backend", name: "数据后端", icon: "🗄️", channelType: "vibe-tools" },
  { id: "vibe-automation", name: "自动化流程", icon: "🔄", channelType: "vibe-tools" },
  { id: "vibe-deploy", name: "部署发布", icon: "🚀", channelType: "vibe-tools" },
  { id: "product-saas", name: "SaaS 产品", icon: "📦", channelType: "vibe-products" },
  { id: "product-directory", name: "导航站", icon: "🧭", channelType: "vibe-products" },
  { id: "product-landing", name: "落地页", icon: "🪧", channelType: "vibe-products" },
  { id: "product-portfolio", name: "作品集", icon: "🗂️", channelType: "vibe-products" },
  { id: "product-ai-webapp", name: "AI Web 应用", icon: "🌐", channelType: "vibe-products" },
  { id: "product-content", name: "内容工具", icon: "✍️", channelType: "vibe-products" },
  { id: "product-productivity", name: "效率产品", icon: "⚡", channelType: "vibe-products" },
  { id: "product-community", name: "社区平台", icon: "👥", channelType: "vibe-products" },
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
      "在 Vibe Coding 语境下讨论度很高",
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
    id: "product-shipfast",
    name: "ShipFast",
    slug: "shipfast",
    description: "典型的独立开发者产品模板站，适合参考如何包装和售卖 AI 产品。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-saas",
    channelType: "vibe-products",
    websiteUrl: "https://shipfa.st",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("ShipFast", "一个围绕快速上线 SaaS 的产品化案例。", [
      "适合参考独立开发产品的销售表达",
      "文案、结构和价格引导都很直接",
      "很适合作为 SaaS 落地页灵感样本",
    ]),
    publishedAt: "2026-04-18T08:00:00.000Z",
    weeklyViews: 141,
    status: "published",
  },
  {
    id: "product-waiby",
    name: "waiby",
    slug: "waiby",
    description: "以精选案例和工具内容为主的导航站，适合参考信息架构和收录方式。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-directory",
    channelType: "vibe-products",
    websiteUrl: "https://waiby.me",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("waiby", "一个很适合参考内容组织方式的导航型产品。", [
      "适合观察频道入口和目录页结构",
      "案例收录思路清晰",
      "适合作为整合站灵感来源",
    ]),
    publishedAt: "2026-04-16T03:00:00.000Z",
    weeklyViews: 126,
    status: "published",
  },
  {
    id: "product-gpts-works",
    name: "GPTs Works",
    slug: "gpts-works",
    description: "偏展示型的 AI Web 应用集合，适合参考内容呈现和功能包装。",
    logo: "/placeholder-logo.svg",
    categoryId: "product-ai-webapp",
    channelType: "vibe-products",
    websiteUrl: "https://gpts.works",
    previewImageUrl: "/placeholder.jpg",
    fullDescription: toolDetailTemplate("GPTs Works", "一个值得参考展示型 AI Web 应用表达的案例。", [
      "适合观察产品列表页的讲故事方式",
      "适合参考产品定位呈现",
      "更偏灵感启发而非工具底座",
    ]),
    publishedAt: "2026-04-12T09:00:00.000Z",
    weeklyViews: 78,
    status: "published",
  },
] as const

export function getFallbackToolBySlug(slug: string) {
  return fallbackTools.find((tool) => tool.slug === slug) ?? null
}
