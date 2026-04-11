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
    <header className="fixed left-0 right-0 top-0 z-50 border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
            </div>
            <span className="text-xl font-bold">AI 工具集</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
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
