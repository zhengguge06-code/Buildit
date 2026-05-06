import type { Metadata } from "next"
import { ArrowUpRight, GitFork, Github, RefreshCw, Star, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getGitHubTrending,
  type GitHubTrendingRepository,
  type GitHubTrendingResult,
} from "@/lib/github-trending"

export const revalidate = 1800

export const metadata: Metadata = {
  title: "GitHub Trending · Buildit",
  description: "GitHub 今日热门开源仓库。",
}

const numberFormatter = new Intl.NumberFormat("en-US")

function formatCount(value: number) {
  return numberFormatter.format(value)
}

export default async function GitHubTrendingPage() {
  const result = await getGitHubTrending()
  const hasRepositories = result.repositories.length > 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-7 md:py-9">
        <section className="border-b border-border/70 pb-5">
          <div className="flex flex-col gap-4">
            <div className="max-w-3xl">
              <Badge variant="soft" className="gap-1 text-[11px] uppercase tracking-[0.18em]">
                <Github className="h-3 w-3" />
                GitHub Trending
              </Badge>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                GitHub Trending
              </h1>
            </div>
          </div>
        </section>

        {hasRepositories ? (
          <GitHubTrendingGrid repositories={result.repositories} />
        ) : (
          <GitHubTrendingEmptyState result={result} />
        )}
      </div>
    </div>
  )
}

function GitHubTrendingGrid({ repositories }: { repositories: GitHubTrendingRepository[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      {repositories.map((repository) => (
        <GitHubTrendingCard key={repository.id} repository={repository} />
      ))}
    </div>
  )
}

function GitHubTrendingCard({ repository }: { repository: GitHubTrendingRepository }) {
  return (
    <article className="group relative flex min-h-[14.5rem] flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-4 shadow-warm-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-warm">
      <a
        href={repository.repositoryUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`打开 GitHub 仓库 ${repository.fullName}`}
        className="absolute inset-0 z-0"
      />

      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-primary/8 text-primary">
          <Github className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <span className="line-clamp-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {repository.owner}
          </span>
          <h2 className="mt-2 line-clamp-2 font-serif text-lg font-semibold tracking-tight text-foreground">
            {repository.name}
          </h2>
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
      </div>

      <p className="pointer-events-none relative z-10 mt-3 line-clamp-3 min-h-[3.75rem] text-sm leading-5 text-muted-foreground">
        {repository.description ?? "GitHub Trending 暂时没有返回该仓库的描述。"}
      </p>

      <div className="pointer-events-none relative z-10 mt-3 flex flex-wrap gap-1.5">
        {repository.language ? (
          <Badge variant="outline" className="gap-1.5 text-[11px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: repository.languageColor ?? "currentColor" }}
            />
            {repository.language}
          </Badge>
        ) : null}
        <Badge variant="outline" className="gap-1 text-[11px]">
          <Star className="h-3 w-3" />
          {formatCount(repository.starsToday)} today
        </Badge>
      </div>

      <div className="relative z-20 mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="pointer-events-none flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3" />
            {formatCount(repository.starsCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            {formatCount(repository.forksCount)}
          </span>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={repository.repositoryUrl} target="_blank" rel="noopener noreferrer">
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </article>
  )
}

function GitHubTrendingEmptyState({ result }: { result: GitHubTrendingResult }) {
  return (
    <div className="mt-7 rounded-xl border border-dashed border-border bg-card/60 px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/8 text-primary">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <h2 className="mt-4 font-serif text-xl font-semibold tracking-tight text-foreground">
        暂时无法展示 GitHub Trending
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {result.message ?? "GitHub Trending 暂时没有返回可展示的数据。"}
      </p>
      <div className="mt-5">
        <Button asChild variant="outline">
          <a href="/github-trending">
            <RefreshCw className="h-4 w-4" />
            刷新页面
          </a>
        </Button>
      </div>
    </div>
  )
}

