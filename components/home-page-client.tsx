"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Wrench, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FadeInUp, StaggerGrid, StaggerItem } from "@/components/motion/fade"

interface ChannelInfo {
  href: string
  title: string
  description: string
  eyebrow: string
  Icon: typeof Wrench
}

const channels: ChannelInfo[] = [
  {
    href: "/vibe-tools",
    title: "Vibe 工具",
    description: "做产品时真正会用到的基础设施、平台与工作流工具，按场景与分类整理。",
    eyebrow: "构建",
    Icon: Wrench,
  },
  {
    href: "/vibe-products",
    title: "Vibe 产品",
    description: "已经上线的 Vibe Coding 产品与网站，用来找灵感、看表达、看结构。",
    eyebrow: "灵感",
    Icon: Lightbulb,
  },
]

interface HomePageClientProps {
  toolsCount?: number
  productsCount?: number
  categoriesCount?: number
}

export default function HomePageClient({
  toolsCount,
  productsCount,
  categoriesCount,
}: HomePageClientProps = {}) {
  return (
    <div className="relative overflow-hidden">
      {/* warm decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-8%] h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-10%] top-[30%] h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-32">
        {/* Hero */}
        <div className="mx-auto max-w-4xl text-center">
          <FadeInUp>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Vibe Hub · 整合站
            </span>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1 className="mt-8 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              做产品，<span className="italic text-primary">看工具</span>。
              <br className="hidden md:block" />
              找灵感，<span className="italic text-primary">看产品</span>。
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              首页只负责把你带到正确的频道里。
              做东西时去看 Vibe 工具，找方向时去看 Vibe 产品。
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/vibe-tools" className="group">
                  进入 Vibe 工具
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/vibe-products">进入 Vibe 产品</Link>
              </Button>
            </div>
          </FadeInUp>
        </div>

        {/* Channel cards */}
        <StaggerGrid className="mt-20 grid gap-6 lg:grid-cols-2">
          {channels.map(({ href, title, description, eyebrow, Icon }) => (
            <StaggerItem key={href}>
              <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
                <Link
                  href={href}
                  className="group relative block h-full overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-warm transition-all duration-300 hover:border-primary/40 hover:shadow-warm-lg md:p-10"
                >
                  {/* subtle gradient accent line */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                  <div className="flex flex-col gap-8">
                    <div className="flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" strokeWidth={1.6} />
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                        {eyebrow}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                        {title}
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-6 text-sm">
                      <span className="text-muted-foreground">进入频道</span>
                      <span className="inline-flex items-center gap-2 font-medium text-primary">
                        查看内容
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerGrid>

        {/* Stats band */}
        {(toolsCount || productsCount || categoriesCount) && (
          <FadeInUp delay={0.2}>
            <div className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70">
              {[
                { label: "Vibe 工具", value: toolsCount ?? 0 },
                { label: "Vibe 产品", value: productsCount ?? 0 },
                { label: "覆盖分类", value: categoriesCount ?? 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card px-6 py-8 text-center md:px-10 md:py-10"
                >
                  <div className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeInUp>
        )}

        {/* Submit CTA */}
        <FadeInUp delay={0.25}>
          <div className="mt-16 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/8 p-8 md:p-12">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  有想推荐的工具或产品？
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  我们欢迎社区一起共建 Vibe Hub。提交后会经过简单审核，通过后会出现在对应频道中。
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/user/submit" className="group">
                  提交条目
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </FadeInUp>
      </div>
    </div>
  )
}
