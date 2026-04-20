import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { TrackToolView } from "@/components/track-tool-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getToolDetailBySlug } from "@/lib/ai-tools"

interface ToolPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params
  const tool = await getToolDetailBySlug(slug)

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">条目不存在</h1>
        <p className="mb-6 text-muted-foreground">你访问的条目不存在，或者暂时不可见。</p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TrackToolView toolId={tool.id} />

      <Link href={tool.channelHref} className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回 {tool.channelLabel}
      </Link>

      <div className="relative mb-8 h-64 w-full overflow-hidden rounded-[1.5rem]">
        <Image src={tool.previewImageUrl || "/placeholder.svg"} alt={tool.name} fill className="object-cover" priority />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
            <Image src={tool.logo} alt={tool.name} fill className="object-contain p-2" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{tool.channelLabel}</Badge>
              <Badge>{tool.category}</Badge>
              {tool.isHot && <Badge variant="secondary">当前热门</Badge>}
              {tool.isNew && <Badge variant="outline">本周新增</Badge>}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-[1.5rem] border border-black/10 bg-white/75 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">频道</p>
            <p className="mt-2 text-sm font-medium">{tool.channelLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">分类</p>
            <p className="mt-2 text-sm font-medium">{tool.category}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">近 7 天浏览</p>
            <p className="mt-2 text-sm font-medium">{tool.weeklyViews}</p>
          </div>
        </div>

        {tool.websiteUrl ? (
          <Button className="mb-8" asChild>
            <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
              打开官网
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : null}

        <div className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline underline-offset-4"
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
