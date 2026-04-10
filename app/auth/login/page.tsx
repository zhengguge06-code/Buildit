import { redirect } from "next/navigation"
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
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
