"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserContentSkeleton } from "@/components/route-loading-skeletons"
import { createClient } from "@/lib/supabase/client"
import { hasSupabaseEnv } from "@/lib/utils"
import {
  getCachedUserProfile,
  getCachedUserSubmissions,
  setCachedUserProfile,
  setCachedUserSubmissions,
  type UserSubmissionSnapshot,
} from "@/lib/user-center-cache"

type SubmissionRow = {
  id: string
  name: string
  status: "pending" | "approved" | "rejected" | string
  created_at: string
  channel_type?: string | null
  tool_id?: string | null
  ai_tool_id?: string | null
  tool?:
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

function getStatusBadge(status: UserSubmissionSnapshot["status"]) {
  if (status === "approved") {
    return <Badge>已发布</Badge>
  }

  if (status === "rejected") {
    return <Badge variant="destructive">未通过</Badge>
  }

  return <Badge variant="outline">审核中</Badge>
}

function getChannelLabel(channelType?: string | null) {
  return channelType === "vibe-products" ? "Vibe 产品" : "Vibe 工具"
}

function normalizeSubmission(row: SubmissionRow): UserSubmissionSnapshot {
  const tool = Array.isArray(row.tool) ? row.tool[0] : row.tool

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    channelType: row.channel_type,
    toolId: row.tool_id,
    aiToolId: row.ai_tool_id,
    toolSlug: tool?.slug ?? null,
  }
}

export function UserSubmissionsClient() {
  const router = useRouter()
  const cachedProfile = getCachedUserProfile()
  const [submissions, setSubmissions] = useState<UserSubmissionSnapshot[] | null>(() =>
    cachedProfile ? getCachedUserSubmissions(cachedProfile.id) : null
  )
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true
    const hadCachedSubmissions = submissions !== null

    const loadSubmissions = async () => {
      setHasError(false)

      if (!hasSupabaseEnv) {
        if (isMounted) {
          setSubmissions([])
        }
        return
      }

      try {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          router.replace("/auth/login?next=/user/submissions")
          return
        }

        const email = user.email ?? "未获取到邮箱"
        setCachedUserProfile({
          id: user.id,
          email,
          name: user.user_metadata?.full_name || email.split("@")[0] || "用户",
          createdAt: user.created_at,
        })

        const cached = getCachedUserSubmissions(user.id)

        if (cached && isMounted) {
          setSubmissions(cached)
        }

        const nextResponse = await supabase
          .from("tool_submissions")
          .select(
            `
              id,
              name,
              status,
              created_at,
              channel_type,
              tool_id,
              tool:tools!tool_submissions_tool_id_fkey (
                slug
              )
            `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        let rows = (nextResponse.data as SubmissionRow[] | null) ?? []
        let error = nextResponse.error

        if (error) {
          const legacyResponse = await supabase
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

          rows = (legacyResponse.data as SubmissionRow[] | null) ?? []
          error = legacyResponse.error
        }

        if (error) {
          throw error
        }

        const nextSubmissions = rows.map(normalizeSubmission)
        setCachedUserSubmissions(user.id, nextSubmissions)

        if (isMounted) {
          setSubmissions(nextSubmissions)
        }
      } catch {
        if (isMounted && !hadCachedSubmissions) {
          setHasError(true)
        }
      }
    }

    void loadSubmissions()

    return () => {
      isMounted = false
    }
  }, [router])

  if (!hasSupabaseEnv) {
    return (
      <div className="rounded-md border px-6 py-12 text-center">
        <h2 className="mb-2 text-2xl font-bold">我的提交</h2>
        <p className="text-sm text-muted-foreground">
          当前未配置数据库连接，暂时无法加载真实提交记录。
        </p>
      </div>
    )
  }

  if (!submissions && !hasError) {
    return <UserContentSkeleton />
  }

  if (!submissions && hasError) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold">我的提交</h2>
        <div className="rounded-md border px-6 py-12 text-center text-sm text-muted-foreground">
          提交记录加载失败，请稍后再试。
        </div>
      </div>
    )
  }

  const rows = submissions ?? []

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">我的提交</h2>

      {rows.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>所属频道</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((submission) => {
                const canView = submission.status === "approved" && Boolean(submission.toolSlug)

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.name}</TableCell>
                    <TableCell>{getChannelLabel(submission.channelType)}</TableCell>
                    <TableCell>{formatDate(submission.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-right">
                      {canView ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/tool/${submission.toolSlug}`} target="_blank">
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
          <p className="mb-6 text-muted-foreground">你还没有提交过任何条目。</p>
          <Button asChild>
            <Link href="/user/submit">提交条目</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
