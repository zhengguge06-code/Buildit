"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn, getPublicSiteOrigin, hasSupabaseEnv } from "@/lib/utils"

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get("next")
  const next = requestedNext?.startsWith("/") ? requestedNext : "/user/profile"
  const loginHref = next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasSupabaseEnv) {
      setError("请先在环境变量中配置 Supabase 再使用注册功能。")
      return
    }

    if (password !== repeatPassword) {
      setError("两次输入的密码不一致。")
      return
    }

    const supabase = createClient()
    const redirectUrl = new URL("/auth/confirm", getPublicSiteOrigin())
    redirectUrl.searchParams.set("next", next)

    setIsLoading(true)
    setError(null)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl.toString(),
        },
      })

      if (signUpError) {
        throw signUpError
      }

      router.replace("/auth/sign-up-success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请稍后再试。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">邮箱注册</CardTitle>
          <CardDescription>创建一个新的账户来提交和管理工具</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">确认密码</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                />
              </div>
              {!hasSupabaseEnv && (
                <p className="text-sm text-amber-600">
                  当前尚未配置 Supabase 环境变量，注册按钮会被禁用。
                </p>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading || !hasSupabaseEnv}>
                {isLoading ? "注册中..." : "注册"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              已经有账户了？{" "}
              <Link href={loginHref} className="underline underline-offset-4">
                去登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
