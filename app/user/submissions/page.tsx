import Link from "next/link"
import { redirect } from "next/navigation"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/utils"

type SubmissionRow = {
  id: string
  name: string
  status: "pending" | "approved" | "rejected" | string
  created_at: string
  ai_tool_id: string | null
  tool:
    | {
        slug: string | null
      }
    | {
        slug: string | null
      }[]
    | null
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusBadge(status: SubmissionRow["status"]) {
  if (status === "approved") {
    return <Badge>已发布</Badge>
  }

  if (status === "rejected") {
    return <Badge variant="destructive">未通过</Badge>
  }

  return <Badge variant="outline">审核中</Badge>
}

export default async function SubmissionsPage() {
  if (!hasSupabaseEnv) {
    return (
      <div className="rounded-md border px-6 py-12 text-center">
        <h2 className="mb-2 text-2xl font-bold">我的提交</h2>
        <p className="text-sm text-muted-foreground">当前未配置数据库连接，暂时无法加载真实提交数据。</p>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/user/submissions")
  }

  const { data, error } = await supabase
    .from("tool_submissions")
    .select(
      `
        id,
        name,
        status,
        created_at,
        ai_tool_id,
        tool:ai_tools!tool_submissions_ai_tool_id_fkey (
          slug
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold">我的提交</h2>
        <div className="rounded-md border px-6 py-12 text-center text-sm text-muted-foreground">
          提交记录加载失败，请稍后再试。
        </div>
      </div>
    )
  }

  const submissions = (data as SubmissionRow[] | null) ?? []

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">我的提交</h2>

      {submissions.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工具名称</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => {
                const tool = Array.isArray(submission.tool) ? submission.tool[0] : submission.tool
                const canView = submission.status === "approved" && Boolean(tool?.slug)

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell>{formatDate(submission.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      {canView ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tool/${tool?.slug}`} target="_blank">
                            <Eye className="mr-1 h-4 w-4" />
                            查看
                          </Link>
                        </Button>
                      ) : (
                        "--"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border py-12 text-center">
          <h3 className="mb-2 text-lg font-medium">暂无提交记录</h3>
          <p className="mb-6 text-muted-foreground">您还没有提交过任何 AI 工具</p>
          <Button asChild>
            <Link href="/user/submit">提交工具</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
