const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")
const { vibeProductProfilesBySlug } = require("./vibe-product-metadata.cjs")

const migratedVibeProductCategoryNames = [
  "效率协作",
  "内容创作",
  "多媒体",
  "学习教育",
  "营销增长",
  "商业金融",
  "健康生活",
]

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

function normalizeBadgeArray(values) {
  if (!Array.isArray(values)) {
    return []
  }

  return [...new Set(values.filter((value) => typeof value === "string"))]
}

function normalizeInputRecord(record) {
  const vibeProductProfile = record.channel_type === "vibe-products" ? vibeProductProfilesBySlug[record.slug] ?? null : null

  return {
    channel_type: record.channel_type,
    name: record.name,
    slug: record.slug,
    description: record.description,
    full_description: record.full_description ?? null,
    website_url: record.website_url ?? null,
    logo_url: record.logo_url ?? null,
    preview_image_url: record.preview_image_url ?? null,
    category_name: record.category_name ?? vibeProductProfile?.category_name ?? null,
    reference_badges: normalizeBadgeArray(record.reference_badges ?? vibeProductProfile?.reference_badges),
    capability_badges: normalizeBadgeArray(record.capability_badges ?? vibeProductProfile?.capability_badges),
    platform_badges: normalizeBadgeArray(record.platform_badges ?? vibeProductProfile?.platform_badges),
    status: record.status ?? "published",
    published_at: record.published_at ?? null,
  }
}

function isSameStringArray(nextValues, currentValues) {
  const normalizedCurrent = normalizeBadgeArray(currentValues)

  if (nextValues.length !== normalizedCurrent.length) {
    return false
  }

  return nextValues.every((value, index) => value === normalizedCurrent[index])
}

function isSameRecord(nextRecord, currentRecord) {
  return (
    nextRecord.channel_type === currentRecord.channel_type &&
    nextRecord.name === currentRecord.name &&
    nextRecord.slug === currentRecord.slug &&
    nextRecord.description === currentRecord.description &&
    (nextRecord.full_description ?? null) === (currentRecord.full_description ?? null) &&
    (nextRecord.website_url ?? null) === (currentRecord.website_url ?? null) &&
    (nextRecord.logo_url ?? null) === (currentRecord.logo_url ?? null) &&
    (nextRecord.preview_image_url ?? null) === (currentRecord.preview_image_url ?? null) &&
    nextRecord.category_id === currentRecord.category_id &&
    nextRecord.status === currentRecord.status &&
    (nextRecord.published_at ?? null) === (currentRecord.published_at ?? null) &&
    isSameStringArray(nextRecord.reference_badges, currentRecord.reference_badges) &&
    isSameStringArray(nextRecord.capability_badges, currentRecord.capability_badges) &&
    isSameStringArray(nextRecord.platform_badges, currentRecord.platform_badges)
  )
}

async function fetchCurrentTools(supabase) {
  const extendedResponse = await supabase.from("tools").select(
    "id, channel_type, name, slug, description, full_description, website_url, logo_url, preview_image_url, category_id, status, published_at, reference_badges, capability_badges, platform_badges"
  )

  if (!extendedResponse.error && extendedResponse.data) {
    return extendedResponse.data
  }

  const fallbackResponse = await supabase.from("tools").select(
    "id, channel_type, name, slug, description, full_description, website_url, logo_url, preview_image_url, category_id, status, published_at"
  )

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

async function main() {
  loadEnvFile(path.join(__dirname, "..", ".env"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase env vars.")
  }

  const fileArg = process.argv.find((arg) => arg.startsWith("--file="))
  const dryRun = process.argv.includes("--dry-run")
  const inputPath = fileArg
    ? path.resolve(process.cwd(), fileArg.slice("--file=".length))
    : path.join(process.cwd(), "scripts", "tool-bulk-edit.json")

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"))

  if (!Array.isArray(input)) {
    throw new Error("Input file must be a JSON array.")
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [{ data: categories, error: categoryError }, tools] = await Promise.all([
    supabase.from("tool_categories").select("id, name, channel_type"),
    fetchCurrentTools(supabase),
  ])

  if (categoryError) {
    throw categoryError
  }

  const categoryIdByKey = new Map(categories.map((category) => [`${category.channel_type}::${category.name}`, category.id]))
  const hasMigratedVibeProductCategories = migratedVibeProductCategoryNames.every((name) =>
    categoryIdByKey.has(`vibe-products::${name}`)
  )
  const currentBySlug = new Map(tools.map((tool) => [tool.slug, tool]))
  const seenSlugs = new Set()
  const inserts = []
  const updates = []

  for (const rawRecord of input) {
    const record = normalizeInputRecord(rawRecord)

    if (!record.slug || !record.name || !record.description || !record.channel_type || !record.category_name) {
      throw new Error(`Invalid record: ${JSON.stringify(rawRecord)}`)
    }

    if (seenSlugs.has(record.slug)) {
      throw new Error(`Duplicate slug in input: ${record.slug}`)
    }

    seenSlugs.add(record.slug)

    const categoryId = categoryIdByKey.get(`${record.channel_type}::${record.category_name}`)

    if (!categoryId) {
      if (record.channel_type === "vibe-products" && !hasMigratedVibeProductCategories) {
        throw new Error(
          "Current database is missing the migrated Vibe 产品 categories. Run docs/directory-v1-schema.sql before tools:upsert."
        )
      }

      throw new Error(`Missing category mapping for ${record.slug}: ${record.channel_type} / ${record.category_name}`)
    }

    const nextRecord = {
      channel_type: record.channel_type,
      name: record.name,
      slug: record.slug,
      description: record.description,
      full_description: record.full_description,
      website_url: record.website_url,
      logo_url: record.logo_url,
      preview_image_url: record.preview_image_url,
      category_id: categoryId,
      reference_badges: record.reference_badges,
      capability_badges: record.capability_badges,
      platform_badges: record.platform_badges,
      status: record.status,
      published_at: record.published_at,
    }

    const currentRecord = currentBySlug.get(record.slug)

    if (!currentRecord) {
      inserts.push(nextRecord)
      continue
    }

    if (!isSameRecord(nextRecord, currentRecord)) {
      updates.push({
        id: currentRecord.id,
        ...nextRecord,
      })
    }
  }

  const summary = {
    inputCount: input.length,
    insertCount: inserts.length,
    updateCount: updates.length,
    dryRun,
    inputPath,
  }

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from("tools").insert(inserts)

    if (error) {
      throw error
    }
  }

  for (const record of updates) {
    const { id, ...payload } = record
    const { error } = await supabase.from("tools").update(payload).eq("id", id)

    if (error) {
      throw error
    }
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
