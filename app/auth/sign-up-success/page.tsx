import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">注册成功</CardTitle>
            <CardDescription>请前往邮箱完成账户确认</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              我们已经向你的邮箱发送了确认邮件。点击邮件中的链接后，你会被带回站内并自动完成验证。
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/auth/login">返回登录页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
