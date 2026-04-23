/*
  Usage:

  1. Put this file into your backend project.
  2. Set env vars:
     - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY

  3. Run:
     node backend-fetch-website-assets-to-supabase.cjs --dry-run
     node backend-fetch-website-assets-to-supabase.cjs

  What it does:
  - Reads tools from public.tools
  - Uses website_url to fetch each tool's official site
  - Extracts image candidates from og:image / twitter:image / icons
  - Uploads found assets to Supabase Storage
  - Writes public URLs back into public.tools

  Notes:
  - Default behavior only processes rows whose current URLs are empty or placeholder-like.
  - Use --all to scan every tool row.
*/

const fs = require("fs")
const path = require("path")

const PLACEHOLDER_SEGMENTS = ["placeholder-logo", "placeholder.jpg", "placeholder.svg"]
const MIME_BY_EXTENSION = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  ico: "image/x-icon",
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return
  }

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
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

function getRequiredEnv(nameCandidates) {
  for (const name of nameCandidates) {
    if (process.env[name]) {
      return process.env[name]
    }
  }

  throw new Error(`Missing required env: ${nameCandidates.join(" or ")}`)
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "")
}

function isPlaceholderLike(value) {
  if (!value) {
    return true
  }

  return PLACEHOLDER_SEGMENTS.some((segment) => value.includes(segment))
}

function buildPublicStorageUrl(supabaseUrl, bucket, objectPath) {
  return `${trimTrailingSlash(supabaseUrl)}/storage/v1/object/public/${bucket}/${objectPath}`
}

async function fetchJson(url, init) {
  const response = await fetch(url, init)

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Request failed: ${response.status} ${response.statusText} ${body}`)
  }

  return response.json()
}

async function listTools({ supabaseUrl, serviceRoleKey }) {
  const query = new URLSearchParams({
    select: "id,slug,name,status,website_url,logo_url,preview_image_url",
    order: "slug.asc",
  }).toString()

  return fetchJson(`${trimTrailingSlash(supabaseUrl)}/rest/v1/tools?${query}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      accept: "application/json",
    },
  })
}

async function fetchText(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ToolAssetFetcher/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return {
    html: await response.text(),
    finalUrl: response.url || url,
  }
}

async function fetchBinary(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ToolAssetFetcher/1.0)",
      accept: "image/*,*/*;q=0.8",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
    finalUrl: response.url || url,
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

function extractMetaContent(html, key) {
  const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${safeKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${safeKey}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${safeKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${safeKey}["'][^>]*>`, "i"),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)

    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

function extractLinkHref(html, relNeedle) {
  const pattern = /<link[^>]+rel=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi

  for (const match of html.matchAll(pattern)) {
    const rel = (match[1] || "").toLowerCase()
    const href = match[2] || ""

    if (rel.includes(relNeedle)) {
      return href
    }
  }

  return null
}

function pickLogoCandidate({ html, finalUrl }) {
  const appleTouchIcon = extractLinkHref(html, "apple-touch-icon")
  const iconHref = extractLinkHref(html, "shortcut icon") || extractLinkHref(html, "icon") || "/favicon.ico"

  return toAbsoluteUrl(appleTouchIcon || iconHref, finalUrl)
}

function pickPreviewCandidate({ html, finalUrl }) {
  const ogImage = extractMetaContent(html, "og:image")
  const twitterImage = extractMetaContent(html, "twitter:image")

  return toAbsoluteUrl(ogImage || twitterImage, finalUrl)
}

function guessExtensionFromUrl(url, contentType) {
  const pathname = (() => {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  })()

  const extension = path.extname(pathname).replace(".", "").toLowerCase()

  if (extension) {
    return extension
  }

  const mimeEntry = Object.entries(MIME_BY_EXTENSION).find(([, mime]) => contentType?.includes(mime))
  return mimeEntry?.[0] ?? "png"
}

async function uploadToStorage({
  supabaseUrl,
  serviceRoleKey,
  bucket,
  objectPath,
  fileBuffer,
  contentType,
}) {
  const uploadUrl = `${trimTrailingSlash(supabaseUrl)}/storage/v1/object/${bucket}/${objectPath}`

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "x-upsert": "true",
      "content-type": contentType,
    },
    body: fileBuffer,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Storage upload failed: ${bucket}/${objectPath} -> ${response.status} ${body}`)
  }

  return buildPublicStorageUrl(supabaseUrl, bucket, objectPath)
}

async function updateToolRecord({
  supabaseUrl,
  serviceRoleKey,
  slug,
  patch,
}) {
  const query = new URLSearchParams({
    slug: `eq.${slug}`,
  }).toString()

  const response = await fetch(`${trimTrailingSlash(supabaseUrl)}/rest/v1/tools?${query}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`DB update failed for ${slug}: ${response.status} ${body}`)
  }

  return response.json()
}

async function syncSingleTool({
  tool,
  supabaseUrl,
  serviceRoleKey,
  dryRun,
}) {
  if (!tool.website_url) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "skipped",
      reason: "Missing website_url.",
    }
  }

  const needsLogo = isPlaceholderLike(tool.logo_url)
  const needsPreview = isPlaceholderLike(tool.preview_image_url)

  if (!needsLogo && !needsPreview) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "skipped",
      reason: "Current URLs are already non-placeholder.",
    }
  }

  const page = await fetchText(tool.website_url)
  const logoCandidateUrl = needsLogo ? pickLogoCandidate(page) : null
  const previewCandidateUrl = needsPreview ? pickPreviewCandidate(page) : null
  const patch = {}

  if (logoCandidateUrl) {
    const logoFile = await fetchBinary(logoCandidateUrl)
    const logoExtension = guessExtensionFromUrl(logoFile.finalUrl, logoFile.contentType)
    const logoObjectPath = `imports/${tool.slug}/logo.${logoExtension}`

    patch.logo_url = dryRun
      ? buildPublicStorageUrl(supabaseUrl, "tool-logos", logoObjectPath)
      : await uploadToStorage({
          supabaseUrl,
          serviceRoleKey,
          bucket: "tool-logos",
          objectPath: logoObjectPath,
          fileBuffer: logoFile.buffer,
          contentType: logoFile.contentType || MIME_BY_EXTENSION[logoExtension] || "application/octet-stream",
        })
  }

  if (previewCandidateUrl) {
    const previewFile = await fetchBinary(previewCandidateUrl)
    const previewExtension = guessExtensionFromUrl(previewFile.finalUrl, previewFile.contentType)
    const previewObjectPath = `imports/${tool.slug}/preview.${previewExtension}`

    patch.preview_image_url = dryRun
      ? buildPublicStorageUrl(supabaseUrl, "tool-previews", previewObjectPath)
      : await uploadToStorage({
          supabaseUrl,
          serviceRoleKey,
          bucket: "tool-previews",
          objectPath: previewObjectPath,
          fileBuffer: previewFile.buffer,
          contentType: previewFile.contentType || MIME_BY_EXTENSION[previewExtension] || "application/octet-stream",
        })
  }

  if (Object.keys(patch).length === 0) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "skipped",
      websiteUrl: tool.website_url,
      reason: "No usable image candidate found on official website.",
      logoCandidateUrl,
      previewCandidateUrl,
    }
  }

  if (dryRun) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "planned",
      websiteUrl: tool.website_url,
      patch,
      logoCandidateUrl,
      previewCandidateUrl,
    }
  }

  const updatedRows = await updateToolRecord({
    supabaseUrl,
    serviceRoleKey,
    slug: tool.slug,
    patch,
  })

  return {
    slug: tool.slug,
    name: tool.name,
    status: "updated",
    websiteUrl: tool.website_url,
    patch,
    logoCandidateUrl,
    previewCandidateUrl,
    updatedRows,
  }
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"))
  loadEnvFile(path.join(process.cwd(), ".env.local"))

  const supabaseUrl = getRequiredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"])
  const serviceRoleKey = getRequiredEnv(["SUPABASE_SERVICE_ROLE_KEY"])
  const dryRun = process.argv.includes("--dry-run")
  const processAll = process.argv.includes("--all")

  const tools = await listTools({ supabaseUrl, serviceRoleKey })
  const candidates = processAll
    ? tools
    : tools.filter((tool) => isPlaceholderLike(tool.logo_url) || isPlaceholderLike(tool.preview_image_url))

  const results = []

  for (const tool of candidates) {
    try {
      const result = await syncSingleTool({
        tool,
        supabaseUrl,
        serviceRoleKey,
        dryRun,
      })
      results.push(result)
      console.log(`[${result.status}] ${tool.slug}`)
    } catch (error) {
      results.push({
        slug: tool.slug,
        name: tool.name,
        status: "error",
        websiteUrl: tool.website_url,
        error: error instanceof Error ? error.message : String(error),
      })
      console.log(`[error] ${tool.slug}`)
    }
  }

  const summary = {
    dryRun,
    processAll,
    totalTools: tools.length,
    candidateTools: candidates.length,
    updatedCount: results.filter((item) => item.status === "updated").length,
    plannedCount: results.filter((item) => item.status === "planned").length,
    skippedCount: results.filter((item) => item.status === "skipped").length,
    errorCount: results.filter((item) => item.status === "error").length,
    results,
  }

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
