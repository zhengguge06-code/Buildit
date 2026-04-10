import { type NextRequest } from "next/server"
import { redirect } from "next/navigation"
import { type EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const requestedNext = searchParams.get("next")
  const next = requestedNext?.startsWith("/") ? requestedNext : "/user/profile"

  if (!tokenHash || !type) {
    redirect("/auth/error?error=缺少必要的确认参数。")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  })

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  redirect(next)
}
