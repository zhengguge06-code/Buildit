import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { ToolSummary } from "@/lib/ai-tools"

interface ToolCardProps {
  tool: ToolSummary
}

export default function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link href={`/tool/${tool.slug}`}>
      <Card className="h-full overflow-hidden border-black/10 bg-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-black/5 bg-slate-50">
              <Image src={tool.logo} alt={tool.name} fill className="object-contain p-1" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{tool.category}</p>
              <h3 className="line-clamp-1 font-medium">{tool.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tool.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
