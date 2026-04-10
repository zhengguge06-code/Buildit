import { redirect } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/server"

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

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/user/profile")
  }

  const email = user.email ?? "未获取到邮箱"
  const name = user.user_metadata?.full_name || email.split("@")[0] || "用户"

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex flex-col items-start gap-8 md:flex-row">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="text-2xl">
            {name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-muted-foreground">{email}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">账户信息</h3>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">注册时间</dt>
              <dd>{formatDate(user.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">用户 ID</dt>
              <dd className="max-w-[60%] truncate text-right">{user.id}</dd>
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
