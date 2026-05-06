import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ExternalLink, Eye, Flame, Sparkles } from "lucide-react"
import { TrackToolView } from "@/components/track-tool-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSearchableTools, getToolDetailBySlug } from "@/lib/ai-tools"
import { normalizeMarkdownContent } from "@/lib/markdown"

interface ToolPageProps {
  params: Promise<{
    slug: string
  }>
}

const PLACEHOLDER_ASSET_SEGMENTS = ["placeholder-logo", "placeholder.jpg", "placeholder.svg"]

export const revalidate = 60

export async function generateStaticParams() {
  const tools = await getSearchableTools()

  return tools.map((tool) => ({
    slug: tool.slug,
  }))
}

function isPlaceholderAssetUrl(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return PLACEHOLDER_ASSET_SEGMENTS.some((segment) => value.includes(segment))
}

const badgeGroups = [
  { key: "reference", label: "值得借鉴", badgeKey: "referenceBadges" },
  { key: "capability", label: "能力特征", badgeKey: "capabilityBadges" },
  { key: "platform", label: "平台形态", badgeKey: "platformBadges" },
] as const

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = await getToolDetailBySlug(slug)

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-14 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          条目不存在
        </h1>
        <p className="mt-3 text-muted-foreground">
          你访问的条目不存在，或者暂时不可见。
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button>返回首页</Button>
        </Link>
      </div>
    )
  }

  const hasPreview = Boolean(tool.previewImageUrl && !isPlaceholderAssetUrl(tool.previewImageUrl))
  const hasLogo = Boolean(tool.logo && !isPlaceholderAssetUrl(tool.logo))
  const logoFallback = tool.name.slice(0, 2).toUpperCase()
  const renderableFullDescription = normalizeMarkdownContent(tool.fullDescription)

  return (
    <div className="container mx-auto px-4 py-7 md:py-9">
      <TrackToolView toolId={tool.id} />

      {/* Back link */}
      <Link
        href={tool.channelHref}
        className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground shadow-warm-sm transition-all hover:border-primary/40 hover:text-primary"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
        返回 {tool.channelLabel}
      </Link>

      {/* Preview image with gradient overlay */}
      {hasPreview && (
        <div className="relative mx-auto mt-4 aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl border border-border/60 shadow-warm-lg">
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

      <div className="mx-auto mt-7 max-w-3xl">
        {/* Tool header */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-warm-sm">
            {hasLogo ? (
              <Image
                src={tool.logo}
                alt={tool.name}
                fill
                className="object-contain p-2.5"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-background font-serif text-lg font-semibold tracking-tight text-foreground">
                {logoFallback}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              {tool.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="px-2 py-0.5 text-[11px]">
                {tool.channelLabel}
              </Badge>
              <Badge variant="soft" className="px-2 py-0.5 text-[11px]">
                {tool.category}
              </Badge>
              {tool.isHot && (
                <Badge variant="soft" className="gap-1 px-2 py-0.5 text-[11px]">
                  <Flame className="h-3 w-3" strokeWidth={2.2} />
                  当前热门
                </Badge>
              )}
              {tool.isNew && (
                <Badge variant="outline" className="gap-1 border-accent/40 px-2 py-0.5 text-[11px] text-accent">
                  <Sparkles className="h-3 w-3" strokeWidth={2.2} />
                  本周新增
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          {tool.description}
        </p>

        {badgeGroups.some(({ badgeKey }) => tool[badgeKey].length > 0) ? (
          <div className="mt-5 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-warm-sm">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              产品参考点
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {badgeGroups.map(({ key, label, badgeKey }) =>
                tool[badgeKey].length > 0 ? (
                  <div key={key}>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tool[badgeKey].map((badge) => (
                          <Badge
                            key={`${key}-${badge}`}
                            variant={key === "reference" ? "soft" : "outline"}
                            className="px-2 py-0.5 text-[11px]"
                          >
                            {badge}
                          </Badge>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ) : null}

        {/* Info grid */}
        <div className="mt-5 grid gap-2.5 md:grid-cols-3">
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
          <div className="mt-7">
            <Button asChild>
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
        <div className="markdown-content markdown-content-compact mt-8 border-t border-border/60 pt-7">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
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
            {renderableFullDescription}
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
    <div className="rounded-xl border border-border/70 bg-card p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 font-serif text-base font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}
