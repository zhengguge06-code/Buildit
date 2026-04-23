"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ToolSummary } from "@/lib/ai-tools"

interface ToolCardProps {
  tool: ToolSummary
}

const MAX_VISIBLE_BADGES = 4

const spring = { type: "spring", stiffness: 400, damping: 25 } as const

function getDisplayBadges(tool: ToolSummary) {
  return [...tool.referenceBadges, ...tool.capabilityBadges, ...tool.platformBadges]
}

export default function ToolCard({ tool }: ToolCardProps) {
  const badges = getDisplayBadges(tool)
  const visibleBadges = badges.slice(0, MAX_VISIBLE_BADGES)
  const hiddenBadgeCount = Math.max(0, badges.length - visibleBadges.length)

  return (
    <motion.div
      whileHover="hover"
      initial="initial"
      animate="initial"
      variants={{ initial: { y: 0 }, hover: { y: -6 } }}
      transition={spring}
      className="h-full"
    >
      <Link
        href={`/tool/${tool.slug}`}
        className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-warm-sm transition-all duration-300 hover:border-primary/40 hover:shadow-warm"
      >
        <div className="flex items-start gap-4">
          <motion.div
            variants={{ initial: { scale: 1, rotate: 0 }, hover: { scale: 1.08, rotate: -4 } }}
            transition={spring}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background/60"
          >
            <Image
              src={tool.logo}
              alt={tool.name}
              fill
              className="object-contain p-1.5"
            />
          </motion.div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {tool.category}
            </p>
            <h3 className="mt-1 line-clamp-1 font-serif text-lg font-semibold tracking-tight text-foreground">
              {tool.name}
            </h3>
          </div>

          <motion.div
            variants={{ initial: { x: 0, y: 0 }, hover: { x: 2, y: -2 } }}
            transition={spring}
          >
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
          </motion.div>
        </div>

        <p className="line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
          {tool.description}
        </p>

        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleBadges.map((badge) => (
              <Badge key={`${tool.slug}-${badge}`} variant="soft" className="text-[11px]">
                {badge}
              </Badge>
            ))}
            {hiddenBadgeCount > 0 ? (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                +{hiddenBadgeCount}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </Link>
    </motion.div>
  )
}
