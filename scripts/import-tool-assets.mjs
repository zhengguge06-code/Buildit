import fs from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

const DEFAULT_MANIFEST_PATH = "scripts/tool-assets.example.json"
const MIME_BY_EXTENSION = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8")

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmed.indexOf("=")

      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return
    }

    throw error
  }
}

function getFileExtension(source, contentType) {
  const sourceWithoutQuery = source.split("?")[0]
  const extension = path.extname(sourceWithoutQuery).replace(".", "").toLowerCase()

  if (extension) {
    return extension
  }

  const mimeEntry = Object.entries(MIME_BY_EXTENSION).find(([, mime]) => mime === contentType)
  return mimeEntry?.[0] ?? "png"
}

async function readAssetBuffer(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error(`下载失败：${source} -> ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? undefined,
    }
  }

  const absolutePath = path.isAbsolute(source) ? source : path.join(process.cwd(), source)
  const buffer = await fs.readFile(absolutePath)
  return {
    buffer,
    contentType: MIME_BY_EXTENSION[getFileExtension(source)] ?? undefined,
  }
}

async function uploadAsset({
  supabase,
  bucket,
  slug,
  kind,
  source,
}) {
  const { buffer, contentType } = await readAssetBuffer(source)
  const extension = getFileExtension(source, contentType)
  const objectPath = `imports/${slug}/${kind}.${extension}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(objectPath)

  return publicUrl
}

async function main() {
  await loadEnvFile(path.join(process.cwd(), ".env"))
  await loadEnvFile(path.join(process.cwd(), ".env.local"))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY，无法执行素材导入。")
  }

  const manifestPath = process.argv[2] ?? DEFAULT_MANIFEST_PATH
  const manifestAbsolutePath = path.isAbsolute(manifestPath)
    ? manifestPath
    : path.join(process.cwd(), manifestPath)

  const manifest = JSON.parse(await fs.readFile(manifestAbsolutePath, "utf8"))
  const tools = Array.isArray(manifest.tools) ? manifest.tools : []

  if (tools.length === 0) {
    throw new Error("manifest 里没有可导入的 tools。")
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const results = []

  for (const tool of tools) {
    try {
    const slug = tool.slug

    if (!slug) {
      throw new Error("发现缺少 slug 的导入项。")
    }

    const patch = {}

    if (tool.logoSource) {
      patch.logo_url = await uploadAsset({
        supabase,
        bucket: "tool-logos",
        slug,
        kind: "logo",
        source: tool.logoSource,
      })
    }

    if (tool.previewSource) {
      patch.preview_image_url = await uploadAsset({
        supabase,
        bucket: "tool-previews",
        slug,
        kind: "preview",
        source: tool.previewSource,
      })
    }

    if (Object.keys(patch).length === 0) {
      results.push({ slug, status: "skipped", reason: "missing logoSource / previewSource" })
      console.log(`[skip] ${slug} 没有提供 logoSource / previewSource`)
      continue
    }

    const { error: updateError } = await supabase.from("tools").update(patch).eq("slug", slug)

    if (updateError) {
      throw updateError
    }

    results.push({ slug, status: "updated", patch })
    console.log(`[done] ${slug}`, patch)
    } catch (error) {
      const slug = tool.slug ?? "(missing-slug)"
      const message = error instanceof Error ? error.message : String(error)
      results.push({ slug, status: "error", error: message })
      console.log(`[error] ${slug} ${message}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        totalCount: results.length,
        updatedCount: results.filter((item) => item.status === "updated").length,
        skippedCount: results.filter((item) => item.status === "skipped").length,
        errorCount: results.filter((item) => item.status === "error").length,
        errors: results.filter((item) => item.status === "error"),
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
