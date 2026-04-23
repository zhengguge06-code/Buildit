const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

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

function toAbsoluteUrl(candidate, baseUrl) {
  if (!candidate) {
    return null
  }

  try {
    return new URL(candidate, baseUrl).toString()
  } catch {
    return null
  }
}

function extractMetaContent(html, propertyName) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propertyName}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${propertyName}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${propertyName}["'][^>]*>`, "i"),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

function extractIconHref(html, relFragment) {
  const iconLinkPattern = /<link[^>]+rel=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi

  for (const match of html.matchAll(iconLinkPattern)) {
    const rel = match[1]?.toLowerCase() ?? ""
    const href = match[2] ?? ""

    if (rel.includes(relFragment)) {
      return href
    }
  }

  return null
}

async function fetchAssetCandidates(websiteUrl) {
  const response = await fetch(websiteUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; AI-Tools-Directory/1.0; +https://example.com/bot)",
    },
    redirect: "follow",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${websiteUrl}: ${response.status} ${response.statusText}`)
  }

  const finalUrl = response.url || websiteUrl
  const html = await response.text()
  const ogImage = extractMetaContent(html, "og:image")
  const twitterImage = extractMetaContent(html, "twitter:image")
  const appleTouchIcon = extractIconHref(html, "apple-touch-icon")
  const iconHref =
    extractIconHref(html, "icon") ||
    extractIconHref(html, "shortcut icon") ||
    "/favicon.ico"

  return {
    finalUrl,
    previewSource: toAbsoluteUrl(ogImage || twitterImage, finalUrl),
    logoSource: toAbsoluteUrl(appleTouchIcon || iconHref, finalUrl),
  }
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
    : path.join(process.cwd(), "scripts", "tool-assets.generated.json")
  const onlyMissing = !process.argv.includes("--all")

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: tools, error } = await supabase
    .from("tools")
    .select("slug,name,website_url,logo_url,preview_image_url,status,channel_type")
    .eq("status", "published")
    .order("channel_type", { ascending: true })
    .order("published_at", { ascending: false })

  if (error) {
    throw error
  }

  const candidates = []

  for (const tool of tools) {
    if (!tool.website_url) {
      continue
    }

    const needsLogo = !tool.logo_url || tool.logo_url.startsWith("/placeholder")
    const needsPreview = !tool.preview_image_url || tool.preview_image_url.startsWith("/placeholder")

    if (onlyMissing && !needsLogo && !needsPreview) {
      continue
    }

    try {
      const assetCandidates = await fetchAssetCandidates(tool.website_url)
      candidates.push({
        slug: tool.slug,
        name: tool.name,
        channelType: tool.channel_type,
        websiteUrl: tool.website_url,
        currentLogoUrl: tool.logo_url,
        currentPreviewImageUrl: tool.preview_image_url,
        logoSource: needsLogo ? assetCandidates.logoSource : null,
        previewSource: needsPreview ? assetCandidates.previewSource : null,
      })
      console.log(`[scan] ${tool.slug}`)
    } catch (fetchError) {
      candidates.push({
        slug: tool.slug,
        name: tool.name,
        channelType: tool.channel_type,
        websiteUrl: tool.website_url,
        currentLogoUrl: tool.logo_url,
        currentPreviewImageUrl: tool.preview_image_url,
        logoSource: null,
        previewSource: null,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
      console.log(`[skip] ${tool.slug}`)
    }
  }

  fs.writeFileSync(outputPath, `${JSON.stringify({ tools: candidates }, null, 2)}\n`, "utf8")

  console.log(
    JSON.stringify(
      {
        outputPath,
        scannedCount: candidates.length,
        successCount: candidates.filter((item) => item.logoSource || item.previewSource).length,
        errorCount: candidates.filter((item) => item.error).length,
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
