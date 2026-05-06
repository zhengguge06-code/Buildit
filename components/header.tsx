import Link from "next/link"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { HeaderSearch } from "@/components/header-search"
import { hasSupabaseEnv } from "@/lib/utils"

const navLinkClass =
  "group relative shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs leading-none text-muted-foreground transition-colors hover:text-foreground"

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-warm-sm transition-transform duration-300 group-hover:-rotate-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3v18" />
                <path d="M19 3v18" />
                <path d="M5 12h14" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
              Buildit
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center gap-0.5 md:flex">
            <Link href="/vibe-tools" className={navLinkClass}>
              工具箱
              <span className="absolute inset-x-2 -bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link href="/vibe-products" className={navLinkClass}>
              灵感库
              <span className="absolute inset-x-2 -bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link href="/product-hunt" className={navLinkClass}>
              Product Hunt
              <span className="absolute inset-x-2 -bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link href="/github-trending" className={navLinkClass}>
              GitHub Trending
              <span className="absolute inset-x-2 -bottom-1 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden lg:block">
            <HeaderSearch />
          </div>
          <HeaderAuthControls
            enabled={hasSupabaseEnv}
            initialUserEmail={null}
            initialUserName={null}
          />
        </div>
      </div>
    </header>
  )
}

