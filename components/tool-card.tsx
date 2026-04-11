import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ToolSummary } from "@/lib/ai-tools"

interface ToolCardProps {
  tool: ToolSummary
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link href={`/tool/${tool.slug}`} target="_blank">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
              <Image src={tool.logo} alt={tool.name} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="line-clamp-1 font-medium">{tool.name}</h3>
                {tool.isHot && <Badge variant="secondary">热门</Badge>}
                {tool.isNew && <Badge variant="outline">最新</Badge>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
