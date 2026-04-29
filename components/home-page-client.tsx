"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from "framer-motion"
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
    title: "工具箱",
    description: "实用工具箱，让效率触手可及",
    eyebrow: "构建",
    Icon: Wrench,
  },
  {
    href: "/vibe-products",
    title: "灵感库",
    description: "灵感收藏夹，为创意续航充电",
    eyebrow: "灵感",
    Icon: Lightbulb,
  },
]

function ScatterChar({ char, mousePos }: { char: string; mousePos: { x: number; y: number } | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 400, damping: 28 })
  const springY = useSpring(y, { stiffness: 400, damping: 28 })

  useEffect(() => {
    if (!mousePos || !ref.current) {
      x.set(0)
      y.set(0)
      return
    }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = cx - mousePos.x
    const dy = cy - mousePos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const radius = 72
    if (dist < radius) {
      const force = (1 - dist / radius) * 18
      x.set((dx / dist) * force)
      y.set((dy / dist) * force)
    } else {
      x.set(0)
      y.set(0)
    }
  }, [mousePos, x, y])

  return (
    <motion.span ref={ref} style={{ x: springX, y: springY, display: "inline-block" }}>
      {char === " " ? "\u00A0" : char}
    </motion.span>
  )
}

function TiltCard({ href, title, description, eyebrow, Icon }: ChannelInfo) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // 更柔的 spring：惯性感更强，不再抖动
  const springConfig = { stiffness: 180, damping: 22 }
  const rotateXRaw = useTransform(y, [-0.5, 0.5], [5, -5])
  const rotateYRaw = useTransform(x, [-0.5, 0.5], [-5, 5])
  const rotateX = useSpring(rotateXRaw, springConfig)
  const rotateY = useSpring(rotateYRaw, springConfig)

  // 用 transform 字符串触发 GPU 硬件加速（替代 shorthand rotateX/Y）
  const cardTransform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  // 鼠标跟随的背景光晕
  const glowBackground = useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(201, 100, 66, 0.08), transparent 70%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    x.set(relX / rect.width - 0.5)
    y.set(relY / rect.height - 0.5)
    mouseX.set(relX)
    mouseY.set(relY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ transform: cardTransform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={href}
        className="group relative block h-full overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-warm transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/40 hover:shadow-warm-lg active:scale-[0.985] md:p-10"
      >
        {/* 鼠标跟随光晕层 */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />

        {/* 顶部光边：hover 时点亮 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* 内容层，整体浮起 */}
        <div className="relative flex flex-col gap-8" style={{ transform: "translateZ(24px)" }}>
          <div className="flex items-start justify-between">
            {/* 图标：hover 时轻微放大 + 微转 */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-[transform,background-color,color] duration-300 group-hover:scale-[1.08] group-hover:-rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
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
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-6 text-sm">
            <span className="text-muted-foreground">进入频道</span>
            {/* 箭头：平移 + 淡入双重过渡 */}
            <span className="inline-flex items-center gap-2 font-medium text-primary">
              查看内容
              <ArrowRight className="h-4 w-4 opacity-50 transition-[transform,opacity] duration-300 group-hover:translate-x-1.5 group-hover:opacity-100" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

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
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }
  const handleMouseLeave = () => setMousePos(null)

  const heroTitle = "Just Buildit"

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-12%] top-[-8%] h-[36rem] w-[36rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-[-10%] top-[30%] h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <FadeInUp>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Buildit
            </span>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1
              ref={heroRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="mt-8 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl"
            >
              <span className="block">
                {heroTitle.split("").map((char, i) => (
                  <ScatterChar key={`hero-${i}`} char={char} mousePos={mousePos} />
                ))}
              </span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              做产品，看工具；找灵感，看产品
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/vibe-tools" className="group">
                  进入工具箱
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/vibe-products">进入灵感库</Link>
              </Button>
            </div>
          </FadeInUp>
        </div>

        <StaggerGrid className="mt-20 grid gap-6 lg:grid-cols-2">
          {channels.map((channel) => (
            <StaggerItem key={channel.href}>
              <TiltCard {...channel} />
            </StaggerItem>
          ))}
        </StaggerGrid>

        {(toolsCount || productsCount || categoriesCount) && (
          <FadeInUp delay={0.2}>
            <div className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-3xl border border-border/70 bg-border/70">
              {[
                { label: "工具", value: toolsCount ?? 0 },
                { label: "产品", value: productsCount ?? 0 },
                { label: "分类", value: categoriesCount ?? 0 },
              ].map((stat) => (
                <div key={stat.label} className="bg-card px-6 py-8 text-center md:px-10 md:py-10">
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

        <FadeInUp delay={0.25}>
          <div className="mt-16 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-accent/8 p-8 md:p-12">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  发现了好东西想推荐？
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  发现了值得收录的工具或产品，欢迎提交！
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
