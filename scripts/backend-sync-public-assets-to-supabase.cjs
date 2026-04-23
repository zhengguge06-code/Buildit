/*
  Usage:

  1. Put this file into your backend project.
  2. Set env vars:
     - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
     - SUPABASE_SERVICE_ROLE_KEY
     - FRONTEND_ASSET_BASE_URL

  3. Run:
     node backend-sync-public-assets-to-supabase.cjs --dry-run
     node backend-sync-public-assets-to-supabase.cjs

  What it does:
  - Reads tools from public.tools
  - Tries to find frontend assets by slug, for example:
      {FRONTEND_ASSET_BASE_URL}/{slug}-logo.png
      {FRONTEND_ASSET_BASE_URL}/{slug}-preview.png
    and other common extensions
  - Uploads found assets to Supabase Storage
  - Writes public URLs back into public.tools

  Optional flags:
  - --dry-run
  - --all
      Process all tools, even if the current DB URLs are already non-placeholder.
      Default behavior only targets rows whose current URLs are missing or placeholder-like.
*/

const fs = require("fs")
const path = require("path")

const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"]
const MIME_BY_EXTENSION = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
}
const PLACEHOLDER_SEGMENTS = ["placeholder-logo", "placeholder.jpg", "placeholder.svg"]

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
    select: "id,slug,name,status,logo_url,preview_image_url",
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

async function fetchBinary(url) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; ToolAssetSync/1.0)",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type"),
  }
}

async function findRemoteAsset(baseUrl, slug, kind) {
  for (const extension of EXTENSIONS) {
    const fileName = `${slug}-${kind}.${extension}`
    const url = `${baseUrl}/${fileName}`

    try {
      const file = await fetchBinary(url)
      return {
        fileName,
        extension,
        url,
        ...file,
      }
    } catch {
      // Try the next extension.
    }
  }

  return null
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
  frontendAssetBaseUrl,
  dryRun,
}) {
  const logoNeeded = isPlaceholderLike(tool.logo_url)
  const previewNeeded = isPlaceholderLike(tool.preview_image_url)

  const [logoAsset, previewAsset] = await Promise.all([
    logoNeeded ? findRemoteAsset(frontendAssetBaseUrl, tool.slug, "logo") : Promise.resolve(null),
    previewNeeded ? findRemoteAsset(frontendAssetBaseUrl, tool.slug, "preview") : Promise.resolve(null),
  ])

  const patch = {}

  if (logoAsset) {
    const logoObjectPath = `imports/${tool.slug}/logo.${logoAsset.extension}`
    patch.logo_url = dryRun
      ? buildPublicStorageUrl(supabaseUrl, "tool-logos", logoObjectPath)
      : await uploadToStorage({
          supabaseUrl,
          serviceRoleKey,
          bucket: "tool-logos",
          objectPath: logoObjectPath,
          fileBuffer: logoAsset.buffer,
          contentType: logoAsset.contentType || MIME_BY_EXTENSION[logoAsset.extension] || "application/octet-stream",
        })
  }

  if (previewAsset) {
    const previewObjectPath = `imports/${tool.slug}/preview.${previewAsset.extension}`
    patch.preview_image_url = dryRun
      ? buildPublicStorageUrl(supabaseUrl, "tool-previews", previewObjectPath)
      : await uploadToStorage({
          supabaseUrl,
          serviceRoleKey,
          bucket: "tool-previews",
          objectPath: previewObjectPath,
          fileBuffer: previewAsset.buffer,
          contentType:
            previewAsset.contentType || MIME_BY_EXTENSION[previewAsset.extension] || "application/octet-stream",
        })
  }

  if (Object.keys(patch).length === 0) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "skipped",
      reason: "No matching frontend asset files found for current missing fields.",
    }
  }

  if (dryRun) {
    return {
      slug: tool.slug,
      name: tool.name,
      status: "planned",
      patch,
      logoSourceUrl: logoAsset?.url ?? null,
      previewSourceUrl: previewAsset?.url ?? null,
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
    patch,
    logoSourceUrl: logoAsset?.url ?? null,
    previewSourceUrl: previewAsset?.url ?? null,
    updatedRows,
  }
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env"))
  loadEnvFile(path.join(process.cwd(), ".env.local"))

  const supabaseUrl = getRequiredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"])
  const serviceRoleKey = getRequiredEnv(["SUPABASE_SERVICE_ROLE_KEY"])
  const frontendAssetBaseUrl = trimTrailingSlash(getRequiredEnv(["FRONTEND_ASSET_BASE_URL"]))
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
        frontendAssetBaseUrl,
        dryRun,
      })
      results.push(result)
      console.log(`[${result.status}] ${tool.slug}`)
    } catch (error) {
      results.push({
        slug: tool.slug,
        name: tool.name,
        status: "error",
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
