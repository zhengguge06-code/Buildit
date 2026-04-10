import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type ServerCookieOptions = Parameters<
  Awaited<ReturnType<typeof cookies>>["set"]
>[2]

type CookieToSet = {
  name: string
  value: string
  options?: ServerCookieOptions
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach((cookie) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            })
          } catch {
            // Server Components may attempt to set cookies during render.
            // The middleware refresh keeps the session in sync for those cases.
          }
        },
      },
    }
  )
}
