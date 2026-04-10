"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type HeaderAuthControlsProps = {
  enabled: boolean
  userEmail: string | null
}

export function HeaderAuthControls({
  enabled,
  userEmail,
}: HeaderAuthControlsProps) {
  const fallback = userEmail ? userEmail.slice(0, 1).toUpperCase() : "U"

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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="border-b px-3 py-2 text-sm text-muted-foreground">
          {userEmail}
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
