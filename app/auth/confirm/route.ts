import { type NextRequest, NextResponse } from "next/server"
import { type EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

function getSafeNext(request: NextRequest) {
  const requestedNext = request.nextUrl.searchParams.get("next")

  return requestedNext?.startsWith("/") ? requestedNext : "/user/profile"
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url))
}

function redirectToError(request: NextRequest, message: string) {
  return redirectTo(
    request,
    `/auth/error?error=${encodeURIComponent(message)}`
  )
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null
  const next = getSafeNext(request)
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return redirectToError(request, error.message)
    }

    return redirectTo(request, next)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (error) {
      return redirectToError(request, error.message)
    }

    return redirectTo(request, next)
  }

  return redirectToError(request, "Invalid or expired confirmation link.")
}
