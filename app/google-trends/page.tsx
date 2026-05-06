import type { Metadata } from "next"
import { ArrowUpRight, Flame, Newspaper, RefreshCw, Search, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getGoogleTrends,
  type GoogleTrendNewsItem,
  type GoogleTrendSummary,
  type GoogleTrendsResult,
} from "@/lib/google-trends"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Google Trends 当前热搜 · Buildit",
  description: "Google Trends 美国当前热搜关键词。",
}

function formatFetchedAt(dateString: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function formatPublishedAt(dateString: string | null) {
  if (!dateString) {
    return "刚刚更新"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default async function GoogleTrendsPage() {
  const result = await getGoogleTrends()
  const hasTrends = result.trends.length > 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-7 md:py-9">
        <section className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="soft" className="text-[11px] uppercase tracking-[0.18em]">
                Google Trends
              </Badge>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Google Trends 当前热搜
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                数据来源：Google Trends
              </span>
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                上次请求：{formatFetchedAt(result.fetchedAt)}
              </span>
            </div>
          </div>
        </section>

        {hasTrends ? <GoogleTrendsGrid trends={result.trends} /> : <GoogleTrendsEmptyState result={result} />}
      </div>
    </div>
  )
}

function GoogleTrendsGrid({ trends }: { trends: GoogleTrendSummary[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      {trends.map((trend) => (
        <GoogleTrendCard key={trend.id} trend={trend} />
      ))}
    </div>
  )
}

function GoogleTrendCard({ trend }: { trend: GoogleTrendSummary }) {
  const leadNews = trend.newsItems[0]
  const secondaryNews = trend.newsItems.slice(1, 3)

  return (
    <article className="group relative flex min-h-[17rem] flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-warm-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-warm">
      <a
        href={trend.exploreUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`打开 Google Trends 上的 ${trend.title}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background">
          {trend.pictureUrl ? (
            <img src={trend.pictureUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Trending now
          </span>
          <h2 className="mt-2 line-clamp-2 font-serif text-lg font-semibold tracking-tight text-foreground">
            {trend.title}
          </h2>
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
      </div>

      <div className="pointer-events-none relative z-10 mt-3 flex flex-wrap gap-1.5">
        {trend.approxTraffic ? (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Flame className="h-3 w-3" />
            {trend.approxTraffic}
          </Badge>
        ) : null}
        <Badge variant="outline" className="text-[11px]">
          更新：{formatPublishedAt(trend.publishedAt)}
        </Badge>
      </div>

      {leadNews ? (
        <div className="pointer-events-none relative z-10 mt-4 rounded-lg border border-border/60 bg-background/60 p-3">
          <div className="flex items-start gap-2">
            <Newspaper className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">{leadNews.title}</p>
              {leadNews.source ? (
                <p className="mt-1 text-[11px] text-muted-foreground">{leadNews.source}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="pointer-events-none relative z-10 mt-4 text-sm leading-5 text-muted-foreground">
          Google Trends 暂时没有返回相关新闻。
        </p>
      )}

      <div className="relative z-20 mt-auto space-y-2 pt-4">
        {secondaryNews.map((newsItem) => (
          <NewsLink key={`${trend.id}-${newsItem.title}`} newsItem={newsItem} />
        ))}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="pointer-events-none text-[11px] text-muted-foreground">
            {trend.pictureSource ? `图片：${trend.pictureSource}` : "查看趋势详情"}
          </span>
          <Button asChild size="sm" variant="outline">
            <a href={trend.exploreUrl} target="_blank" rel="noopener noreferrer">
              Explore
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}

function NewsLink({ newsItem }: { newsItem: GoogleTrendNewsItem }) {
  if (!newsItem.url) {
    return (
      <p className="line-clamp-1 text-xs text-muted-foreground">
        {newsItem.source ? `${newsItem.source}：` : ""}
        {newsItem.title}
      </p>
    )
  }

  return (
    <a
      href={newsItem.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block line-clamp-1 text-xs text-muted-foreground transition-colors hover:text-primary"
    >
      {newsItem.source ? `${newsItem.source}：` : ""}
      {newsItem.title}
    </a>
  )
}

function GoogleTrendsEmptyState({ result }: { result: GoogleTrendsResult }) {
  return (
    <div className="mt-7 rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-primary">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-foreground">
        暂时无法展示当前热搜
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {result.message ?? "Google Trends 暂时没有返回可展示的数据。"}
      </p>
      <div className="mt-5">
        <Button asChild variant="outline">
          <a href="/google-trends">
            <RefreshCw className="h-4 w-4" />
            刷新页面
          </a>
        </Button>
      </div>
    </div>
  )
}

