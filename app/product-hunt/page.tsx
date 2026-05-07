import type { Metadata } from "next"
import { ArrowUpRight, ExternalLink, MessageCircle, RefreshCw, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  PRODUCT_HUNT_TIME_ZONE,
  getProductHuntTodayPosts,
  type ProductHuntPostSummary,
  type ProductHuntTodayResult,
} from "@/lib/product-hunt"

export const revalidate = 900

export const metadata: Metadata = {
  title: "Product Hunt 今日热榜 · Buildit",
  description: "Product Hunt 今日热门产品。",
}

const numberFormatter = new Intl.NumberFormat("en-US")

function formatCount(value: number) {
  return numberFormatter.format(value)
}

function formatFetchedAt(dateString: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

export default async function ProductHuntPage() {
  const result = await getProductHuntTodayPosts()
  const hasPosts = result.posts.length > 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-7 md:py-9">
        <section className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="soft" className="text-[11px] uppercase tracking-[0.18em]">
                Product Hunt
              </Badge>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Product Hunt 今日热榜
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 px-2.5 py-1">
                上次请求：{formatFetchedAt(result.fetchedAt)}
              </span>
            </div>
          </div>
        </section>

        {hasPosts ? <ProductHuntGrid posts={result.posts} /> : <ProductHuntEmptyState result={result} />}
      </div>
    </div>
  )
}

function ProductHuntGrid({ posts }: { posts: ProductHuntPostSummary[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      {posts.map((post) => (
        <ProductHuntCard key={post.id} post={post} />
      ))}
    </div>
  )
}

function ProductHuntCard({ post }: { post: ProductHuntPostSummary }) {
  return (
    <article className="group relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-warm-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-warm">
      <a
        href={post.productHuntUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`打开 Product Hunt 上的 ${post.name}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background">
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-serif text-sm font-semibold tracking-tight text-foreground">
              {post.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Today
            </span>
          </div>
          <h2 className="mt-2 line-clamp-1 font-serif text-lg font-semibold tracking-tight text-foreground">
            {post.name}
          </h2>
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
      </div>

      <p className="pointer-events-none relative z-10 mt-3 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">
        {post.tagline}
      </p>

      <div className="pointer-events-none relative z-10 mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[11px]">
          {formatCount(post.votesCount)} votes
        </Badge>
        <Badge variant="outline" className="gap-1 text-[11px]">
          <MessageCircle className="h-3 w-3" />
          {formatCount(post.commentsCount)}
        </Badge>
      </div>

      <div className="relative z-20 mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="pointer-events-none text-[11px] text-muted-foreground">
          查看讨论与排名
        </span>
        {post.websiteUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={post.websiteUrl} target="_blank" rel="noopener noreferrer">
              官网
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function ProductHuntEmptyState({ result }: { result: ProductHuntTodayResult }) {
  return (
    <div className="mt-7 rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-primary">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-foreground">
        暂时无法展示今日热榜
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {result.message ?? "Product Hunt 今日热榜当前不可用，请稍后刷新。"}
      </p>
      <div className="mt-5">
        <Button asChild variant="outline">
          <a href="/product-hunt">
            <RefreshCw className="h-4 w-4" />
            刷新页面
          </a>
        </Button>
      </div>
    </div>
  )
}
