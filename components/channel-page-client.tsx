"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import CategorySidebar from "@/components/category-sidebar"
import ToolCard from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import { FadeInUp } from "@/components/motion/fade"
import type { ChannelPageData } from "@/lib/ai-tools"

type ChannelPageClientProps = ChannelPageData

export default function ChannelPageClient({
  channel,
  categories,
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

  const placeholderText = "这个板块先预留，等我们把精选和热度规则补齐后再开放。"

  return (
    <div className="flex">
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onSubmitClick={handleSubmitClick}
      />

      <div className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-10 md:px-8 lg:px-12 lg:py-14">
        <FadeInUp>
          <section className="relative mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {channel.eyebrow}
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {channel.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {channel.description}
            </p>
            <div className="mt-7 h-px w-24 bg-gradient-to-r from-primary/60 to-transparent" />
          </section>
        </FadeInUp>

        <div className="mt-8 flex flex-wrap gap-2 md:hidden">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <FadeInUp delay={0.1}>
          <section className="mt-16">
            <SectionHeading title="本周新增" subtitle="先预留位置，后面再接真实运营规则。" />
            <EmptyHint>{placeholderText}</EmptyHint>
          </section>
        </FadeInUp>

        <FadeInUp delay={0.12}>
          <section className="mt-16">
            <SectionHeading title="当前热门" subtitle="先保留版位，等浏览和统计策略稳定后再开放。" />
            <EmptyHint>{placeholderText}</EmptyHint>
          </section>
        </FadeInUp>

        <FadeInUp delay={0.14}>
          <section className="mt-16">
            <SectionHeading title="分类浏览" subtitle="先按主分类浏览已收录的条目。" />

            <div className="mt-8 space-y-14">
              {categories.map((category) => {
                const categoryTools = toolsByCategory[category.id] ?? []

                return (
                  <section
                    key={category.id}
                    id={category.id}
                    ref={(element) => {
                      categoryRefs.current[category.id] = element
                    }}
                    className="scroll-mt-24"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card text-lg shadow-warm-sm">
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
                        <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          展示 {categoryTools.length} 个条目
                        </p>
                      </div>
                    </div>

                    {categoryTools.length > 0 ? (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {categoryTools.map((tool) => (
                          <ToolCard key={tool.id} tool={tool} />
                        ))}
                      </div>
                    ) : (
                      <EmptyHint>这个分类下暂时还没有条目。</EmptyHint>
                    )}
                  </section>
                )
              })}
            </div>
          </section>
        </FadeInUp>
      </div>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-7 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}
