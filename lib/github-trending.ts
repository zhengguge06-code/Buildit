import { unstable_cache } from "next/cache"

export type GitHubTrendingRepository = {
  id: string
  owner: string
  name: string
  fullName: string
  description: string | null
  repositoryUrl: string
  language: string | null
  languageColor: string | null
  starsCount: number
  forksCount: number
  starsToday: number
}

export type GitHubTrendingStatus = "success" | "empty" | "error"

export type GitHubTrendingResult = {
  status: GitHubTrendingStatus
  repositories: GitHubTrendingRepository[]
  fetchedAt: string
  sourceUrl: string
  message: string | null
}

const GITHUB_TRENDING_URL = "https://github.com/trending?since=daily"
const GITHUB_TRENDING_CACHE_SECONDS = 1800
const GITHUB_TRENDING_LIMIT = 25

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, " "))
}

function parseCount(value: string | undefined) {
  if (!value) {
    return 0
  }

  const normalized = value.replace(/,/g, "").trim()
  const count = Number.parseInt(normalized, 10)

  return Number.isFinite(count) ? count : 0
}

function extractFirst(source: string, pattern: RegExp) {
  return pattern.exec(source)?.[1]?.trim() ?? null
}

function normalizeRepositoryHref(href: string) {
  const cleanHref = decodeHtml(href).split("?")[0]
  const parts = cleanHref.split("/").filter(Boolean)

  if (parts.length < 2) {
    return null
  }

  const owner = parts[0]
  const name = parts[1]

  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    repositoryUrl: `https://github.com/${owner}/${name}`,
  }
}

function parseRepository(article: string): GitHubTrendingRepository | null {
  const href = extractFirst(article, /<h2[\s\S]*?<a[^>]+href="([^"]+)"[\s\S]*?<\/a>[\s\S]*?<\/h2>/i)
  const repository = href ? normalizeRepositoryHref(href) : null

  if (!repository) {
    return null
  }

  const description = extractFirst(article, /<p[^>]*class="[^"]*color-fg-muted[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
  const language = extractFirst(article, /itemprop="programmingLanguage">([^<]+)</i)
  const languageColor = extractFirst(article, /repo-language-color"[^>]+style="background-color:\s*([^"]+)"/i)
  const starHref = `/${repository.owner}/${repository.name}/stargazers`
  const forkHref = `/${repository.owner}/${repository.name}/forks`
  const starsCount = parseCount(
    extractFirst(
      article,
      new RegExp(`<a[^>]+href="${starHref.replace(/\//g, "\\/")}"[\\s\\S]*?>([\\s\\S]*?)<\\/a>`, "i")
    )?.replace(/<[^>]+>/g, "")
  )
  const forksCount = parseCount(
    extractFirst(
      article,
      new RegExp(`<a[^>]+href="${forkHref.replace(/\//g, "\\/")}"[\\s\\S]*?>([\\s\\S]*?)<\\/a>`, "i")
    )?.replace(/<[^>]+>/g, "")
  )
  const starsToday = parseCount(extractFirst(article, /([\d,]+)\s+stars?\s+today/i) ?? undefined)

  return {
    id: repository.fullName.toLowerCase(),
    owner: repository.owner,
    name: repository.name,
    fullName: repository.fullName,
    description: description ? stripTags(description) : null,
    repositoryUrl: repository.repositoryUrl,
    language: language ? decodeHtml(language) : null,
    languageColor: languageColor ? decodeHtml(languageColor) : null,
    starsCount,
    forksCount,
    starsToday,
  }
}

function parseTrendingRepositories(html: string) {
  return [...html.matchAll(/<article class="Box-row">([\s\S]*?)<\/article>/gi)]
    .map((match) => parseRepository(match[0]))
    .filter((repository): repository is GitHubTrendingRepository => Boolean(repository))
    .slice(0, GITHUB_TRENDING_LIMIT)
}

function buildResult(
  status: GitHubTrendingStatus,
  repositories: GitHubTrendingRepository[],
  message: string | null
): GitHubTrendingResult {
  return {
    status,
    repositories,
    fetchedAt: new Date().toISOString(),
    sourceUrl: GITHUB_TRENDING_URL,
    message,
  }
}

async function loadGitHubTrending(): Promise<GitHubTrendingResult> {
  const response = await fetch(GITHUB_TRENDING_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    },
    next: {
      revalidate: GITHUB_TRENDING_CACHE_SECONDS,
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub Trending 请求失败，状态码 ${response.status}。`)
  }

  const html = await response.text()
  const repositories = parseTrendingRepositories(html)

  if (repositories.length === 0) {
    return buildResult("empty", [], "GitHub Trending 暂时没有返回可展示的仓库。")
  }

  return buildResult("success", repositories, null)
}

const getCachedGitHubTrending = unstable_cache(loadGitHubTrending, ["github-trending-daily-v1"], {
  revalidate: GITHUB_TRENDING_CACHE_SECONDS,
})

export async function getGitHubTrending() {
  try {
    return await getCachedGitHubTrending()
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "GitHub Trending fetch failed")

    return buildResult(
      "error",
      [],
      error instanceof Error ? error.message : "GitHub Trending 加载失败，请稍后重试。"
    )
  }
}

