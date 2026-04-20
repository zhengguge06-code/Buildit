import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const channels = [
  {
    href: "/vibe-tools",
    title: "Vibe 工具",
    description: "做产品时真正会用到的基础设施、平台与工作流工具。",
  },
  {
    href: "/vibe-products",
    title: "Vibe 产品",
    description: "已经上线的 Vibe Coding 产品与网站，用来找灵感、看表达、看结构。",
  },
]

export default function HomePageClient() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(180deg,#f7f4ed_0%,#ffffff_45%,#f4f7fb_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-8%] h-[32rem] w-[32rem] rounded-full bg-[#f5c98f]/25 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] h-[28rem] w-[28rem] rounded-full bg-[#a8d6d1]/25 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[18%] h-[24rem] w-[24rem] rounded-full bg-[#b8c9ff]/20 blur-3xl" />
      </div>

      <div className="relative container mx-auto flex min-h-[calc(100vh-4rem)] flex-col justify-center px-4 py-16 md:py-24">
        <div className="max-w-4xl">
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl md:text-6xl">
            做产品，看工具。
            <br className="hidden md:block" />
            找灵感，看产品。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            首页只负责把你带到正确的频道里。做东西时去看 Vibe 工具，找方向时去看 Vibe 产品。
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {channels.map((channel) => (
            <Link
              key={channel.href}
              href={channel.href}
              className="group relative overflow-hidden rounded-[2rem] border border-black/10 bg-white/75 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />
              <div className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">{channel.title}</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">{channel.description}</p>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-black/10 pt-6 text-sm text-slate-700">
                  <span>进入频道</span>
                  <span className="inline-flex items-center gap-2 font-medium text-slate-950">
                    查看内容
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/vibe-tools">进入 Vibe 工具</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-black/15 bg-white/70 px-6">
            <Link href="/vibe-products">进入 Vibe 产品</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
