import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ErrorPageProps = {
  searchParams?: Promise<{ error?: string | string[] }>
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const params = (await searchParams) ?? {}
  const message = Array.isArray(params.error)
    ? params.error[0]
    : params.error || "认证过程中发生未知错误。"

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">认证失败</CardTitle>
            <CardDescription>请检查链接是否过期，或重新发起登录/注册流程。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
              {message}
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">返回登录页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
