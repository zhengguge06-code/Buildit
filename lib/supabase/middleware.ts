import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const protectedPrefixes = ["/user"]
const publicAuthPrefixes = ["/auth/login", "/auth/sign-up"]
const hasSupabaseEnv = Boolean(
  (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
)

function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
}

function getSupabasePublishableKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

type MiddlewareCookieOptions = Parameters<
  ReturnType<typeof NextResponse.next>["cookies"]["set"]
>[2]

type CookieToSet = {
  name: string
  value: string
  options?: MiddlewareCookieOptions
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

function isPublicAuthPath(pathname: string) {
  return publicAuthPrefixes.some((prefix) => pathname.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  if (!hasSupabaseEnv) {
    return response
  }

  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublishableKey()!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value)
          })

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value, cookie.options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    )
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublicAuthPath(pathname)) {
    const next = request.nextUrl.searchParams.get("next")
    const safeNext = next?.startsWith("/") ? next : "/user/profile"
    return NextResponse.redirect(new URL(safeNext, request.url))
  }

  return response
}
