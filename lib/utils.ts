import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPublicSiteOrigin() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : ""
  const candidate = configuredSiteUrl || fallbackOrigin

  if (!candidate) {
    return ""
  }

  try {
    return new URL(candidate).origin
  } catch {
    try {
      return new URL(`https://${candidate.replace(/^\/+/, "")}`).origin
    } catch {
      return fallbackOrigin
    }
  }
}

export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
)
