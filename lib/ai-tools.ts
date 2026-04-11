import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/utils"
import {
  categories as fallbackCategories,
  getToolBySlug as getFallbackToolBySlug,
  hotTools as fallbackHotTools,
  newTools as fallbackNewTools,
  toolsByCategory as fallbackToolsByCategory,
} from "@/lib/data"

export type ToolType = "hot" | "new" | null

export type SidebarCategory = {
  id: string
  name: string
  icon: string
}

export type ToolSummary = {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  category: string
  categoryId: string
  type: ToolType
  isHot: boolean
  isNew: boolean
}

export type ToolDetail = ToolSummary & {
  fullDescription: string
  websiteUrl: string | null
  previewImageUrl: string | null
}

export type SearchableTool = {
  id: string
  name: string
  slug: string
  description: string
  category: string
  logo: string
}

type HomePageData = {
  categories: SidebarCategory[]
  hotTools: ToolSummary[]
  newTools: ToolSummary[]
  toolsByCategory: Record<string, ToolSummary[]>
}

type RawCategoryRow = {
  id: string
  name: string
  icon: string | null
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
  type: string | null
  category:
    | {
        id: string
        name: string | null
      }
    | {
        id: string
        name: string | null
      }[]
    | null
}

type LegacyTool = {
  id: string
  name: string
  slug: string
  description: string
  logo?: string
  category: string
  isHot?: boolean
  isNew?: boolean
}

function normalizeSlugParam(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

function normalizeToolType(value: string | null | undefined): ToolType {
  const normalized = value?.trim().toLowerCase()

  if (normalized === "hot") {
    return "hot"
  }

  if (normalized === "new") {
    return "new"
  }

  return null
}

function mapDbTool(tool: RawToolRow): ToolSummary {
  const type = normalizeToolType(tool.type)
  const category = Array.isArray(tool.category) ? tool.category[0] : tool.category

  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    logo: tool.logo_url || "/placeholder.svg",
    category: category?.name || "未分类",
    categoryId: tool.category_id,
    type,
    isHot: type === "hot",
    isNew: type === "new",
  }
}

function mapLegacyTool(tool: LegacyTool): ToolSummary {
  const type: ToolType = tool.isHot ? "hot" : tool.isNew ? "new" : null

  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    logo: tool.logo || "/placeholder.svg",
    category: tool.category,
    categoryId: tool.category,
    type,
    isHot: type === "hot",
    isNew: type === "new",
  }
}

function mapToSearchableTool(tool: ToolSummary): SearchableTool {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    category: tool.category,
    logo: tool.logo,
  }
}

function dedupeTools<T extends { id: string }>(tools: T[]) {
  return tools.filter((tool, index, self) => index === self.findIndex((item) => item.id === tool.id))
}

function buildFallbackHomePageData(): HomePageData {
  const categories = fallbackCategories.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
  }))

  const hotTools = fallbackHotTools.map(mapLegacyTool)
  const newTools = fallbackNewTools.map(mapLegacyTool)

  const toolsByCategory = Object.fromEntries(
    Object.entries(fallbackToolsByCategory).map(([categoryId, tools]) => [
      categoryId,
      (tools as LegacyTool[]).map(mapLegacyTool),
    ])
  )

  return {
    categories,
    hotTools,
    newTools,
    toolsByCategory,
  }
}

export async function getSearchableTools(): Promise<SearchableTool[]> {
  const buildFallbackSearchableTools = () => {
    const fallback = buildFallbackHomePageData()
    const allTools = dedupeTools([
      ...fallback.hotTools,
      ...fallback.newTools,
      ...Object.values(fallback.toolsByCategory).flat(),
    ])

    return allTools.map(mapToSearchableTool)
  }

  if (!hasSupabaseEnv) {
    return buildFallbackSearchableTools()
  }

  const supabase = await createClient()
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
        type,
        category:tool_categories!ai_tools_category_id_fkey (
          id,
          name
        )
      `
    )
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) {
    return buildFallbackSearchableTools()
  }

  return (data as RawToolRow[]).map(mapDbTool).map(mapToSearchableTool)
}

export async function getHomePageData(): Promise<HomePageData> {
  if (!hasSupabaseEnv) {
    return buildFallbackHomePageData()
  }

  const supabase = await createClient()

  const [categoryResponse, toolResponse] = await Promise.all([
    supabase
      .from("tool_categories")
      .select("id, name, icon")
      .order("created_at", { ascending: true }),
    supabase
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
          type,
          category:tool_categories!ai_tools_category_id_fkey (
            id,
            name
          )
        `
      )
      .eq("is_approved", true)
      .order("created_at", { ascending: false }),
  ])

  if (categoryResponse.error || toolResponse.error) {
    return buildFallbackHomePageData()
  }

  const categories =
    categoryResponse.data?.map((category: RawCategoryRow) => ({
      id: category.id,
      name: category.name,
      icon: category.icon || "",
    })) ?? []

  const tools = (toolResponse.data as RawToolRow[] | null)?.map(mapDbTool) ?? []

  const hotTools = tools.filter((tool) => tool.type === "hot")
  const newTools = tools.filter((tool) => tool.type === "new")

  const toolsByCategory = categories.reduce<Record<string, ToolSummary[]>>((acc, category) => {
    acc[category.id] = []
    return acc
  }, {})

  tools.forEach((tool) => {
    if (!toolsByCategory[tool.categoryId]) {
      toolsByCategory[tool.categoryId] = []
    }

    toolsByCategory[tool.categoryId].push(tool)
  })

  return {
    categories,
    hotTools,
    newTools,
    toolsByCategory,
  }
}

export async function getToolDetailBySlug(slug: string): Promise<ToolDetail | null> {
  const normalizedSlug = normalizeSlugParam(slug)

  if (!hasSupabaseEnv) {
    const fallbackTool = getFallbackToolBySlug(normalizedSlug)

    if (!fallbackTool) {
      return null
    }

    return {
      ...mapLegacyTool({
        id: fallbackTool.id,
        name: fallbackTool.name,
        slug: fallbackTool.slug,
        description: fallbackTool.description,
        logo: fallbackTool.logo,
        category: fallbackTool.category,
        isHot: fallbackTool.isHot,
        isNew: fallbackTool.isNew,
      }),
      fullDescription: fallbackTool.content || fallbackTool.description,
      websiteUrl: fallbackTool.url || null,
      previewImageUrl: fallbackTool.coverImage || null,
    }
  }

  const supabase = await createClient()
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
        type,
        category:tool_categories!ai_tools_category_id_fkey (
          id,
          name
        )
      `
    )
    .eq("slug", normalizedSlug)
    .eq("is_approved", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const tool = data as RawToolRow
  const summary = mapDbTool(tool)

  return {
    ...summary,
    fullDescription: tool.full_description || tool.description,
    websiteUrl: tool.website_url,
    previewImageUrl: tool.preview_image_url,
  }
}
