import { fallbackCategories, fallbackTools, getFallbackToolBySlug } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { curatedCategorySortOrders, curatedExtraTools, curatedToolOverrides } from "@/lib/tool-overrides"
import { hasSupabaseEnv } from "@/lib/utils"

export type ChannelType = "vibe-tools" | "vibe-products"

export type ChannelConfig = {
  id: ChannelType
  href: string
  navLabel: string
  title: string
  description: string
  eyebrow: string
}

export type ToolCategory = {
  id: string
  name: string
  icon: string
  channelType: ChannelType
}

export type ToolSummary = {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  category: string
  categoryId: string
  channelType: ChannelType
  publishedAt: string | null
  weeklyViews: number
  isHot: boolean
  isNew: boolean
  isEditorial: boolean
}

export type ToolDetail = ToolSummary & {
  fullDescription: string
  websiteUrl: string | null
  previewImageUrl: string | null
  channelLabel: string
  channelHref: string
}

export type SearchableTool = {
  id: string
  name: string
  slug: string
  description: string
  category: string
  channelLabel: string
  channelType: ChannelType
  logo: string
}

export type ChannelPageData = {
  channel: ChannelConfig
  categories: ToolCategory[]
  weeklyNewTools: ToolSummary[]
  hotTools: ToolSummary[]
  toolsByCategory: Record<string, ToolSummary[]>
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type RawCategoryRow = {
  id: string
  name: string
  icon: string | null
  channel_type?: string | null
}

type RawToolRow = {
  id: string
  name: string
  slug: string
  description: string
  full_description: string | null
  website_url: string | null
  logo_url: string | null
  preview_image_url: string | null
  category_id: string
  channel_type?: string | null
  status?: string | null
  published_at?: string | null
  created_at?: string | null
  user_id?: string | null
}

type RawLegacyToolRow = {
  id: string
  name: string
  slug: string
  description: string
  full_description: string | null
  website_url: string | null
  logo_url: string | null
  preview_image_url: string | null
  category_id: string
  created_at: string | null
}

const FEATURED_LIMIT = 6
const RECENT_DAYS = 7

export const CHANNELS: Record<ChannelType, ChannelConfig> = {
  "vibe-tools": {
    id: "vibe-tools",
    href: "/vibe-tools",
    navLabel: "Vibe 工具",
    title: "Vibe 工具",
    description: "聚合搭建产品时真正会用到的基础设施、平台与工作流工具，帮你更快开始，也更稳推进。",
    eyebrow: "Build With The Right Stack",
  },
  "vibe-products": {
    id: "vibe-products",
    href: "/vibe-products",
    navLabel: "Vibe 产品",
    title: "Vibe 产品",
    description: "这里不是基础工具榜单，而是看别人已经做出了什么产品，并从中拆界面、交互、结构、转化和品牌灵感。",
    eyebrow: "See What Others Have Built",
  },
}

const VIBE_PRODUCT_CATEGORY_OVERRIDES: Record<string, string> = {
  linear: "product-interface",
  raycast: "product-interface",
  notion: "product-interface",
  granola: "product-interface",
  arc: "product-interface",
}

const CANONICAL_VIBE_PRODUCT_CATEGORY_NAME_MAP: Record<string, string> = {
  "界面表现": "product-interface",
  "交互体验": "product-interaction",
  "产品结构": "product-structure",
  "商业转化": "product-conversion",
  "增长运营": "product-growth",
  "品牌表达": "product-brand",
}

const LEGACY_VIBE_PRODUCT_CATEGORY_NAME_MAP: Record<string, string> = {
  "AI Web 应用": "product-structure",
  "SaaS 产品": "product-structure",
  "作品集": "product-brand",
  "内容工具": "product-structure",
  "导航站": "product-growth",
  "效率产品": "product-interaction",
  "社区平台": "product-growth",
  "落地页": "product-conversion",
}

function normalizeSlugParam(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

function normalizeChannelType(value: string | null | undefined): ChannelType {
  return value === "vibe-products" ? "vibe-products" : "vibe-tools"
}

function getChannelConfig(channelType: ChannelType) {
  return CHANNELS[channelType]
}

function getChannelLabel(channelType: ChannelType) {
  return getChannelConfig(channelType).navLabel
}

function getRecentThresholdDate() {
  const date = new Date()
  date.setDate(date.getDate() - RECENT_DAYS)
  return date
}

function isWithinRecentWindow(dateString: string | null | undefined) {
  if (!dateString) {
    return false
  }

  const date = new Date(dateString)
  return !Number.isNaN(date.getTime()) && date >= getRecentThresholdDate()
}

function looksLikeGarbledText(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return /\?{3,}/.test(value) || value.includes("�")
}

function buildGeneratedToolDetailMarkdown({
  name,
  description,
  category,
  websiteUrl,
}: {
  name: string
  description: string
  category: string
  websiteUrl?: string | null
}) {
  const sections = [
    `# ${name}`,
    "",
    description,
    "",
    "## 定位",
    `- 所属分类：${category}`,
    `- 适合在 ${category} 相关场景里快速了解、评估和上手。`,
    "",
    "## 适合谁",
    "- 想快速搭建产品、验证想法或补齐工作流的人。",
    "- 希望先看清工具定位，再决定是否深度接入的人。",
  ]

  if (websiteUrl) {
    sections.push("", "## 官网", `- ${websiteUrl}`)
  }

  return sections.join("\n")
}

function sortByPublishedDate(a: ToolSummary, b: ToolSummary) {
  return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
}

function sortByWeeklyViews(a: ToolSummary, b: ToolSummary) {
  if (b.weeklyViews !== a.weeklyViews) {
    return b.weeklyViews - a.weeklyViews
  }

  return sortByPublishedDate(a, b)
}

function getCategorySortRank(categoryName: string, slug: string) {
  const categoryOrder = curatedCategorySortOrders[categoryName]

  if (!categoryOrder) {
    return Number.MAX_SAFE_INTEGER
  }

  const index = categoryOrder.indexOf(slug)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function sortByCategoryPopularity(categoryName: string, a: ToolSummary, b: ToolSummary) {
  if (b.weeklyViews !== a.weeklyViews) {
    return b.weeklyViews - a.weeklyViews
  }

  const rankDifference = getCategorySortRank(categoryName, a.slug) - getCategorySortRank(categoryName, b.slug)

  if (rankDifference !== 0) {
    return rankDifference
  }

  return sortByPublishedDate(a, b)
}

function dedupeBySlug<T extends { slug: string }>(items: T[]) {
  return items.filter((item, index, self) => index === self.findIndex((candidate) => candidate.slug === item.slug))
}

function normalizeCategoryName(name: string) {
  return name === "AI IDE" ? "AI 编程环境" : name
}

function getCuratedOverride(slug: string) {
  return curatedToolOverrides[slug] ?? null
}

function applyCuratedSummaryOverride<T extends { slug: string; name: string; description: string }>(tool: T): T {
  const override = getCuratedOverride(tool.slug)

  if (!override) {
    return tool
  }

  return {
    ...tool,
    name: override.name ?? tool.name,
    description: override.description,
  }
}

function applyCuratedDetailOverride<T extends ToolDetail>(tool: T): T {
  const override = getCuratedOverride(tool.slug)

  if (!override) {
    return tool
  }

  const fullDescription =
    override.fullDescription ??
    (looksLikeGarbledText(tool.fullDescription)
      ? buildGeneratedToolDetailMarkdown({
          name: override.name ?? tool.name,
          description: override.description,
          category: tool.category,
          websiteUrl: override.websiteUrl ?? tool.websiteUrl,
        })
      : tool.fullDescription ?? override.description)

  return {
    ...tool,
    name: override.name ?? tool.name,
    description: override.description,
    fullDescription,
    websiteUrl: override.websiteUrl ?? tool.websiteUrl,
  }
}

function buildCuratedExtraToolSummaries(channelType: ChannelType, categories: ToolCategory[]) {
  const categoryByName = new Map(categories.map((category) => [category.name, category]))
  const categoryMap = buildCategoryMap(categories)

  return curatedExtraTools
    .filter((tool) => tool.channelType === channelType)
    .map((tool) => {
      const category = categoryByName.get(tool.categoryName)

      if (!category) {
        return null
      }

      return mapToolRecord(
        {
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          logo: tool.logo,
          categoryId: category.id,
          channelType: tool.channelType,
          publishedAt: tool.publishedAt,
          weeklyViews: tool.weeklyViews,
          isEditorial: true,
        },
        categoryMap
      )
    })
    .filter((tool): tool is ToolSummary => tool !== null)
    .map(applyCuratedSummaryOverride)
}

function mergeCuratedTools(channelType: ChannelType, categories: ToolCategory[], tools: ToolSummary[]) {
  return dedupeBySlug([
    ...tools.map(applyCuratedSummaryOverride),
    ...buildCuratedExtraToolSummaries(channelType, categories),
  ])
}

function buildCuratedExtraToolDetail(slug: string): ToolDetail | null {
  const extraTool = curatedExtraTools.find((tool) => tool.slug === slug)

  if (!extraTool) {
    return null
  }

  const category =
    fallbackCategories.find(
      (item) => normalizeChannelType(item.channelType) === extraTool.channelType && item.name === extraTool.categoryName
    ) ?? fallbackCategories.find((item) => normalizeChannelType(item.channelType) === extraTool.channelType)

  const mappedCategory = category
    ? mapFallbackCategory(category)
    : {
        id: extraTool.categoryName,
        name: extraTool.categoryName,
        icon: "",
        channelType: extraTool.channelType,
      }

  const summary = mapToolRecord(
    {
      id: extraTool.id,
      name: extraTool.name,
      slug: extraTool.slug,
      description: extraTool.description,
      logo: extraTool.logo,
      categoryId: mappedCategory.id,
      channelType: extraTool.channelType,
      publishedAt: extraTool.publishedAt,
      weeklyViews: extraTool.weeklyViews,
      isEditorial: true,
    },
    buildCategoryMap([mappedCategory])
  )

  return applyCuratedDetailOverride({
    ...summary,
    fullDescription: extraTool.fullDescription,
    websiteUrl: extraTool.websiteUrl,
    previewImageUrl: extraTool.previewImageUrl,
    channelLabel: getChannelLabel(extraTool.channelType),
    channelHref: getChannelConfig(extraTool.channelType).href,
  })
}

function mapCategoryRow(row: RawCategoryRow, defaultChannelType: ChannelType): ToolCategory {
  return {
    id: row.id,
    name: normalizeCategoryName(row.name),
    icon: row.icon || "",
    channelType: normalizeChannelType(row.channel_type ?? defaultChannelType),
  }
}

function mapFallbackCategory(row: (typeof fallbackCategories)[number]): ToolCategory {
  return {
    id: row.id,
    name: normalizeCategoryName(row.name),
    icon: row.icon,
    channelType: normalizeChannelType(row.channelType),
  }
}

function buildCategoryMap(categories: ToolCategory[]) {
  return new Map(categories.map((category) => [category.id, category]))
}

function getCanonicalVibeProductCategories() {
  return fallbackCategories
    .filter((category) => normalizeChannelType(category.channelType) === "vibe-products")
    .map(mapFallbackCategory)
}

function resolveVibeProductCategoryId(
  slug: string,
  categoryId: string,
  rawCategoryMap: Map<string, RawCategoryRow>
) {
  const slugOverride = VIBE_PRODUCT_CATEGORY_OVERRIDES[slug]

  if (slugOverride) {
    return slugOverride
  }

  const rawCategory = rawCategoryMap.get(categoryId)

  if (!rawCategory) {
    return "product-structure"
  }

  const canonicalCategory = CANONICAL_VIBE_PRODUCT_CATEGORY_NAME_MAP[rawCategory.name]

  if (canonicalCategory) {
    return canonicalCategory
  }

  return LEGACY_VIBE_PRODUCT_CATEGORY_NAME_MAP[rawCategory.name] ?? "product-structure"
}

function mapToolRecord(
  record: {
    id: string
    name: string
    slug: string
    description: string
    logo?: string | null
    categoryId: string
    channelType: ChannelType
    publishedAt?: string | null
    weeklyViews?: number
    isEditorial?: boolean
  },
  categoryMap: Map<string, ToolCategory>
): ToolSummary {
  const category = categoryMap.get(record.categoryId)
  const publishedAt = record.publishedAt ?? null
  const weeklyViews = record.weeklyViews ?? 0
  const isEditorial = record.isEditorial ?? false

  return applyCuratedSummaryOverride({
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    logo: record.logo || "/placeholder.svg",
    category: category?.name || "未分类",
    categoryId: record.categoryId,
    channelType: record.channelType,
    publishedAt,
    weeklyViews,
    isHot: weeklyViews > 0,
    isNew: !isEditorial && isWithinRecentWindow(publishedAt),
    isEditorial,
  })
}

function buildChannelPageData(channelType: ChannelType, categories: ToolCategory[], tools: ToolSummary[]): ChannelPageData {
  const scopedCategories = categories.filter((category) => category.channelType === channelType)
  const scopedTools = tools.filter((tool) => tool.channelType === channelType)

  const weeklyNewTools = [...scopedTools].filter((tool) => tool.isNew).sort(sortByPublishedDate).slice(0, FEATURED_LIMIT)
  const hotTools = [...scopedTools].sort(sortByWeeklyViews).slice(0, FEATURED_LIMIT)

  const toolsByCategory = scopedCategories.reduce<Record<string, ToolSummary[]>>((acc, category) => {
    acc[category.id] = scopedTools
      .filter((tool) => tool.categoryId === category.id)
      .sort((a, b) => sortByCategoryPopularity(category.name, a, b))
    return acc
  }, {})

  return {
    channel: getChannelConfig(channelType),
    categories: scopedCategories,
    weeklyNewTools,
    hotTools,
    toolsByCategory,
  }
}

function buildFallbackChannelPageData(channelType: ChannelType): ChannelPageData {
  const categories = fallbackCategories
    .filter((category) => normalizeChannelType(category.channelType) === channelType)
    .map(mapFallbackCategory)
  const categoryMap = buildCategoryMap(categories)

  const tools = fallbackTools
    .filter((tool) => normalizeChannelType(tool.channelType) === channelType && tool.status === "published")
    .map((tool) =>
      mapToolRecord(
        {
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          logo: tool.logo,
          categoryId: tool.categoryId,
          channelType: normalizeChannelType(tool.channelType),
          publishedAt: tool.publishedAt,
          weeklyViews: tool.weeklyViews,
          isEditorial: true,
        },
        categoryMap
      )
    )

  return buildChannelPageData(channelType, categories, mergeCuratedTools(channelType, categories, tools))
}

async function getViewCountMap(supabase: SupabaseServerClient, toolIds: string[]) {
  const viewCounts = new Map<string, number>()

  if (toolIds.length === 0) {
    return viewCounts
  }

  const { data, error } = await supabase
    .from("tool_views")
    .select("tool_id, viewed_at")
    .gte("viewed_at", getRecentThresholdDate().toISOString())

  if (error || !data) {
    return viewCounts
  }

  const validIds = new Set(toolIds)

  ;(data as { tool_id: string }[]).forEach((row) => {
    if (validIds.has(row.tool_id)) {
      viewCounts.set(row.tool_id, (viewCounts.get(row.tool_id) ?? 0) + 1)
    }
  })

  return viewCounts
}

async function fetchNewSchemaChannelPageData(
  supabase: SupabaseServerClient,
  channelType: ChannelType
): Promise<ChannelPageData | null> {
  const { data: categoryData, error: categoryError } = await supabase
    .from("tool_categories")
    .select("id, name, icon, channel_type")
    .eq("channel_type", channelType)
    .order("created_at", { ascending: true })

  if (categoryError || !categoryData) {
    return null
  }

  const rawCategories = categoryData as RawCategoryRow[]
  const rawCategoryMap = new Map(rawCategories.map((row) => [row.id, row]))
  const categories =
    channelType === "vibe-products"
      ? getCanonicalVibeProductCategories()
      : rawCategories.map((row) => mapCategoryRow(row, channelType))

  const { data: toolData, error: toolError } = await supabase
    .from("tools")
    .select(
      `
        id,
        name,
        slug,
        description,
        full_description,
        website_url,
        logo_url,
        preview_image_url,
        category_id,
        channel_type,
        status,
        published_at,
        created_at,
        user_id
      `
    )
    .eq("channel_type", channelType)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (toolError || !toolData) {
    return null
  }

  const categoryMap = buildCategoryMap(categories)
  const toolRows = toolData as RawToolRow[]
  const viewCountMap = await getViewCountMap(
    supabase,
    toolRows.map((tool) => tool.id)
  )

  const tools = toolRows.map((tool) =>
    mapToolRecord(
      {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        logo: tool.logo_url,
        categoryId:
          channelType === "vibe-products"
            ? resolveVibeProductCategoryId(tool.slug, tool.category_id, rawCategoryMap)
            : tool.category_id,
        channelType: normalizeChannelType(tool.channel_type),
        publishedAt: tool.published_at || tool.created_at || null,
        weeklyViews: viewCountMap.get(tool.id) ?? 0,
        isEditorial: !tool.user_id,
      },
      categoryMap
    )
  )

  if (categories.length === 0) {
    return null
  }

  return buildChannelPageData(channelType, categories, mergeCuratedTools(channelType, categories, tools))
}

async function fetchLegacyChannelPageData(
  supabase: SupabaseServerClient,
  channelType: ChannelType
): Promise<ChannelPageData | null> {
  if (channelType !== "vibe-tools") {
    return null
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("tool_categories")
    .select("id, name, icon")
    .order("created_at", { ascending: true })

  const { data: toolData, error: toolError } = await supabase
    .from("ai_tools")
    .select(
      `
        id,
        name,
        slug,
        description,
        full_description,
        website_url,
        logo_url,
        preview_image_url,
        category_id,
        created_at
      `
    )
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (categoryError || toolError || !categoryData || !toolData) {
    return null
  }

  const categories = (categoryData as RawCategoryRow[]).map((row) => mapCategoryRow(row, "vibe-tools"))
  const categoryMap = buildCategoryMap(categories)
  const legacyTools = toolData as RawLegacyToolRow[]
  const viewCountMap = await getViewCountMap(
    supabase,
    legacyTools.map((tool) => tool.id)
  )

  const tools = legacyTools.map((tool) =>
    mapToolRecord(
      {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        logo: tool.logo_url,
        categoryId: tool.category_id,
        channelType: "vibe-tools",
        publishedAt: tool.created_at,
        weeklyViews: viewCountMap.get(tool.id) ?? 0,
        isEditorial: true,
      },
      categoryMap
    )
  )

  return buildChannelPageData("vibe-tools", categories, mergeCuratedTools("vibe-tools", categories, tools))
}

async function fetchNewSchemaToolDetail(supabase: SupabaseServerClient, slug: string): Promise<ToolDetail | null> {
  const { data, error } = await supabase
    .from("tools")
    .select(
      `
        id,
        name,
        slug,
        description,
        full_description,
        website_url,
        logo_url,
        preview_image_url,
        category_id,
        channel_type,
        status,
        published_at,
        created_at,
        user_id
      `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const tool = data as RawToolRow
  const channelType = normalizeChannelType(tool.channel_type)

  const categoryResponse = await supabase
    .from("tool_categories")
    .select("id, name, icon, channel_type")
    .eq("id", tool.category_id)
    .maybeSingle()

  const rawCategoryMap = new Map<string, RawCategoryRow>()
  if (categoryResponse.data) {
    rawCategoryMap.set(tool.category_id, categoryResponse.data as RawCategoryRow)
  }

  const category =
    channelType === "vibe-products"
      ? buildCategoryMap(getCanonicalVibeProductCategories()).get(
          resolveVibeProductCategoryId(tool.slug, tool.category_id, rawCategoryMap)
        ) ?? {
          id: "product-structure",
          name: "产品结构",
          icon: "🧭",
          channelType,
        }
      : categoryResponse.data
        ? mapCategoryRow(categoryResponse.data as RawCategoryRow, channelType)
        : {
            id: tool.category_id,
            name: "未分类",
            icon: "",
            channelType,
          }

  const summary = mapToolRecord(
    {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      logo: tool.logo_url,
      categoryId: category.id,
      channelType,
      publishedAt: tool.published_at || tool.created_at || null,
      weeklyViews: 0,
      isEditorial: !tool.user_id,
    },
    buildCategoryMap([category])
  )

  const viewCountMap = await getViewCountMap(supabase, [tool.id])

  return applyCuratedDetailOverride({
    ...summary,
    weeklyViews: viewCountMap.get(tool.id) ?? 0,
    isHot: (viewCountMap.get(tool.id) ?? 0) > 0,
    fullDescription: tool.full_description || tool.description,
    websiteUrl: tool.website_url,
    previewImageUrl: tool.preview_image_url,
    channelLabel: getChannelLabel(channelType),
    channelHref: getChannelConfig(channelType).href,
  })
}

async function fetchLegacyToolDetail(supabase: SupabaseServerClient, slug: string): Promise<ToolDetail | null> {
  const { data, error } = await supabase
    .from("ai_tools")
    .select(
      `
        id,
        name,
        slug,
        description,
        full_description,
        website_url,
        logo_url,
        preview_image_url,
        category_id,
        created_at
      `
    )
    .eq("slug", slug)
    .eq("is_approved", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const tool = data as RawLegacyToolRow
  const categoryResponse = await supabase.from("tool_categories").select("id, name, icon").eq("id", tool.category_id).maybeSingle()
  const category = categoryResponse.data
    ? mapCategoryRow(categoryResponse.data as RawCategoryRow, "vibe-tools")
    : {
        id: tool.category_id,
        name: "未分类",
        icon: "",
        channelType: "vibe-tools" as ChannelType,
      }

  const summary = mapToolRecord(
    {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      logo: tool.logo_url,
      categoryId: tool.category_id,
      channelType: "vibe-tools",
      publishedAt: tool.created_at,
      weeklyViews: 0,
      isEditorial: true,
    },
    buildCategoryMap([category])
  )

  const viewCountMap = await getViewCountMap(supabase, [tool.id])

  return applyCuratedDetailOverride({
    ...summary,
    weeklyViews: viewCountMap.get(tool.id) ?? 0,
    isHot: (viewCountMap.get(tool.id) ?? 0) > 0,
    fullDescription: tool.full_description || tool.description,
    websiteUrl: tool.website_url,
    previewImageUrl: tool.preview_image_url,
    channelLabel: getChannelLabel("vibe-tools"),
    channelHref: getChannelConfig("vibe-tools").href,
  })
}

function buildFallbackToolDetail(slug: string): ToolDetail | null {
  const fallbackTool = getFallbackToolBySlug(slug)

  if (!fallbackTool) {
    return null
  }

  const category = fallbackCategories.find((item) => item.id === fallbackTool.categoryId)
  const mappedCategory = category
    ? mapFallbackCategory(category)
    : {
        id: fallbackTool.categoryId,
        name: "未分类",
        icon: "",
        channelType: normalizeChannelType(fallbackTool.channelType),
      }

  const summary = mapToolRecord(
    {
      id: fallbackTool.id,
      name: fallbackTool.name,
      slug: fallbackTool.slug,
      description: fallbackTool.description,
      logo: fallbackTool.logo,
      categoryId: fallbackTool.categoryId,
      channelType: normalizeChannelType(fallbackTool.channelType),
      publishedAt: fallbackTool.publishedAt,
      weeklyViews: fallbackTool.weeklyViews,
      isEditorial: true,
    },
    buildCategoryMap([mappedCategory])
  )

  const channelType = normalizeChannelType(fallbackTool.channelType)

  return applyCuratedDetailOverride({
    ...summary,
    fullDescription: fallbackTool.fullDescription || fallbackTool.description,
    websiteUrl: fallbackTool.websiteUrl || null,
    previewImageUrl: fallbackTool.previewImageUrl || null,
    channelLabel: getChannelLabel(channelType),
    channelHref: getChannelConfig(channelType).href,
  })
}

async function fetchAllSearchableToolsFromNewSchema(supabase: SupabaseServerClient): Promise<SearchableTool[] | null> {
  const { data, error } = await supabase
    .from("tools")
    .select(
      `
        id,
        name,
        slug,
        description,
        logo_url,
        category_id,
        channel_type,
        status
      `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error || !data) {
    return null
  }

  const categoryResponse = await supabase.from("tool_categories").select("id, name, icon, channel_type")
  const rawCategories = (categoryResponse.data as RawCategoryRow[] | null) ?? []
  const rawCategoryMap = new Map(rawCategories.map((row) => [row.id, row]))

  const categoryMap = buildCategoryMap([
    ...rawCategories
      .filter((row) => normalizeChannelType(row.channel_type) === "vibe-tools")
      .map((row) => mapCategoryRow(row, "vibe-tools")),
    ...getCanonicalVibeProductCategories(),
  ])

  return dedupeBySlug([
    ...(data as RawToolRow[]).map((tool) => {
    const channelType = normalizeChannelType(tool.channel_type)
    const displayCategoryId =
      channelType === "vibe-products"
        ? resolveVibeProductCategoryId(tool.slug, tool.category_id, rawCategoryMap)
        : tool.category_id
    const category = categoryMap.get(displayCategoryId)

    return applyCuratedSummaryOverride({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      category: category?.name || "未分类",
      channelLabel: getChannelLabel(channelType),
      channelType,
      logo: tool.logo_url || "/placeholder.svg",
    })
  }),
    ...curatedExtraTools
      .filter((tool) => tool.channelType === "vibe-tools")
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        category: tool.categoryName,
        channelLabel: getChannelLabel(tool.channelType),
        channelType: tool.channelType,
        logo: tool.logo,
      })),
  ])
}

async function fetchAllSearchableToolsFromLegacy(supabase: SupabaseServerClient): Promise<SearchableTool[] | null> {
  const { data, error } = await supabase
    .from("ai_tools")
    .select("id, name, slug, description, logo_url, category_id")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) {
    return null
  }

  const categoryResponse = await supabase.from("tool_categories").select("id, name, icon")
  const categories =
    (categoryResponse.data as RawCategoryRow[] | null)?.map((row) => mapCategoryRow(row, "vibe-tools")) ?? []
  const categoryMap = buildCategoryMap(categories)

  return dedupeBySlug([
    ...(data as RawToolRow[]).map((tool) =>
      applyCuratedSummaryOverride({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        category: categoryMap.get(tool.category_id)?.name || "未分类",
        channelLabel: getChannelLabel("vibe-tools"),
        channelType: "vibe-tools" as ChannelType,
        logo: tool.logo_url || "/placeholder.svg",
      })
    ),
    ...curatedExtraTools
      .filter((tool) => tool.channelType === "vibe-tools")
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        category: tool.categoryName,
        channelLabel: getChannelLabel(tool.channelType),
        channelType: tool.channelType,
        logo: tool.logo,
      })),
  ])
}

function buildFallbackSearchableTools() {
  const categoryMap = buildCategoryMap(fallbackCategories.map(mapFallbackCategory))

  return dedupeBySlug(
    [
      ...fallbackTools.map((tool) =>
        applyCuratedSummaryOverride({
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          category: categoryMap.get(tool.categoryId)?.name || "未分类",
          channelLabel: getChannelLabel(normalizeChannelType(tool.channelType)),
          channelType: normalizeChannelType(tool.channelType),
          logo: tool.logo || "/placeholder.svg",
        })
      ),
      ...curatedExtraTools
        .filter((tool) => tool.channelType === "vibe-tools")
        .map((tool) => ({
          id: tool.id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          category: tool.categoryName,
          channelLabel: getChannelLabel(tool.channelType),
          channelType: tool.channelType,
          logo: tool.logo,
        })),
    ]
  )
}

export async function getChannelPageData(channelType: ChannelType): Promise<ChannelPageData> {
  if (!hasSupabaseEnv) {
    return buildFallbackChannelPageData(channelType)
  }

  const supabase = await createClient()
  const nextData = await fetchNewSchemaChannelPageData(supabase, channelType)

  if (nextData) {
    return nextData
  }

  const legacyData = await fetchLegacyChannelPageData(supabase, channelType)

  if (legacyData) {
    return legacyData
  }

  return buildFallbackChannelPageData(channelType)
}

export async function getSearchableTools(): Promise<SearchableTool[]> {
  if (!hasSupabaseEnv) {
    return buildFallbackSearchableTools()
  }

  const supabase = await createClient()
  const nextTools = await fetchAllSearchableToolsFromNewSchema(supabase)

  if (nextTools && nextTools.length > 0) {
    return dedupeBySlug(nextTools)
  }

  const legacyTools = await fetchAllSearchableToolsFromLegacy(supabase)

  if (legacyTools && legacyTools.length > 0) {
    return dedupeBySlug([...legacyTools, ...buildFallbackSearchableTools()])
  }

  return buildFallbackSearchableTools()
}

export async function getToolDetailBySlug(slug: string): Promise<ToolDetail | null> {
  const normalizedSlug = normalizeSlugParam(slug)

  if (!hasSupabaseEnv) {
    return buildCuratedExtraToolDetail(normalizedSlug) || buildFallbackToolDetail(normalizedSlug)
  }

  const supabase = await createClient()
  const nextTool = await fetchNewSchemaToolDetail(supabase, normalizedSlug)

  if (nextTool) {
    return nextTool
  }

  const legacyTool = await fetchLegacyToolDetail(supabase, normalizedSlug)

  if (legacyTool) {
    return legacyTool
  }

  return buildCuratedExtraToolDetail(normalizedSlug) || buildFallbackToolDetail(normalizedSlug)
}
