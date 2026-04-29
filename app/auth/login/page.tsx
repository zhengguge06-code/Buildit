import { redirect } from "next/navigation"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { hasSupabaseEnv } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

export default async function LoginPage() {
  if (hasSupabaseEnv) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/user/profile")
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary/12 via-card to-accent/10 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute right-[-6rem] top-[-6rem] h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-4rem] left-[-4rem] h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-warm-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v18M19 3v18M5 12h14" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Buildit</span>
        </Link>
        <div className="relative max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">欢迎回来</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground">
            那些值得用的工具，
            <span className="italic text-primary"> 都在这里。</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            登录后可以提交工具、跟踪你发现的产品，也可以参与 Buildit 的共建。
          </p>
        </div>
        <p className="relative text-xs text-muted-foreground">© Buildit</p>
      </aside>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
