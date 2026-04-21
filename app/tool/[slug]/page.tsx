import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ExternalLink, Eye, Flame, Sparkles } from "lucide-react"
import { TrackToolView } from "@/components/track-tool-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getToolDetailBySlug } from "@/lib/ai-tools"

interface ToolPageProps {
  params: Promise<{
    slug: string
  }>
}

const PLACEHOLDER_ASSET_SEGMENTS = ["placeholder-logo", "placeholder.jpg", "placeholder.svg"]

function isPlaceholderAssetUrl(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return PLACEHOLDER_ASSET_SEGMENTS.some((segment) => value.includes(segment))
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = await getToolDetailBySlug(slug)

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          条目不存在
        </h1>
        <p className="mt-3 text-muted-foreground">
          你访问的条目不存在，或者暂时不可见。
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button>返回首页</Button>
        </Link>
      </div>
    )
  }

  const hasPreview = Boolean(tool.previewImageUrl && !isPlaceholderAssetUrl(tool.previewImageUrl))
  const hasLogo = Boolean(tool.logo && !isPlaceholderAssetUrl(tool.logo))
  const logoFallback = tool.name.slice(0, 2).toUpperCase()

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <TrackToolView toolId={tool.id} />

      {/* Back link */}
      <Link
        href={tool.channelHref}
        className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground shadow-warm-sm transition-all hover:border-primary/40 hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        返回 {tool.channelLabel}
      </Link>

      {/* Preview image with gradient overlay */}
      {hasPreview && (
        <div className="relative mx-auto mt-6 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 shadow-warm-lg">
          <Image
            src={tool.previewImageUrl || "/placeholder.svg"}
            alt={tool.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl">
        {/* Tool header */}
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-warm-sm">
            {hasLogo ? (
              <Image
                src={tool.logo}
                alt={tool.name}
                fill
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-background font-serif text-xl font-semibold tracking-tight text-foreground">
                {logoFallback}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {tool.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{tool.channelLabel}</Badge>
              <Badge variant="soft">{tool.category}</Badge>
              {tool.isHot && (
                <Badge variant="soft" className="gap-1">
                  <Flame className="h-3 w-3" strokeWidth={2.2} />
                  当前热门
                </Badge>
              )}
              {tool.isNew && (
                <Badge variant="outline" className="gap-1 border-accent/40 text-accent">
                  <Sparkles className="h-3 w-3" strokeWidth={2.2} />
                  本周新增
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          {tool.description}
        </p>

        {/* Info grid */}
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <InfoCard label="频道" value={tool.channelLabel} />
          <InfoCard label="分类" value={tool.category} />
          <InfoCard
            label="近 7 天浏览"
            value={tool.weeklyViews}
            icon={<Eye className="h-3.5 w-3.5" />}
          />
        </div>

        {/* CTA */}
        {tool.websiteUrl ? (
          <div className="mt-10">
            <Button asChild size="lg">
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                打开官网
                <ExternalLink className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Button>
          </div>
        ) : null}

        {/* Markdown content */}
        <div className="markdown-content mt-12 border-t border-border/60 pt-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
                />
              ),
            }}
          >
            {tool.fullDescription}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-2 font-serif text-lg font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}
