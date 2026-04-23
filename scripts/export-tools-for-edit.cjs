const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")
const { vibeProductProfilesBySlug } = require("./vibe-product-metadata.cjs")

function loadEnvFile(envPath) {
  const content = fs.readFileSync(envPath, "utf8")

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

async function fetchTools(supabase) {
  const extendedSelect = [
    "id",
    "channel_type",
    "name",
    "slug",
    "description",
    "full_description",
    "website_url",
    "logo_url",
    "preview_image_url",
    "category_id",
    "status",
    "published_at",
    "created_at",
    "updated_at",
    "reference_badges",
    "capability_badges",
    "platform_badges",
  ].join(", ")

  const extendedResponse = await supabase
    .from("tools")
    .select(extendedSelect)
    .order("channel_type", { ascending: true })
    .order("published_at", { ascending: false })

  if (!extendedResponse.error && extendedResponse.data) {
    return extendedResponse.data
  }

  const fallbackResponse = await supabase
    .from("tools")
    .select(
      "id, channel_type, name, slug, description, full_description, website_url, logo_url, preview_image_url, category_id, status, published_at, created_at, updated_at"
    )
    .order("channel_type", { ascending: true })
    .order("published_at", { ascending: false })

  if (fallbackResponse.error || !fallbackResponse.data) {
    throw extendedResponse.error || fallbackResponse.error
  }

  return fallbackResponse.data.map((tool) => ({
    ...tool,
    reference_badges: [],
    capability_badges: [],
    platform_badges: [],
  }))
}

function normalizeBadgeArray(values) {
  return Array.isArray(values) ? values.filter((value) => typeof value === "string") : []
}

async function main() {
  loadEnvFile(path.join(__dirname, "..", ".env"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars.")
  }

  const outputArg = process.argv.find((arg) => arg.startsWith("--output="))
  const outputPath = outputArg
    ? path.resolve(process.cwd(), outputArg.slice("--output=".length))
    : path.join(process.cwd(), "scripts", "tool-bulk-edit.json")

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [{ data: categories, error: categoryError }, tools] = await Promise.all([
    supabase.from("tool_categories").select("id, name, channel_type"),
    fetchTools(supabase),
  ])

  if (categoryError) {
    throw categoryError
  }

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))

  const payload = tools.map((tool) => {
    const rawCategoryName = categoryNameById.get(tool.category_id) ?? null
    const vibeProductProfile = tool.channel_type === "vibe-products" ? vibeProductProfilesBySlug[tool.slug] ?? null : null

    return {
      id: tool.id,
      channel_type: tool.channel_type,
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      full_description: tool.full_description,
      website_url: tool.website_url,
      logo_url: tool.logo_url,
      preview_image_url: tool.preview_image_url,
      category_name: vibeProductProfile?.category_name ?? rawCategoryName,
      reference_badges: vibeProductProfile?.reference_badges ?? normalizeBadgeArray(tool.reference_badges),
      capability_badges: vibeProductProfile?.capability_badges ?? normalizeBadgeArray(tool.capability_badges),
      platform_badges: vibeProductProfile?.platform_badges ?? normalizeBadgeArray(tool.platform_badges),
      status: tool.status,
      published_at: tool.published_at,
      created_at: tool.created_at,
      updated_at: tool.updated_at,
    }
  })

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

  console.log(
    JSON.stringify(
      {
        exportedCount: payload.length,
        outputPath,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
