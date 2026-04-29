"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogoutButton } from "@/components/logout-button"
import { UserContentSkeleton } from "@/components/route-loading-skeletons"
import { createClient } from "@/lib/supabase/client"
import {
  getCachedUserProfile,
  setCachedUserProfile,
  type UserProfileSnapshot,
} from "@/lib/user-center-cache"

function formatDate(dateString?: string) {
  if (!dateString) {
    return "未知"
  }

  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getProfileSnapshot(user: {
  id: string
  email?: string
  created_at?: string
  user_metadata?: {
    full_name?: string
  }
}): UserProfileSnapshot {
  const email = user.email ?? "未获取到邮箱"
  const name = user.user_metadata?.full_name || email.split("@")[0] || "用户"

  return {
    id: user.id,
    email,
    name,
    createdAt: user.created_at,
  }
}

export function UserProfileClient() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfileSnapshot | null>(() => getCachedUserProfile())
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setHasError(false)

      try {
        const supabase = createClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          throw error
        }

        if (!user) {
          router.replace("/auth/login?next=/user/profile")
          return
        }

        const nextProfile = getProfileSnapshot(user)
        setCachedUserProfile(nextProfile)

        if (isMounted) {
          setProfile(nextProfile)
        }
      } catch {
        if (isMounted && !getCachedUserProfile()) {
          setHasError(true)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  if (!profile && !hasError) {
    return <UserContentSkeleton />
  }

  if (!profile && hasError) {
    return (
      <div className="rounded-md border px-6 py-12 text-center text-sm text-muted-foreground">
        个人信息加载失败，请稍后再试。
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex flex-col items-start gap-8 md:flex-row">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl">
            {profile.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">账户信息</h3>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">注册时间</dt>
              <dd>{formatDate(profile.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">用户 ID</dt>
              <dd className="max-w-[60%] truncate text-right">{profile.id}</dd>
            </div>
          </dl>
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="mb-4 text-lg font-medium">账户操作</h3>
          <LogoutButton redirectTo="/" variant="outline">
            退出登录
          </LogoutButton>
        </div>
      </div>
    </div>
  )
}
