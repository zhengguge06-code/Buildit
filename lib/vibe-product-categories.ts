export type VibeProductCategory = {
  id: string
  name: string
  icon: string
}

export type VibeProductBadges = {
  referenceBadges: string[]
  capabilityBadges: string[]
  platformBadges: string[]
}

type VibeProductProfile = VibeProductBadges & {
  categoryId: string
}

const defaultVibeProductCategoryId = "product-efficiency-collaboration"

export const canonicalVibeProductCategories: VibeProductCategory[] = [
  { id: "product-efficiency-collaboration", name: "效率协作", icon: "🧩" },
  { id: "product-content-creation", name: "内容创作", icon: "✍️" },
  { id: "product-multimedia", name: "多媒体", icon: "🎬" },
  { id: "product-learning-education", name: "学习教育", icon: "📚" },
  { id: "product-marketing-growth", name: "营销增长", icon: "📣" },
  { id: "product-business-finance", name: "商业金融", icon: "💼" },
  { id: "product-health-lifestyle", name: "健康生活", icon: "🌿" },
]

export const vibeProductReferenceBadgeOptions = [
  "首页设计",
  "Onboarding",
  "定价设计",
  "结果页",
  "信息架构",
  "增长机制",
  "品牌表达",
] as const

export const vibeProductCapabilityBadgeOptions = ["多媒体", "AI Native", "社区", "协作"] as const

export const vibeProductPlatformBadgeOptions = ["Web", "移动端", "桌面端"] as const

const categoryById = new Map(canonicalVibeProductCategories.map((category) => [category.id, category]))
const categoryByName = new Map(canonicalVibeProductCategories.map((category) => [category.name, category]))

const allowedReferenceBadges = new Set<string>(vibeProductReferenceBadgeOptions)
const allowedCapabilityBadges = new Set<string>(vibeProductCapabilityBadgeOptions)
const allowedPlatformBadges = new Set<string>(vibeProductPlatformBadgeOptions)

const vibeProductProfilesBySlug: Record<string, VibeProductProfile> = {
  linear: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "信息架构"],
    capabilityBadges: ["协作"],
    platformBadges: ["Web"],
  },
  raycast: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: [],
    platformBadges: ["桌面端"],
  },
  notion: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "信息架构"],
    capabilityBadges: ["协作"],
    platformBadges: ["Web"],
  },
  granola: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "Onboarding", "品牌表达"],
    capabilityBadges: ["AI Native"],
    platformBadges: ["桌面端"],
  },
  arc: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: [],
    platformBadges: ["桌面端"],
  },
  perplexity: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding", "结果页"],
    capabilityBadges: ["AI Native"],
    platformBadges: ["Web"],
  },
  claude: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding", "结果页"],
    capabilityBadges: ["AI Native"],
    platformBadges: ["Web"],
  },
  chatgpt: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding", "结果页", "信息架构"],
    capabilityBadges: ["AI Native"],
    platformBadges: ["Web"],
  },
  "cal-com": {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  airtable: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["信息架构"],
    capabilityBadges: ["协作"],
    platformBadges: ["Web"],
  },
  tally: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  coda: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["信息架构"],
    capabilityBadges: ["协作"],
    platformBadges: ["Web"],
  },
  savvycal: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["Onboarding"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  tana: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["信息架构"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  "readwise-reader": {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["信息架构", "结果页"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  attio: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["信息架构"],
    capabilityBadges: ["协作"],
    platformBadges: ["Web"],
  },
  superhuman: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["首页设计", "定价设计", "品牌表达"],
    capabilityBadges: [],
    platformBadges: ["桌面端"],
  },
  discord: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["增长机制"],
    capabilityBadges: ["社区"],
    platformBadges: ["Web", "移动端", "桌面端"],
  },
  obsidian: {
    categoryId: "product-efficiency-collaboration",
    referenceBadges: ["品牌表达"],
    capabilityBadges: [],
    platformBadges: ["桌面端"],
  },
  typefully: {
    categoryId: "product-content-creation",
    referenceBadges: ["增长机制", "信息架构"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  substack: {
    categoryId: "product-content-creation",
    referenceBadges: ["增长机制", "信息架构"],
    capabilityBadges: ["社区"],
    platformBadges: ["Web"],
  },
  kit: {
    categoryId: "product-content-creation",
    referenceBadges: ["增长机制", "信息架构", "定价设计"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  gumroad: {
    categoryId: "product-content-creation",
    referenceBadges: ["Onboarding", "增长机制"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  beehiiv: {
    categoryId: "product-content-creation",
    referenceBadges: ["增长机制", "信息架构", "定价设计"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  canva: {
    categoryId: "product-content-creation",
    referenceBadges: ["信息架构", "增长机制"],
    capabilityBadges: ["多媒体", "协作"],
    platformBadges: ["Web"],
  },
  descript: {
    categoryId: "product-multimedia",
    referenceBadges: ["首页设计", "定价设计", "结果页"],
    capabilityBadges: ["多媒体", "AI Native"],
    platformBadges: ["桌面端"],
  },
  riverside: {
    categoryId: "product-multimedia",
    referenceBadges: ["首页设计", "定价设计"],
    capabilityBadges: ["多媒体"],
    platformBadges: ["Web"],
  },
  runwayml: {
    categoryId: "product-multimedia",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: ["多媒体", "AI Native"],
    platformBadges: ["Web"],
  },
  elevenlabs: {
    categoryId: "product-multimedia",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: ["多媒体", "AI Native"],
    platformBadges: ["Web"],
  },
  dub: {
    categoryId: "product-marketing-growth",
    referenceBadges: ["增长机制", "信息架构"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  mercury: {
    categoryId: "product-business-finance",
    referenceBadges: ["首页设计", "Onboarding"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  midday: {
    categoryId: "product-business-finance",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: [],
    platformBadges: ["Web"],
  },
  oura: {
    categoryId: "product-health-lifestyle",
    referenceBadges: ["首页设计", "品牌表达"],
    capabilityBadges: [],
    platformBadges: ["移动端"],
  },
}

function uniqueAllowedBadges(values: string[] | null | undefined, allowed: Set<string>) {
  const seen = new Set<string>()

  return (values ?? []).filter((value) => {
    if (!allowed.has(value) || seen.has(value)) {
      return false
    }

    seen.add(value)
    return true
  })
}

function getVibeProductCategoryById(categoryId: string | null | undefined) {
  if (!categoryId) {
    return null
  }

  return categoryById.get(categoryId) ?? null
}

function getVibeProductCategoryByName(categoryName: string | null | undefined) {
  if (!categoryName) {
    return null
  }

  return categoryByName.get(categoryName) ?? null
}

export function getCanonicalVibeProductCategoryId({
  slug,
  categoryId,
  categoryName,
}: {
  slug?: string | null
  categoryId?: string | null
  categoryName?: string | null
}) {
  if (categoryId && getVibeProductCategoryById(categoryId)) {
    return categoryId
  }

  if (categoryName && getVibeProductCategoryByName(categoryName)) {
    return getVibeProductCategoryByName(categoryName)?.id ?? null
  }

  if (slug && vibeProductProfilesBySlug[slug]) {
    return vibeProductProfilesBySlug[slug].categoryId
  }

  return null
}

export function getVibeProductPresentation({
  slug,
  categoryId,
  categoryName,
  referenceBadges,
  capabilityBadges,
  platformBadges,
}: {
  slug?: string | null
  categoryId?: string | null
  categoryName?: string | null
  referenceBadges?: string[] | null
  capabilityBadges?: string[] | null
  platformBadges?: string[] | null
}) {
  const profile = slug ? vibeProductProfilesBySlug[slug] ?? null : null
  const category =
    getVibeProductCategoryById(categoryId) ??
    getVibeProductCategoryByName(categoryName) ??
    (profile ? getVibeProductCategoryById(profile.categoryId) : null) ??
    categoryById.get(defaultVibeProductCategoryId)!

  return {
    category,
    referenceBadges: uniqueAllowedBadges(profile?.referenceBadges ?? referenceBadges, allowedReferenceBadges),
    capabilityBadges: uniqueAllowedBadges(profile?.capabilityBadges ?? capabilityBadges, allowedCapabilityBadges),
    platformBadges: uniqueAllowedBadges(profile?.platformBadges ?? platformBadges, allowedPlatformBadges),
  }
}
