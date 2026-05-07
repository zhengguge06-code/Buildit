import { unstable_cache } from "next/cache"

export type ProductHuntPostSummary = {
  id: string
  name: string
  slug: string
  tagline: string
  thumbnailUrl: string | null
  productHuntUrl: string
  websiteUrl: string | null
  votesCount: number
  commentsCount: number
  dailyRank: number | null
  featuredAt: string | null
}

export type ProductHuntFetchStatus = "success" | "empty" | "missing-config" | "error"

export type ProductHuntTodayResult = {
  status: ProductHuntFetchStatus
  posts: ProductHuntPostSummary[]
  fetchedAt: string
  windowStart: string
  windowEnd: string
  message: string | null
}

type ProductHuntTokenResponse = {
  access_token?: string
  token_type?: string
  scope?: string
}

type RawProductHuntPost = {
  id?: string | null
  name?: string | null
  slug?: string | null
  tagline?: string | null
  thumbnail?: {
    url?: string | null
  } | null
  url?: string | null
  website?: string | null
  votesCount?: number | null
  commentsCount?: number | null
  dailyRank?: number | null
  featuredAt?: string | null
}

type ProductHuntGraphQLResponse = {
  data?: {
    posts?: {
      nodes?: RawProductHuntPost[]
    } | null
  } | null
  errors?: Array<{
    message?: string
  }>
}

const PRODUCT_HUNT_GRAPHQL_ENDPOINT = "https://api.producthunt.com/v2/api/graphql"
const PRODUCT_HUNT_TOKEN_ENDPOINT = "https://api.producthunt.com/v2/oauth/token"
const PRODUCT_HUNT_TIME_ZONE = "America/Los_Angeles"
const PRODUCT_HUNT_POST_LIMIT = 20

const FEATURED_POSTS_QUERY = `
  query ProductHuntTodayPosts($first: Int!, $postedAfter: DateTime!, $postedBefore: DateTime!) {
    posts(
      first: $first
      featured: true
      order: RANKING
      postedAfter: $postedAfter
      postedBefore: $postedBefore
    ) {
      nodes {
        id
        name
        slug
        tagline
        thumbnail {
          url
        }
        url
        website
        votesCount
        commentsCount
        dailyRank
        featuredAt
      }
    }
  }
`

const FILLER_POSTS_QUERY = `
  query ProductHuntTodayFillerPosts($first: Int!, $postedAfter: DateTime!, $postedBefore: DateTime!) {
    posts(
      first: $first
      order: RANKING
      postedAfter: $postedAfter
      postedBefore: $postedBefore
    ) {
      nodes {
        id
        name
        slug
        tagline
        thumbnail {
          url
        }
        url
        website
        votesCount
        commentsCount
        dailyRank
        featuredAt
      }
    }
  }
`

function getNumericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  const value = parts.find((part) => part.type === type)?.value
  return value ? Number(value) : 0
}

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  return {
    year: getNumericPart(parts, "year"),
    month: getNumericPart(parts, "month"),
    day: getNumericPart(parts, "day"),
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)

  const year = getNumericPart(parts, "year")
  const month = getNumericPart(parts, "month")
  const day = getNumericPart(parts, "day")
  const hour = getNumericPart(parts, "hour")
  const minute = getNumericPart(parts, "minute")
  const second = getNumericPart(parts, "second")
  const zonedAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)

  return zonedAsUtc - date.getTime()
}

function zonedMidnightToUtc(dateParts: { year: number; month: number; day: number }, timeZone: string) {
  const localAsUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0)
  const firstPassOffset = getTimeZoneOffsetMs(new Date(localAsUtc), timeZone)
  const firstPass = new Date(localAsUtc - firstPassOffset)
  const secondPassOffset = getTimeZoneOffsetMs(firstPass, timeZone)

  if (secondPassOffset === firstPassOffset) {
    return firstPass
  }

  return new Date(localAsUtc - secondPassOffset)
}

function addDaysToDateParts(dateParts: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days, 0, 0, 0))

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

function getProductHuntTodayWindow(now = new Date()) {
  const todayParts = getZonedDateParts(now, PRODUCT_HUNT_TIME_ZONE)
  const tomorrowParts = addDaysToDateParts(todayParts, 1)
  const start = zonedMidnightToUtc(todayParts, PRODUCT_HUNT_TIME_ZONE)
  const end = zonedMidnightToUtc(tomorrowParts, PRODUCT_HUNT_TIME_ZONE)

  return {
    start,
    end,
  }
}

function readEnv(name: string) {
  return process.env[name]?.trim() || null
}

function hasProductHuntCredentials() {
  if (readEnv("PRODUCT_HUNT_ACCESS_TOKEN")) {
    return true
  }

  return Boolean(readEnv("PRODUCT_HUNT_CLIENT_ID") && readEnv("PRODUCT_HUNT_CLIENT_SECRET"))
}

async function getProductHuntAccessToken() {
  const configuredToken = readEnv("PRODUCT_HUNT_ACCESS_TOKEN")

  if (configuredToken) {
    return configuredToken
  }

  const clientId = readEnv("PRODUCT_HUNT_CLIENT_ID")
  const clientSecret = readEnv("PRODUCT_HUNT_CLIENT_SECRET")

  if (!clientId || !clientSecret) {
    return null
  }

  const response = await fetch(PRODUCT_HUNT_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Product Hunt token request failed with ${response.status}`)
  }

  const payload = (await response.json()) as ProductHuntTokenResponse

  return payload.access_token?.trim() || null
}

function normalizeCount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0
}

function normalizePost(post: RawProductHuntPost, index: number): ProductHuntPostSummary | null {
  const id = post.id?.trim()
  const name = post.name?.trim()
  const slug = post.slug?.trim() || id
  const productHuntUrl = post.url?.trim() || (slug ? `https://www.producthunt.com/posts/${slug}` : null)

  if (!id || !name || !slug || !productHuntUrl) {
    return null
  }

  const dailyRank =
    typeof post.dailyRank === "number" && Number.isFinite(post.dailyRank)
      ? post.dailyRank
      : index + 1

  return {
    id,
    name,
    slug,
    tagline: post.tagline?.trim() || "No tagline provided.",
    thumbnailUrl: post.thumbnail?.url?.trim() || null,
    productHuntUrl,
    websiteUrl: post.website?.trim() || null,
    votesCount: normalizeCount(post.votesCount),
    commentsCount: normalizeCount(post.commentsCount),
    dailyRank,
    featuredAt: post.featuredAt?.trim() || null,
  }
}

function buildResult(
  status: ProductHuntFetchStatus,
  posts: ProductHuntPostSummary[],
  windowStart: string,
  windowEnd: string,
  message: string | null
): ProductHuntTodayResult {
  return {
    status,
    posts,
    fetchedAt: new Date().toISOString(),
    windowStart,
    windowEnd,
    message,
  }
}

async function fetchProductHuntPosts({
  accessToken,
  query,
  first,
  postedAfter,
  postedBefore,
}: {
  accessToken: string
  query: string
  first: number
  postedAfter: string
  postedBefore: string
}) {
  const response = await fetch(PRODUCT_HUNT_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        first,
        postedAfter,
        postedBefore,
      },
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Product Hunt API 请求失败，状态码 ${response.status}。`)
  }

  const payload = (await response.json()) as ProductHuntGraphQLResponse

  if (payload.errors?.length) {
    throw new Error("Product Hunt API 返回了 GraphQL 错误，请稍后重试。")
  }

  return (payload.data?.posts?.nodes ?? [])
    .map(normalizePost)
    .filter((post): post is ProductHuntPostSummary => Boolean(post))
}

function dedupeProductHuntPosts(posts: ProductHuntPostSummary[]) {
  const seen = new Set<string>()

  return posts.filter((post) => {
    const key = post.slug || post.id

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function loadProductHuntTodayPosts(): Promise<ProductHuntTodayResult> {
  const { start, end } = getProductHuntTodayWindow()
  const windowStart = start.toISOString()
  const windowEnd = end.toISOString()

  try {
    const accessToken = await getProductHuntAccessToken()

    if (!accessToken) {
      return buildResult(
        "missing-config",
        [],
        windowStart,
        windowEnd,
        "Product Hunt 今日热榜当前不可用，请稍后刷新。"
      )
    }

    const featuredPosts = await fetchProductHuntPosts({
      accessToken,
      query: FEATURED_POSTS_QUERY,
      first: PRODUCT_HUNT_POST_LIMIT,
      postedAfter: windowStart,
      postedBefore: windowEnd,
    })

    let posts = featuredPosts

    if (posts.length < PRODUCT_HUNT_POST_LIMIT) {
      const fillerPosts = await fetchProductHuntPosts({
        accessToken,
        query: FILLER_POSTS_QUERY,
        first: PRODUCT_HUNT_POST_LIMIT * 3,
        postedAfter: windowStart,
        postedBefore: windowEnd,
      })

      posts = dedupeProductHuntPosts([...posts, ...fillerPosts])
    }

    posts = posts.slice(0, PRODUCT_HUNT_POST_LIMIT)

    if (posts.length === 0) {
      return buildResult(
        "empty",
        [],
        windowStart,
        windowEnd,
        "Product Hunt 今天的热榜还在同步中，稍后刷新即可。"
      )
    }

    return buildResult("success", posts, windowStart, windowEnd, null)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Product Hunt 今日热榜加载失败，请稍后重试。")
  }
}

const getCachedProductHuntTodayPosts = unstable_cache(
  loadProductHuntTodayPosts,
  ["product-hunt-today-posts-v4"],
  { revalidate: 900 }
)

export async function getProductHuntTodayPosts() {
  if (!hasProductHuntCredentials()) {
    const { start, end } = getProductHuntTodayWindow()

    return buildResult(
      "missing-config",
      [],
      start.toISOString(),
      end.toISOString(),
      "Product Hunt 今日热榜当前不可用，请稍后刷新。"
    )
  }

  try {
    return await getCachedProductHuntTodayPosts()
  } catch (error) {
    const { start, end } = getProductHuntTodayWindow()

    console.warn(error instanceof Error ? error.message : "Product Hunt fetch failed")

    return buildResult(
      "error",
      [],
      start.toISOString(),
      end.toISOString(),
      "Product Hunt 今日热榜当前不可用，请稍后刷新。"
    )
  }
}

export { PRODUCT_HUNT_TIME_ZONE }
