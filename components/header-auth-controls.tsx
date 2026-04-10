"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type HeaderAuthControlsProps = {
  enabled: boolean
  initialUserEmail: string | null
  initialUserName: string | null
}

function getUserName(user: User | null, fallbackEmail?: string | null) {
  const metadataName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null

  if (metadataName) {
    return metadataName
  }

  const email = user?.email ?? fallbackEmail ?? null
  return email ? email.split("@")[0] : null
}

export function HeaderAuthControls({
  enabled,
  initialUserEmail,
  initialUserName,
}: HeaderAuthControlsProps) {
  const [userEmail, setUserEmail] = useState(initialUserEmail)
  const [userName, setUserName] = useState(initialUserName)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const supabase = createClient()

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUserEmail(user?.email ?? null)
      setUserName(getUserName(user, user?.email))
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setUserEmail(user?.email ?? null)
      setUserName(getUserName(user, user?.email))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [enabled])

  const fallback = useMemo(() => {
    const text = userName || userEmail || "U"
    return text.slice(0, 1).toUpperCase()
  }, [userEmail, userName])

  if (!enabled) {
    return (
      <Button variant="outline" size="sm" disabled>
        未配置认证
      </Button>
    )
  }

  if (!userEmail) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">登录</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">注册</Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 gap-2 rounded-full px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-sm md:inline-block">
            {userName || userEmail}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="border-b px-3 py-2">
          <div className="truncate text-sm font-medium">{userName || "已登录用户"}</div>
          <div className="truncate text-xs text-muted-foreground">{userEmail}</div>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/user/profile">个人信息</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/submissions">提交历史</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/submit">提交工具</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-1">
          <LogoutButton className="w-full justify-start" redirectTo="/" variant="ghost">
            退出登录
          </LogoutButton>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
