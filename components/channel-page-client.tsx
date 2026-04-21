"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import CategorySidebar from "@/components/category-sidebar"
import ToolCard from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import { FadeInUp, StaggerGrid, StaggerItem } from "@/components/motion/fade"
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
    <div className="flex">
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onSubmitClick={handleSubmitClick}
      />

      <div className="min-h-[calc(100vh-4rem)] flex-1 px-4 py-10 md:px-8 lg:px-12 lg:py-14">
        {/* Hero */}
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

        {/* Mobile category pills */}
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

        {/* Weekly new */}
        <FadeInUp delay={0.1}>
          <section className="mt-16">
            <SectionHeading
              eyebrow="01"
              title="本周新增"
              subtitle="过去 7 天内最新发布的条目"
            />
            {weeklyNewTools.length > 0 ? (
              <StaggerGrid className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {weeklyNewTools.map((tool) => (
                  <StaggerItem key={tool.id} className="h-full">
                    <ToolCard tool={tool} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            ) : (
              <EmptyHint>这个频道最近 7 天还没有新的已发布条目。</EmptyHint>
            )}
          </section>
        </FadeInUp>

        {/* Hot */}
        <FadeInUp delay={0.1}>
          <section className="mt-16">
            <SectionHeading
              eyebrow="02"
              title="当前热门"
              subtitle="近期访问量最高的条目"
            />
            {hotTools.length > 0 ? (
              <StaggerGrid className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {hotTools.map((tool) => (
                  <StaggerItem key={tool.id} className="h-full">
                    <ToolCard tool={tool} />
                  </StaggerItem>
                ))}
              </StaggerGrid>
            ) : (
              <EmptyHint>当前还没有可展示的热门数据。</EmptyHint>
            )}
          </section>
        </FadeInUp>

        {/* Browse by category */}
        <FadeInUp delay={0.1}>
          <section className="mt-16">
            <SectionHeading
              eyebrow="03"
              title="分类浏览"
              subtitle="按主题浏览所有已收录条目"
            />

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
                          共 {categoryTools.length} 个条目
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

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="font-serif text-3xl font-semibold italic text-primary/70">
          {eyebrow}
        </span>
        <div>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
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
