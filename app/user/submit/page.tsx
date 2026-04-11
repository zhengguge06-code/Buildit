"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { hasSupabaseEnv } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "工具名称至少需要 2 个字符。",
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
      message: "工具简介至少需要 10 个字符。",
    })
    .max(200, {
      message: "工具简介不能超过 200 个字符。",
    }),
  fullDescription: z.string().min(50, {
    message: "详细介绍至少需要 50 个字符。",
  }),
  logoUrl: z.string().min(1, {
    message: "请上传 Logo。",
  }),
  previewImageUrl: z.string().min(1, {
    message: "请上传工具预览图。",
  }),
})

type CategoryOption = {
  id: string
  name: string
}

const defaultValues = {
  name: "",
  slug: "",
  websiteUrl: "",
  categoryId: "",
  description: "",
  fullDescription: "",
  logoUrl: "",
  previewImageUrl: "",
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

  useEffect(() => {
    let isMounted = true

    const initializePage = async () => {
      if (!hasSupabaseEnv) {
        if (isMounted) {
          setIsCheckingAuth(false)
          setIsLoadingCategories(false)
        }
        return
      }

      const supabase = createClient()
      const [
        {
          data: { user },
        },
        categoryResponse,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("tool_categories").select("id, name").order("created_at", { ascending: true }),
      ])

      if (!user) {
        router.replace(`/auth/login?next=${encodeURIComponent("/user/submit")}`)
        return
      }

      if (categoryResponse.error) {
        toast({
          title: "分类加载失败",
          description: categoryResponse.error.message,
          variant: "destructive",
        })
      }

      if (!isMounted) {
        return
      }

      setCategories(categoryResponse.data ?? [])
      setIsCheckingAuth(false)
      setIsLoadingCategories(false)
    }

    initializePage()

    return () => {
      isMounted = false
    }
  }, [router, toast])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hasSupabaseEnv) {
      toast({
        title: "提交未启用",
        description: "当前环境缺少 Supabase 配置，暂时无法提交。",
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

      const { error } = await supabase.from("tool_submissions").insert({
        name: values.name,
        slug: values.slug,
        description: values.description,
        full_description: values.fullDescription,
        website_url: values.websiteUrl,
        logo_url: values.logoUrl,
        preview_image_url: values.previewImageUrl,
        category_id: values.categoryId,
        user_id: user.id,
      })

      if (error) {
        throw error
      }

      toast({
        title: "提交成功",
        description: `${values.name} 已提交，等待管理员审核。`,
      })

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
    return <div className="max-w-3xl py-8 text-sm text-muted-foreground">正在检查登录状态...</div>
  }

  if (!hasSupabaseEnv) {
    return <div className="max-w-3xl py-8 text-sm text-muted-foreground">当前未配置数据库连接，暂时无法提交。</div>
  }

  return (
    <div>
      <div className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工具名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：AI 写作助手" {...field} />
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
                  <FormLabel>工具 Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：ai-writing-assistant" {...field} />
                  </FormControl>
                  <FormDescription>仅支持小写字母、数字和连字符，后续可作为详情页链接标识。</FormDescription>
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
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工具简介</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="简要描述这个工具的主要能力和适用场景。"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="详细介绍工具能力、亮点、使用方式和适用人群。"
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
                  <FormLabel>工具 Logo</FormLabel>
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
                  <FormLabel>工具预览图</FormLabel>
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

            <Button type="submit" disabled={isSubmitting || isLoadingCategories || categories.length === 0}>
              {isSubmitting ? "提交中..." : "提交工具"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
