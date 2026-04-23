const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")
const { curatedExtraTools, curatedToolOverrides } = require("../lib/tool-overrides.ts")

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

function applyOverride(tool) {
  const override = curatedToolOverrides[tool.slug]

  if (!override) {
    return tool
  }

  return {
    ...tool,
    name: override.name ?? tool.name,
    description: override.description,
    fullDescription: override.fullDescription ?? tool.fullDescription,
    websiteUrl: override.websiteUrl ?? tool.websiteUrl,
  }
}

async function main() {
  loadEnvFile(path.join(__dirname, "..", ".env"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars.")
  }

  const dryRun = process.argv.includes("--dry-run")
  const supabase = createClient(supabaseUrl, supabaseKey)

  const [{ data: categories, error: categoryError }, { data: tools, error: toolError }] = await Promise.all([
    supabase.from("tool_categories").select("id, name, channel_type").eq("channel_type", "vibe-tools"),
    supabase.from("tools").select("id, slug, channel_type, status"),
  ])

  if (categoryError) {
    throw categoryError
  }

  if (toolError) {
    throw toolError
  }

  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]))
  const existingSlugs = new Set(tools.map((tool) => tool.slug))

  const missingTools = curatedExtraTools
    .filter((tool) => tool.channelType === "vibe-tools")
    .map(applyOverride)
    .filter((tool) => !existingSlugs.has(tool.slug))
    .map((tool) => {
      const categoryId = categoryIdByName.get(tool.categoryName)

      if (!categoryId) {
        throw new Error(`Missing category mapping for ${tool.slug}: ${tool.categoryName}`)
      }

      return {
        channel_type: "vibe-tools",
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        full_description: tool.fullDescription,
        website_url: tool.websiteUrl,
        logo_url: tool.logo,
        preview_image_url: tool.previewImageUrl,
        category_id: categoryId,
        status: "published",
        published_at: tool.publishedAt,
      }
    })

  const summary = {
    dbToolCountBefore: tools.length,
    curatedExtraToolCount: curatedExtraTools.filter((tool) => tool.channelType === "vibe-tools").length,
    missingCount: missingTools.length,
    missingSlugs: missingTools.map((tool) => tool.slug),
    dryRun,
  }

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  if (missingTools.length > 0) {
    const { error: insertError } = await supabase.from("tools").insert(missingTools)

    if (insertError) {
      throw insertError
    }
  }

  const { count: totalCountAfter, error: totalCountError } = await supabase
    .from("tools")
    .select("*", { count: "exact", head: true })

  if (totalCountError) {
    throw totalCountError
  }

  const { count: publishedVibeToolsAfter, error: publishedCountError } = await supabase
    .from("tools")
    .select("*", { count: "exact", head: true })
    .eq("channel_type", "vibe-tools")
    .eq("status", "published")

  if (publishedCountError) {
    throw publishedCountError
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        insertedCount: missingTools.length,
        dbToolCountAfter: totalCountAfter,
        publishedVibeToolsAfter,
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
