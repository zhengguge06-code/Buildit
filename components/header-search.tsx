"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import type { SearchableTool } from "@/lib/ai-tools"

type HeaderSearchProps = {
  tools: SearchableTool[]
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase()
}

export function HeaderSearch({ tools }: HeaderSearchProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [keyword, setKeyword] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const normalizedKeyword = normalizeKeyword(keyword)
  const results =
    normalizedKeyword.length === 0
      ? []
      : tools
          .filter((tool) => {
            const haystack = `${tool.name} ${tool.description} ${tool.category} ${tool.slug} ${tool.channelLabel}`.toLowerCase()
            return haystack.includes(normalizedKeyword)
          })
          .slice(0, 6)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (results.length === 0) {
      return
    }

    setIsOpen(false)
    router.push(`/tool/${results[0].slug}`)
  }

  return (
    <div ref={containerRef} className="relative w-full md:w-80">
      <form onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          value={keyword}
          placeholder="搜索工具、产品和分类..."
          className="pl-8"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setKeyword(event.target.value)
            setIsOpen(true)
          }}
        />
      </form>

      <AnimatePresence>
        {isOpen && normalizedKeyword.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-12 z-50 w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-warm-lg"
          >
            {results.length > 0 ? (
              <div className="py-1.5">
                {results.map((tool, i) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <Link
                      href={`/tool/${tool.slug}`}
                      className="block px-4 py-2.5 transition-colors hover:bg-primary/8"
                      onClick={() => {
                        setIsOpen(false)
                        setKeyword("")
                      }}
                    >
                      <div className="text-sm font-medium text-foreground">{tool.name}</div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        <span className="text-primary">{tool.channelLabel}</span> · {tool.category} · {tool.description}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-muted-foreground">没有找到匹配的条目</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
