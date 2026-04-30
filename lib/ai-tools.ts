import { fallbackCategories, fallbackTools, getFallbackToolBySlug } from "@/lib/data"
import { curatedCategorySortOrders, curatedExtraTools, curatedToolOverrides } from "@/lib/tool-overrides"
import { getVibeProductPresentation } from "@/lib/vibe-product-categories"
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

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
  sortScore: number
  weeklyViews: number
  isHot: boolean
  isNew: boolean
  isEditorial: boolean
  referenceBadges: string[]
  capabilityBadges: string[]
  platformBadges: string[]
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

type SupabasePublicClient = SupabaseClient

type SupabasePublicConfig = {
  url: string
  publishableKey: string
}

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
  sort_score?: number | null
  created_at?: string | null
  user_id?: string | null
  reference_badges?: string[] | null
  capability_badges?: string[] | null
  platform_badges?: string[] | null
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

const SUPABASE_URL_ENV_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const
const SUPABASE_PUBLISHABLE_KEY_ENV_KEYS = [
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const

const vibeToolCategoryOrder = [
  "设计与原型",
  "界面生成",
  "AI 编程智能体",
  "全栈应用构建",
  "数据后端",
  "自动化流程",
  "部署发布",
]

const vibeToolCategoryRank = new Map(vibeToolCategoryOrder.map((name, index) => [name, index]))

export const CHANNELS: Record<ChannelType, ChannelConfig> = {
  "vibe-tools": {
    id: "vibe-tools",
    href: "/vibe-tools",
    navLabel: "工具箱",
    title: "工具箱",
    description: "实用工具箱，让效率触手可及",
    eyebrow: "Build With The Right Stack",
  },
  "vibe-products": {
    id: "vibe-products",
    href: "/vibe-products",
    navLabel: "灵感库",
    title: "灵感库",
    description: "灵感收藏夹，为创意续航充电",
    eyebrow: "See What Others Have Built",
  },
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

function readServerEnv(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()

    if (value) {
      return value
    }
  }

  return null
}

function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = readServerEnv(SUPABASE_URL_ENV_KEYS)
  const publishableKey = readServerEnv(SUPABASE_PUBLISHABLE_KEY_ENV_KEYS)

  if (!url || !publishableKey) {
    return null
  }

  return { url, publishableKey }
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

function sortBySortScore(a: ToolSummary, b: ToolSummary) {
  if (b.sortScore !== a.sortScore) {
    return b.sortScore - a.sortScore
  }

  return 0
}

function sortByWeeklyViews(a: ToolSummary, b: ToolSummary) {
  const scoreDifference = sortBySortScore(a, b)

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  if (b.weeklyViews !== a.weeklyViews) {
    return b.weeklyViews - a.weeklyViews
  }

  return sortByPublishedDate(a, b)
}

function sortByFeaturedPriority(a: ToolSummary, b: ToolSummary) {
  const scoreDifference = sortBySortScore(a, b)

  if (scoreDifference !== 0) {
    return scoreDifference
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
  const scoreDifference = sortBySortScore(a, b)

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  if (b.weeklyViews !== a.weeklyViews) {
    return b.weeklyViews - a.weeklyViews
  }

  const rankDifference = getCategorySortRank(categoryName, a.slug) - getCategorySortRank(categoryName, b.slug)

  if (rankDifference !== 0) {
    return rankDifference
  }

  return sortByPublishedDate(a, b)
}

function sortCategoriesByWorkflow(channelType: ChannelType, categories: ToolCategory[]) {
  if (channelType !== "vibe-tools") {
    return categories
  }

  return [...categories].sort((a, b) => {
    const aRank = vibeToolCategoryRank.get(a.name) ?? Number.MAX_SAFE_INTEGER
    const bRank = vibeToolCategoryRank.get(b.name) ?? Number.MAX_SAFE_INTEGER

    if (aRank !== bRank) {
      return aRank - bRank
    }

    return a.name.localeCompare(b.name, "zh-CN")
  })
}

function dedupeBySlug<T extends { slug: string }>(items: T[]) {
  return items.filter((item, index, self) => index === self.findIndex((candidate) => candidate.slug === item.slug))
}

function normalizeCategoryName(name: string) {
  if (name === "AI IDE" || name === "AI 编程环境") {
    return "AI 编程智能体"
  }

  if (name === "灵感原型") {
    return "设计与原型"
  }

  if (name === "页面生成") {
    return "界面生成"
  }

  if (name === "全栈构建") {
    return "全栈应用构建"
  }

  return name
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

function getFallbackToolBadges(tool: (typeof fallbackTools)[number]) {
  const fallbackTool = tool as {
    referenceBadges?: readonly string[]
    capabilityBadges?: readonly string[]
    platformBadges?: readonly string[]
  }

  return {
    referenceBadges: fallbackTool.referenceBadges ? [...fallbackTool.referenceBadges] : [],
    capabilityBadges: fallbackTool.capabilityBadges ? [...fallbackTool.capabilityBadges] : [],
    platformBadges: fallbackTool.platformBadges ? [...fallbackTool.platformBadges] : [],
  }
}

function buildCategoryMap(categories: ToolCategory[]) {
  return new Map(categories.map((category) => [category.id, category]))
}

function buildRawCategoryNameMap(categories: RawCategoryRow[]) {
  return new Map(categories.map((category) => [category.id, normalizeCategoryName(category.name)]))
}

function mapToolRecord(
  record: {
    id: string
    name: string
    slug: string
    description: string
    logo?: string | null
    categoryId: string
    categoryName?: string | null
    channelType: ChannelType
    publishedAt?: string | null
    sortScore?: number | null
    weeklyViews?: number
    isEditorial?: boolean
    referenceBadges?: string[] | null
    capabilityBadges?: string[] | null
    platformBadges?: string[] | null
  },
  categoryMap: Map<string, ToolCategory>
): ToolSummary {
  const vibeProductPresentation =
    record.channelType === "vibe-products"
      ? getVibeProductPresentation({
          slug: record.slug,
          categoryId: record.categoryId,
          categoryName: record.categoryName,
          referenceBadges: record.referenceBadges,
          capabilityBadges: record.capabilityBadges,
          platformBadges: record.platformBadges,
        })
      : null
  const category = categoryMap.get(record.categoryId) ?? vibeProductPresentation?.category
  const publishedAt = record.publishedAt ?? null
  const sortScore = record.sortScore ?? 0
  const weeklyViews = record.weeklyViews ?? 0
  const isEditorial = record.isEditorial ?? false

  return applyCuratedSummaryOverride({
    id: record.id,
    name: record.name,
    slug: record.slug,
    description: record.description,
    logo: record.logo || "/placeholder.svg",
    category: category?.name || "未分类",
    categoryId: category?.id || record.categoryId,
    channelType: record.channelType,
    publishedAt,
    sortScore,
    weeklyViews,
    isHot: weeklyViews > 0,
    isNew: !isEditorial && isWithinRecentWindow(publishedAt),
    isEditorial,
    referenceBadges: vibeProductPresentation?.referenceBadges ?? [],
    capabilityBadges: vibeProductPresentation?.capabilityBadges ?? [],
    platformBadges: vibeProductPresentation?.platformBadges ?? [],
  })
}

function buildChannelPageData(channelType: ChannelType, categories: ToolCategory[], tools: ToolSummary[]): ChannelPageData {
  const scopedCategories = sortCategoriesByWorkflow(
    channelType,
    categories.filter((category) => category.channelType === channelType)
  )
  const scopedTools = tools.filter((tool) => tool.channelType === channelType)

  const weeklyNewTools = [...scopedTools].filter((tool) => tool.isNew).sort(sortByFeaturedPriority).slice(0, FEATURED_LIMIT)
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

function buildEmptyChannelPageData(channelType: ChannelType): ChannelPageData {
  return {
    channel: getChannelConfig(channelType),
    categories: [],
    weeklyNewTools: [],
    hotTools: [],
    toolsByCategory: {},
  }
}

function getChannelToolCount(data: ChannelPageData) {
  return Object.values(data.toolsByCategory).reduce((sum, tools) => sum + tools.length, 0)
}

function buildFallbackChannelPageData(channelType: ChannelType): ChannelPageData {
  const categories = fallbackCategories.map(mapFallbackCategory)
  const categoryMap = buildCategoryMap(categories)
  const tools = fallbackTools
    .filter((tool) => normalizeChannelType(tool.channelType) === channelType)
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
          ...getFallbackToolBadges(tool),
        },
        categoryMap
      )
    )

  return buildChannelPageData(channelType, categories, tools)
}

async function getViewCountMap(supabase: SupabasePublicClient, toolIds: string[]) {
  const viewCounts = new Map<string, number>()

  if (toolIds.length === 0) {
    return viewCounts
  }

  const { data, error } = await supabase
    .from("tool_views")
    .select("tool_id, viewed_at")
    .in("tool_id", toolIds)
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
  supabase: SupabasePublicClient,
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
  const rawCategoryNameById = buildRawCategoryNameMap(rawCategories)
  const categories = rawCategories.map((row) => mapCategoryRow(row, channelType))

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
        sort_score,
        published_at,
        created_at,
        user_id,
        reference_badges,
        capability_badges,
        platform_badges
      `
    )
    .eq("channel_type", channelType)
    .eq("status", "published")
    .order("sort_score", { ascending: false })
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
        categoryId: tool.category_id,
        categoryName: rawCategoryNameById.get(tool.category_id) ?? null,
        channelType: normalizeChannelType(tool.channel_type),
        publishedAt: tool.published_at || tool.created_at || null,
        sortScore: tool.sort_score ?? 0,
        weeklyViews: viewCountMap.get(tool.id) ?? 0,
        isEditorial: !tool.user_id,
        referenceBadges: tool.reference_badges,
        capabilityBadges: tool.capability_badges,
        platformBadges: tool.platform_badges,
      },
      categoryMap
    )
  )

  if (categories.length === 0) {
    return null
  }

  return buildChannelPageData(channelType, categories, tools)
}

async function fetchLegacyChannelPageData(
  supabase: SupabasePublicClient,
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

  return buildChannelPageData("vibe-tools", categories, tools)
}

async function fetchNewSchemaToolDetail(supabase: SupabasePublicClient, slug: string): Promise<ToolDetail | null> {
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
        sort_score,
        published_at,
        created_at,
        user_id,
        reference_badges,
        capability_badges,
        platform_badges
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

  const category = categoryResponse.data
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
      categoryName: category.name,
      channelType,
      publishedAt: tool.published_at || tool.created_at || null,
      sortScore: tool.sort_score ?? 0,
      weeklyViews: 0,
      isEditorial: !tool.user_id,
      referenceBadges: tool.reference_badges,
      capabilityBadges: tool.capability_badges,
      platformBadges: tool.platform_badges,
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

async function fetchLegacyToolDetail(supabase: SupabasePublicClient, slug: string): Promise<ToolDetail | null> {
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
      ...getFallbackToolBadges(fallbackTool),
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

async function fetchAllSearchableToolsFromNewSchema(supabase: SupabasePublicClient): Promise<SearchableTool[] | null> {
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
        status,
        sort_score,
        published_at
      `
    )
    .eq("status", "published")
    .order("sort_score", { ascending: false })
    .order("published_at", { ascending: false })

  if (error || !data) {
    return null
  }

  const categoryResponse = await supabase.from("tool_categories").select("id, name, icon, channel_type")
  const rawCategories = (categoryResponse.data as RawCategoryRow[] | null) ?? []
  const rawCategoryNameById = buildRawCategoryNameMap(rawCategories)

  const categoryMap = buildCategoryMap(
    rawCategories.map((row) => mapCategoryRow(row, normalizeChannelType(row.channel_type)))
  )

  return dedupeBySlug(
    (data as RawToolRow[]).map((tool) => {
      const channelType = normalizeChannelType(tool.channel_type)
      const fallbackPresentation =
        channelType === "vibe-products"
          ? getVibeProductPresentation({
              slug: tool.slug,
              categoryId: tool.category_id,
              categoryName: rawCategoryNameById.get(tool.category_id) ?? null,
            })
          : null
      const category = categoryMap.get(tool.category_id) ?? fallbackPresentation?.category

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
    })
  )
}

async function fetchAllSearchableToolsFromLegacy(supabase: SupabasePublicClient): Promise<SearchableTool[] | null> {
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

  return dedupeBySlug(
    (data as RawToolRow[]).map((tool) =>
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
    )
  )
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

function fillMissingSearchChannelsWithFallback(tools: SearchableTool[]) {
  const fallbackTools = buildFallbackSearchableTools()
  const hasVibeTools = tools.some((tool) => tool.channelType === "vibe-tools")
  const hasVibeProducts = tools.some((tool) => tool.channelType === "vibe-products")
  const fallbackChannels = new Set<ChannelType>()

  if (!hasVibeTools) {
    fallbackChannels.add("vibe-tools")
  }

  if (!hasVibeProducts) {
    fallbackChannels.add("vibe-products")
  }

  if (fallbackChannels.size === 0) {
    return dedupeBySlug(tools)
  }

  return dedupeBySlug([...tools, ...fallbackTools.filter((tool) => fallbackChannels.has(tool.channelType))])
}

function createPublicDataClient(config: SupabasePublicConfig) {
  return createSupabaseClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function loadChannelPageData(channelType: ChannelType): Promise<ChannelPageData> {
  const supabaseConfig = getSupabasePublicConfig()

  if (!supabaseConfig) {
    return buildFallbackChannelPageData(channelType)
  }

  const supabase = createPublicDataClient(supabaseConfig)
  const nextData = await fetchNewSchemaChannelPageData(supabase, channelType)

  if (nextData && getChannelToolCount(nextData) > 0) {
    return nextData
  }

  const legacyData = await fetchLegacyChannelPageData(supabase, channelType)

  if (legacyData && getChannelToolCount(legacyData) > 0) {
    return legacyData
  }

  return buildFallbackChannelPageData(channelType)
}

const getCachedChannelPageData = unstable_cache(
  loadChannelPageData,
  ["channel-page-data"],
  { revalidate: 60 }
)

export async function getChannelPageData(channelType: ChannelType): Promise<ChannelPageData> {
  return getCachedChannelPageData(channelType)
}

async function loadSearchableTools(): Promise<SearchableTool[]> {
  const supabaseConfig = getSupabasePublicConfig()

  if (!supabaseConfig) {
    return buildFallbackSearchableTools()
  }

  const supabase = createPublicDataClient(supabaseConfig)
  const nextTools = await fetchAllSearchableToolsFromNewSchema(supabase)

  if (nextTools && nextTools.length > 0) {
    return fillMissingSearchChannelsWithFallback(nextTools)
  }

  const legacyTools = await fetchAllSearchableToolsFromLegacy(supabase)

  if (legacyTools && legacyTools.length > 0) {
    return fillMissingSearchChannelsWithFallback(legacyTools)
  }

  return buildFallbackSearchableTools()
}

const getCachedSearchableTools = unstable_cache(
  loadSearchableTools,
  ["searchable-tools"],
  { revalidate: 300 }
)

export async function getSearchableTools(): Promise<SearchableTool[]> {
  return getCachedSearchableTools()
}

async function loadToolDetailBySlug(slug: string): Promise<ToolDetail | null> {
  const normalizedSlug = normalizeSlugParam(slug)
  const supabaseConfig = getSupabasePublicConfig()

  if (!supabaseConfig) {
    return buildFallbackToolDetail(normalizedSlug)
  }

  const supabase = createPublicDataClient(supabaseConfig)
  const nextTool = await fetchNewSchemaToolDetail(supabase, normalizedSlug)

  if (nextTool) {
    return nextTool
  }

  const legacyTool = await fetchLegacyToolDetail(supabase, normalizedSlug)

  if (legacyTool) {
    return legacyTool
  }

  return buildFallbackToolDetail(normalizedSlug)
}

const getCachedToolDetailBySlug = unstable_cache(
  loadToolDetailBySlug,
  ["tool-detail"],
  { revalidate: 60 }
)

export async function getToolDetailBySlug(slug: string): Promise<ToolDetail | null> {
  return getCachedToolDetailBySlug(slug)
}
