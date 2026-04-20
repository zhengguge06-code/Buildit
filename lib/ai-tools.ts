import { createClient } from "@/lib/supabase/server"
import { fallbackCategories, fallbackTools, getFallbackToolBySlug } from "@/lib/data"
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
    description: "聚合搭建产品时真正会用到的基础设施、平台与工作流工具，帮你更快开始，更稳推进。",
    eyebrow: "Build With The Right Stack",
  },
  "vibe-products": {
    id: "vibe-products",
    href: "/vibe-products",
    navLabel: "Vibe 产品",
    title: "Vibe 产品",
    description: "收录值得参考的真实 Vibe Coding 产品与网站，用来找灵感、看表达、看结构。",
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
  if (value === "vibe-products") {
    return "vibe-products"
  }

  return "vibe-tools"
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

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date >= getRecentThresholdDate()
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

function dedupeBySlug<T extends { slug: string }>(items: T[]) {
  return items.filter((item, index, self) => index === self.findIndex((candidate) => candidate.slug === item.slug))
}

function buildCategoryMap(categories: ToolCategory[]) {
  return new Map(categories.map((category) => [category.id, category]))
}

function normalizeCategoryName(name: string) {
  return name === "AI IDE" ? "AI 编程环境" : name
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
  },
  categoryMap: Map<string, ToolCategory>
): ToolSummary {
  const category = categoryMap.get(record.categoryId)
  const publishedAt = record.publishedAt ?? null
  const weeklyViews = record.weeklyViews ?? 0

  return {
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
    isNew: isWithinRecentWindow(publishedAt),
  }
}

function buildChannelPageData(channelType: ChannelType, categories: ToolCategory[], tools: ToolSummary[]): ChannelPageData {
  const sortedCategories = categories.filter((category) => category.channelType === channelType)
  const sortedTools = tools.filter((tool) => tool.channelType === channelType)

  const weeklyNewTools = [...sortedTools].filter((tool) => tool.isNew).sort(sortByPublishedDate).slice(0, FEATURED_LIMIT)
  const hotTools = [...sortedTools].sort(sortByWeeklyViews).slice(0, FEATURED_LIMIT)

  const toolsByCategory = sortedCategories.reduce<Record<string, ToolSummary[]>>((acc, category) => {
    acc[category.id] = sortedTools.filter((tool) => tool.categoryId === category.id).sort(sortByPublishedDate)
    return acc
  }, {})

  return {
    channel: getChannelConfig(channelType),
    categories: sortedCategories,
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
        },
        categoryMap
      )
    )

  return buildChannelPageData(channelType, categories, tools)
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
    if (!validIds.has(row.tool_id)) {
      return
    }

    viewCounts.set(row.tool_id, (viewCounts.get(row.tool_id) ?? 0) + 1)
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

  const categories = (categoryData as RawCategoryRow[]).map((row) => mapCategoryRow(row, channelType))
  const categoryMap = buildCategoryMap(categories)

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
        created_at
      `
    )
    .eq("channel_type", channelType)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (toolError || !toolData) {
    return null
  }

  const toolRows = toolData as RawToolRow[]

  if (categories.length === 0) {
    return null
  }

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
        channelType: normalizeChannelType(tool.channel_type),
        publishedAt: tool.published_at || tool.created_at || null,
        weeklyViews: viewCountMap.get(tool.id) ?? 0,
      },
      categoryMap
    )
  )

  return buildChannelPageData(channelType, categories, tools)
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
  const toolRows = toolData as RawLegacyToolRow[]
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
        channelType: "vibe-tools",
        publishedAt: tool.created_at,
        weeklyViews: viewCountMap.get(tool.id) ?? 0,
      },
      categoryMap
    )
  )

  return buildChannelPageData("vibe-tools", categories, tools)
}

async function fetchNewSchemaToolDetail(
  supabase: SupabaseServerClient,
  slug: string
): Promise<ToolDetail | null> {
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
        created_at
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
      categoryId: tool.category_id,
      channelType,
      publishedAt: tool.published_at || tool.created_at || null,
      weeklyViews: 0,
    },
    buildCategoryMap([category])
  )

  const viewCountMap = await getViewCountMap(supabase, [tool.id])

  return {
    ...summary,
    weeklyViews: viewCountMap.get(tool.id) ?? 0,
    isHot: (viewCountMap.get(tool.id) ?? 0) > 0,
    fullDescription: tool.full_description || tool.description,
    websiteUrl: tool.website_url,
    previewImageUrl: tool.preview_image_url,
    channelLabel: getChannelLabel(channelType),
    channelHref: getChannelConfig(channelType).href,
  }
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
  const categoryResponse = await supabase
    .from("tool_categories")
    .select("id, name, icon")
    .eq("id", tool.category_id)
    .maybeSingle()

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
    },
    buildCategoryMap([category])
  )

  const viewCountMap = await getViewCountMap(supabase, [tool.id])

  return {
    ...summary,
    weeklyViews: viewCountMap.get(tool.id) ?? 0,
    isHot: (viewCountMap.get(tool.id) ?? 0) > 0,
    fullDescription: tool.full_description || tool.description,
    websiteUrl: tool.website_url,
    previewImageUrl: tool.preview_image_url,
    channelLabel: getChannelLabel("vibe-tools"),
    channelHref: getChannelConfig("vibe-tools").href,
  }
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
    },
    buildCategoryMap([mappedCategory])
  )

  const channelType = normalizeChannelType(fallbackTool.channelType)

  return {
    ...summary,
    fullDescription: fallbackTool.fullDescription || fallbackTool.description,
    websiteUrl: fallbackTool.websiteUrl || null,
    previewImageUrl: fallbackTool.previewImageUrl || null,
    channelLabel: getChannelLabel(channelType),
    channelHref: getChannelConfig(channelType).href,
  }
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
  const categories =
    (categoryResponse.data as RawCategoryRow[] | null)?.map((row) =>
      mapCategoryRow(row, normalizeChannelType(row.channel_type))
    ) ?? []
  const categoryMap = buildCategoryMap(categories)

  return (data as RawToolRow[]).map((tool) => {
    const category = categoryMap.get(tool.category_id)
    const channelType = normalizeChannelType(tool.channel_type)

    return {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      category: category?.name || "未分类",
      channelLabel: getChannelLabel(channelType),
      channelType,
      logo: tool.logo_url || "/placeholder.svg",
    }
  })
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

  return (data as RawToolRow[]).map((tool) => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    category: categoryMap.get(tool.category_id)?.name || "未分类",
    channelLabel: getChannelLabel("vibe-tools"),
    channelType: "vibe-tools",
    logo: tool.logo_url || "/placeholder.svg",
  }))
}

function buildFallbackSearchableTools() {
  const categoryMap = buildCategoryMap(fallbackCategories.map(mapFallbackCategory))

  return dedupeBySlug(
    fallbackTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      category: categoryMap.get(tool.categoryId)?.name || "未分类",
      channelLabel: getChannelLabel(normalizeChannelType(tool.channelType)),
      channelType: normalizeChannelType(tool.channelType),
      logo: tool.logo || "/placeholder.svg",
    }))
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
    return buildFallbackToolDetail(normalizedSlug)
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

  return buildFallbackToolDetail(normalizedSlug)
}
