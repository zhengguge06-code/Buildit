"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import CategorySidebar from "@/components/category-sidebar"
import ToolCard from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import type { ChannelPageData } from "@/lib/ai-tools"

type ChannelPageClientProps = ChannelPageData

export default function ChannelPageClient({
  channel,
  categories,
  weeklyNewTools,
  hotTools,
  toolsByCategory,
}: ChannelPageClientProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleSubmitClick = () => {
    router.push("/user/submit")
  }

  const isImageIcon = (icon: string) =>
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/") ||
    icon.startsWith("data:image/")

  return (
    <div className="flex bg-[linear-gradient(180deg,#fbfaf7_0%,#ffffff_25%,#f7fafc_100%)]">
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onSubmitClick={handleSubmitClick}
      />

      <div className="min-h-[calc(100vh-4rem)] flex-1 overflow-auto px-4 py-8 md:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur md:p-10">
          <div className="absolute right-[-4rem] top-[-4rem] h-40 w-40 rounded-full bg-[#f5c98f]/25 blur-3xl" />
          <div className="absolute bottom-[-3rem] left-[-3rem] h-32 w-32 rounded-full bg-[#b8c9ff]/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">{channel.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{channel.description}</p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 md:hidden">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">本周新增</h2>
            </div>
          </div>
          {weeklyNewTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {weeklyNewTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-5 py-6 text-sm text-muted-foreground">
              这个频道最近 7 天还没有新的已发布条目。
            </p>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">当前热门</h2>
            </div>
          </div>
          {hotTools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hotTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-5 py-6 text-sm text-muted-foreground">
              当前还没有可展示的热门数据。
            </p>
          )}
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">分类浏览</h2>
          </div>

          <div className="space-y-10">
            {categories.map((category) => {
              const categoryTools = toolsByCategory[category.id] ?? []

              return (
                <section
                  key={category.id}
                  id={category.id}
                  ref={(element) => {
                    categoryRefs.current[category.id] = element
                  }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white text-lg">
                      {category.icon ? (
                        isImageIcon(category.icon) ? (
                          <Image
                            src={category.icon}
                            alt={category.name}
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <span>{category.icon}</span>
                        )
                      ) : (
                        "•"
                      )}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{category.name}</h3>
                      <p className="text-sm text-slate-500">浏览这个分类下的条目</p>
                    </div>
                  </div>

                  {categoryTools.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {categoryTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-5 py-6 text-sm text-muted-foreground">
                      这个分类下暂时还没有条目。
                    </p>
                  )}
                </section>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
