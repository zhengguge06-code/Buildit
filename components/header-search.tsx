"use client"

import Link from "next/link"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
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

      {isOpen && normalizedKeyword.length > 0 ? (
        <div className="absolute top-12 z-50 w-full rounded-md border bg-background shadow-md">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tool/${tool.slug}`}
                  className="block px-3 py-2 hover:bg-muted"
                  onClick={() => {
                    setIsOpen(false)
                    setKeyword("")
                  }}
                >
                  <div className="text-sm font-medium">{tool.name}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {tool.channelLabel} · {tool.category} · {tool.description}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">没有找到匹配的条目</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
