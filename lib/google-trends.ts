import { unstable_cache } from "next/cache"
import { XMLParser } from "fast-xml-parser"

export type GoogleTrendNewsItem = {
  title: string
  url: string | null
  source: string | null
  pictureUrl: string | null
  snippet: string | null
}

export type GoogleTrendSummary = {
  id: string
  title: string
  approxTraffic: string | null
  publishedAt: string | null
  pictureUrl: string | null
  pictureSource: string | null
  exploreUrl: string
  newsItems: GoogleTrendNewsItem[]
}

export type GoogleTrendsFetchStatus = "success" | "empty" | "error"

export type GoogleTrendsResult = {
  status: GoogleTrendsFetchStatus
  trends: GoogleTrendSummary[]
  fetchedAt: string
  sourceUrl: string
  message: string | null
}

type RawGoogleTrendNewsItem = {
  news_item_title?: unknown
  news_item_url?: unknown
  news_item_source?: unknown
  news_item_picture?: unknown
  news_item_snippet?: unknown
}

type RawGoogleTrendItem = {
  title?: unknown
  approx_traffic?: unknown
  pubDate?: unknown
  picture?: unknown
  picture_source?: unknown
  news_item?: RawGoogleTrendNewsItem | RawGoogleTrendNewsItem[]
}

type ParsedGoogleTrendsRss = {
  rss?: {
    channel?: {
      item?: RawGoogleTrendItem | RawGoogleTrendItem[]
    }
  }
}

const GOOGLE_TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=US"
const GOOGLE_TRENDS_CACHE_SECONDS = 600

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
})

function toArray<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeUrl(value: unknown) {
  const url = asText(value)

  return url || null
}

function normalizeDate(value: unknown) {
  const rawDate = asText(value)

  if (!rawDate) {
    return null
  }

  const date = new Date(rawDate)

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function createTrendId(title: string, publishedAt: string | null) {
  return `${title.toLowerCase()}-${publishedAt ?? "unknown"}`
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeNewsItem(item: RawGoogleTrendNewsItem): GoogleTrendNewsItem | null {
  const title = asText(item.news_item_title)
  const url = normalizeUrl(item.news_item_url)

  if (!title && !url) {
    return null
  }

  return {
    title: title || "Untitled news",
    url,
    source: asText(item.news_item_source) || null,
    pictureUrl: normalizeUrl(item.news_item_picture),
    snippet: asText(item.news_item_snippet) || null,
  }
}

function normalizeTrend(item: RawGoogleTrendItem): GoogleTrendSummary | null {
  const title = asText(item.title)

  if (!title) {
    return null
  }

  const publishedAt = normalizeDate(item.pubDate)
  const newsItems = toArray(item.news_item)
    .map(normalizeNewsItem)
    .filter((newsItem): newsItem is GoogleTrendNewsItem => Boolean(newsItem))

  return {
    id: createTrendId(title, publishedAt),
    title,
    approxTraffic: asText(item.approx_traffic) || null,
    publishedAt,
    pictureUrl: normalizeUrl(item.picture),
    pictureSource: asText(item.picture_source) || null,
    exploreUrl: `https://trends.google.com/trends/explore?geo=US&q=${encodeURIComponent(title)}`,
    newsItems,
  }
}

function buildResult(
  status: GoogleTrendsFetchStatus,
  trends: GoogleTrendSummary[],
  message: string | null
): GoogleTrendsResult {
  return {
    status,
    trends,
    fetchedAt: new Date().toISOString(),
    sourceUrl: GOOGLE_TRENDS_RSS_URL,
    message,
  }
}

async function loadGoogleTrends(): Promise<GoogleTrendsResult> {
  const response = await fetch(GOOGLE_TRENDS_RSS_URL, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    next: {
      revalidate: GOOGLE_TRENDS_CACHE_SECONDS,
    },
  })

  if (!response.ok) {
    throw new Error(`Google Trends RSS 请求失败，状态码 ${response.status}。`)
  }

  const xml = await response.text()
  const payload = xmlParser.parse(xml) as ParsedGoogleTrendsRss
  const rawItems = toArray(payload.rss?.channel?.item)
  const trends = rawItems
    .map(normalizeTrend)
    .filter((trend): trend is GoogleTrendSummary => Boolean(trend))

  if (trends.length === 0) {
    return buildResult("empty", [], "Google Trends 暂时没有返回可展示的热搜数据。")
  }

  return buildResult("success", trends, null)
}

const getCachedGoogleTrends = unstable_cache(loadGoogleTrends, ["google-trends-us-rss-v1"], {
  revalidate: GOOGLE_TRENDS_CACHE_SECONDS,
})

export async function getGoogleTrends() {
  try {
    return await getCachedGoogleTrends()
  } catch (error) {
    console.warn(error instanceof Error ? error.message : "Google Trends fetch failed")

    return buildResult(
      "error",
      [],
      error instanceof Error ? error.message : "Google Trends 当前热搜加载失败，请稍后重试。"
    )
  }
}

