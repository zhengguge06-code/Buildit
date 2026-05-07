"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { FileUploader } from "@/components/file-uploader"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { SubmitFormSkeleton } from "@/components/route-loading-skeletons"
import type { ChannelType } from "@/lib/ai-tools"
import { fallbackCategories } from "@/lib/data"
import { createClient } from "@/lib/supabase/client"
import { invalidateUserSubmissionsCache } from "@/lib/user-center-cache"
import { hasSupabaseEnv } from "@/lib/utils"

const SHORT_DESCRIPTION_MAX_LENGTH = 50

const formSchema = z.object({
  channelType: z.enum(["vibe-tools", "vibe-products"], {
    message: "请选择投稿频道。",
  }),
  name: z.string().min(2, {
    message: "名称至少需要 2 个字符。",
  }),
  slug: z
    .string()
    .min(2, {
      message: "Slug 至少需要 2 个字符。",
    })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug 只能包含小写字母、数字和连字符。",
    }),
  websiteUrl: z.string().url({
    message: "请输入有效的网址。",
  }),
  categoryId: z.string().min(1, {
    message: "请选择一个分类。",
  }),
  description: z
    .string()
    .min(10, {
      message: "简介至少需要 10 个字符。",
    })
    .max(SHORT_DESCRIPTION_MAX_LENGTH, {
      message: `简介不能超过 ${SHORT_DESCRIPTION_MAX_LENGTH} 个字符。`,
    }),
  fullDescription: z.string().min(50, {
    message: "详细介绍至少需要 50 个字符。",
  }),
  logoUrl: z.string().min(1, {
    message: "请上传 Logo。",
  }),
  previewImageUrl: z.string().min(1, {
    message: "请上传预览图。",
  }),
})

type CategoryOption = {
  id: string
  name: string
  channelType: ChannelType
}

const defaultValues: z.infer<typeof formSchema> = {
  channelType: "vibe-tools",
  name: "",
  slug: "",
  websiteUrl: "",
  categoryId: "",
  description: "",
  fullDescription: "",
  logoUrl: "",
  previewImageUrl: "",
}

const categoryOrder = new Map<string, number>(
  fallbackCategories.map((category, index) => [category.name, index])
)

function normalizeChannelType(value: string | null | undefined): ChannelType {
  return value === "vibe-products" ? "vibe-products" : "vibe-tools"
}

function normalizeCategoryName(name: string) {
  if (name === "AI IDE" || name === "AI 编程环境") {
    return "AI 编程智能体"
  }

  if (name === "灵感原型") {
    return "设计与原型"
  }

  if (name === "页面生成") {
    return "界面生成"
  }

  if (name === "全栈构建") {
    return "全栈应用构建"
  }

  return name
}

function getChannelLabel(channelType: ChannelType) {
  return channelType === "vibe-products" ? "Vibe 产品" : "Vibe 工具"
}

function getChannelHint(channelType: ChannelType) {
  return channelType === "vibe-products"
    ? "你提交的是值得参考的真实产品案例。这里先只选一个主分类，badge 由后台后续补充。"
    : "你提交的是用来构建产品的基础设施、平台或工作流工具。"
}

function sortCategoryOptions(categories: CategoryOption[]) {
  return [...categories].sort((a, b) => {
    const aOrder = categoryOrder.get(a.name) ?? 999
    const bOrder = categoryOrder.get(b.name) ?? 999

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    return a.name.localeCompare(b.name, "zh-CN")
  })
}

export default function SubmitPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const selectedChannelType = form.watch("channelType")

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.channelType === selectedChannelType),
    [categories, selectedChannelType]
  )

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      if (!hasSupabaseEnv) {
        if (isMounted) {
          setCategories(
            sortCategoryOptions(
              fallbackCategories.map((category) => ({
                id: category.id,
                name: normalizeCategoryName(category.name),
                channelType: normalizeChannelType(category.channelType),
              }))
            )
          )
          setIsCheckingAuth(false)
          setIsLoadingCategories(false)
        }
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent("/user/submit")}`)
        return
      }

      const categoryResponse = await supabase
        .from("tool_categories")
        .select("id, name, channel_type")
        .order("created_at", { ascending: true })

      let categoryOptions: CategoryOption[] = []

      if (!categoryResponse.error && categoryResponse.data) {
        const rows = categoryResponse.data as { id: string; name: string; channel_type?: string | null }[]
        const vibeToolCategories = rows
          .filter((category) => normalizeChannelType(category.channel_type) === "vibe-tools")
          .map((category) => ({
            id: category.id,
            name: normalizeCategoryName(category.name),
            channelType: "vibe-tools" as ChannelType,
          }))
        const vibeProductCategories = rows
          .filter((category) => normalizeChannelType(category.channel_type) === "vibe-products")
          .map((category) => ({
            id: category.id,
            name: normalizeCategoryName(category.name),
            channelType: "vibe-products" as ChannelType,
          }))

        categoryOptions = [...vibeToolCategories, ...vibeProductCategories]
      } else {
        const legacyResponse = await supabase.from("tool_categories").select("id, name").order("created_at", { ascending: true })

        if (!legacyResponse.error && legacyResponse.data) {
          categoryOptions = (legacyResponse.data as { id: string; name: string }[]).map((category) => ({
            id: category.id,
            name: normalizeCategoryName(category.name),
            channelType: "vibe-tools",
          }))
        } else {
          toast({
            title: "分类加载失败",
            description:
              categoryResponse.error?.message || legacyResponse.error?.message || "暂时无法加载分类。",
            variant: "destructive",
          })
        }
      }

      if (!isMounted) {
        return
      }

      setCategories(sortCategoryOptions(categoryOptions))
      setIsCheckingAuth(false)
      setIsLoadingCategories(false)
    }

    void initializePage()

    return () => {
      isMounted = false
    }
  }, [router, toast])

  useEffect(() => {
    const currentCategoryId = form.getValues("categoryId")

    if (!currentCategoryId) {
      return
    }

    const isValidCategory = visibleCategories.some((category) => category.id === currentCategoryId)

    if (!isValidCategory) {
      form.setValue("categoryId", "")
    }
  }, [form, selectedChannelType, visibleCategories])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hasSupabaseEnv) {
      toast({
        title: "投稿未启用",
        description: "当前环境缺少数据库配置，暂时无法投稿。",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent("/user/submit")}`)
        return
      }

      const insertPayload = {
        channel_type: values.channelType,
        name: values.name,
        slug: values.slug,
        description: values.description,
        full_description: values.fullDescription,
        website_url: values.websiteUrl,
        logo_url: values.logoUrl,
        preview_image_url: values.previewImageUrl,
        category_id: values.categoryId,
        user_id: user.id,
      }

      let error: Error | null = null

      const nextInsert = await supabase.from("tool_submissions").insert(insertPayload)

      if (nextInsert.error) {
        const legacyInsert = await supabase.from("tool_submissions").insert({
          ...insertPayload,
          channel_type: undefined,
        })

        error = legacyInsert.error
      }

      if (error) {
        throw error
      }

      toast({
        title: "提交成功",
        description: `${values.name} 已提交到 ${getChannelLabel(values.channelType)}，等待管理员审核。`,
      })

      invalidateUserSubmissionsCache(user.id)
      router.push("/user/submissions")
      router.refresh()
    } catch (error) {
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败，请稍后重试。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return <SubmitFormSkeleton />
  }

  if (!hasSupabaseEnv) {
    return <div className="max-w-3xl py-8 text-sm text-muted-foreground">当前未配置数据库连接，暂时无法投稿。</div>
  }

  return (
    <div>
      <div className="max-w-3xl">
        <div className="mb-8 rounded-[1.5rem] border border-black/10 bg-white/75 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Submission</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">提交条目</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            先选频道，再选主分类，再补全条目信息。这样频道归属、分类浏览和后续审核都会更清楚。
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="channelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>投稿频道</FormLabel>
                  <Select onValueChange={(value) => field.onChange(normalizeChannelType(value))} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择投稿频道" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vibe-tools">Vibe 工具</SelectItem>
                      <SelectItem value="vibe-products">Vibe 产品</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{getChannelHint(selectedChannelType)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：Cursor 或 Linear" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：cursor 或 vibe-product-example" {...field} />
                  </FormControl>
                  <FormDescription>只支持小写字母、数字和连字符，后续会作为详情页链接标识。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>官网地址</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCategories ? "正在加载分类..." : "选择分类"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibleCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedChannelType === "vibe-products"
                      ? "当前只显示 Vibe 产品的 7 个主分类。badge 暂时不开放投稿时填写。"
                      : `当前只显示 ${getChannelLabel(selectedChannelType)} 的分类。`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>简介</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        selectedChannelType === "vibe-products"
                          ? "简要描述这个产品是什么类型、适合参考哪里，或它为什么值得被收录。"
                          : "简要描述这个条目的主要能力、用途，或它为什么值得参考。"
                      }
                      maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    建议控制在 {SHORT_DESCRIPTION_MAX_LENGTH} 字以内，列表卡片可以完整展示。当前{" "}
                    {field.value.length}/{SHORT_DESCRIPTION_MAX_LENGTH}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>详细介绍</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        selectedChannelType === "vibe-products"
                          ? "详细介绍这个产品的定位、核心体验、适合借鉴的部分，或者你觉得最值得拆的地方。"
                          : "详细介绍能力、亮点、适用人群、使用方式，或者你觉得最值得看的地方。"
                      }
                      className="min-h-[440px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onChange={field.onChange}
                      bucket="tool-logos"
                      pathPrefix="submissions/logos"
                      accept="image/*"
                      maxSize={2 * 1024 * 1024}
                      previewHeight={100}
                      previewWidth={100}
                    />
                  </FormControl>
                  <FormDescription>支持常见图片格式，大小不超过 2MB。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previewImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预览图</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onChange={field.onChange}
                      bucket="tool-previews"
                      pathPrefix="submissions/previews"
                      accept="image/*"
                      maxSize={5 * 1024 * 1024}
                      previewHeight={200}
                      previewWidth={400}
                    />
                  </FormControl>
                  <FormDescription>支持常见图片格式，大小不超过 5MB。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || isLoadingCategories || visibleCategories.length === 0}>
              {isSubmitting ? "提交中..." : "提交条目"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
