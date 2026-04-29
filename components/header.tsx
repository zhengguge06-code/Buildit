import Link from "next/link"
import { HeaderAuthControls } from "@/components/header-auth-controls"
import { HeaderSearch } from "@/components/header-search"
import { getSearchableTools } from "@/lib/ai-tools"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/utils"

export default async function Header() {
  let userEmail: string | null = null
  let userName: string | null = null

  const searchableTools = await getSearchableTools()

  if (hasSupabaseEnv) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    userEmail = user?.email ?? null
    userName =
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null) ??
      (user?.email ? user.email.split("@")[0] : null)
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-warm-sm transition-transform duration-300 group-hover:-rotate-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Buildit
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/vibe-tools"
              className="group relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              工具箱
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <Link
              href="/vibe-products"
              className="group relative rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              灵感库
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <HeaderSearch tools={searchableTools} />
          </div>
          <HeaderAuthControls
            enabled={hasSupabaseEnv}
            initialUserEmail={userEmail}
            initialUserName={userName}
          />
        </div>
      </div>
    </header>
  )
}
