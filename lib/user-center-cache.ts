"use client"

export type UserProfileSnapshot = {
  id: string
  email: string
  name: string
  createdAt?: string
}

export type UserSubmissionSnapshot = {
  id: string
  name: string
  status: "pending" | "approved" | "rejected" | string
  createdAt: string
  channelType?: string | null
  toolId?: string | null
  aiToolId?: string | null
  toolSlug?: string | null
}

const PROFILE_STORAGE_KEY = "buildit:user-profile:v1"
const SUBMISSIONS_STORAGE_PREFIX = "buildit:user-submissions:v1:"

let profileCache: UserProfileSnapshot | null = null
const submissionsCache = new Map<string, UserSubmissionSnapshot[]>()

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null
  }

  try {
    const value = window.sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Cache writes are best-effort only.
  }
}

export function getCachedUserProfile() {
  if (profileCache) {
    return profileCache
  }

  profileCache = readJson<UserProfileSnapshot>(PROFILE_STORAGE_KEY)
  return profileCache
}

export function setCachedUserProfile(profile: UserProfileSnapshot) {
  profileCache = profile
  writeJson(PROFILE_STORAGE_KEY, profile)
}

export function getCachedUserSubmissions(userId: string) {
  const cached = submissionsCache.get(userId)

  if (cached) {
    return cached
  }

  const stored = readJson<UserSubmissionSnapshot[]>(`${SUBMISSIONS_STORAGE_PREFIX}${userId}`)

  if (stored) {
    submissionsCache.set(userId, stored)
  }

  return stored
}

export function setCachedUserSubmissions(userId: string, submissions: UserSubmissionSnapshot[]) {
  submissionsCache.set(userId, submissions)
  writeJson(`${SUBMISSIONS_STORAGE_PREFIX}${userId}`, submissions)
}

export function invalidateUserSubmissionsCache(userId?: string) {
  if (userId) {
    submissionsCache.delete(userId)

    if (canUseStorage()) {
      window.sessionStorage.removeItem(`${SUBMISSIONS_STORAGE_PREFIX}${userId}`)
    }

    return
  }

  submissionsCache.clear()

  if (!canUseStorage()) {
    return
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index)

    if (key?.startsWith(SUBMISSIONS_STORAGE_PREFIX)) {
      window.sessionStorage.removeItem(key)
    }
  }
}

export function clearUserCenterCache() {
  profileCache = null
  invalidateUserSubmissionsCache()

  if (canUseStorage()) {
    window.sessionStorage.removeItem(PROFILE_STORAGE_KEY)
  }
}
