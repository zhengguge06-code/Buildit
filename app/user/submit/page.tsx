"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { categories } from "@/lib/data"
import { FileUploader } from "@/components/file-uploader"

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
  url: z.string().url({
    message: "请输入有效的 URL。",
  }),
  category: z.string().min(1, {
    message: "请选择一个分类。",
  }),
  description: z
    .string()
    .min(10, {
      message: "简介至少需要 10 个字符。",
    })
    .max(200, {
      message: "简介不能超过 200 个字符。",
    }),
  content: z.string().min(50, {
    message: "详细介绍至少需要 50 个字符。",
  }),
  logo: z.string().min(1, {
    message: "请上传 Logo。",
  }),
  coverImage: z.string().min(1, {
    message: "请上传预览图。",
  }),
})

const editDefaults = {
  name: "AI 写作助手",
  slug: "ai-writing-assistant",
  url: "https://example.com/ai-writing",
  category: "writing",
  description: "一款智能 AI 写作助手，帮助用户快速生成高质量文章。",
  content: `这是一款强大的 AI 写作工具，可以帮助用户快速生成各种类型的内容，包括博客、社交媒体文案和产品描述等。

## 主要功能

- 智能内容生成
- 多种文体风格
- 语法检查和润色
- 多语言支持`,
  logo: "/digital-pen-logo.png",
  coverImage: "/ai-writing-tool-dashboard.png",
}

const createDefaults = {
  name: "",
  slug: "",
  url: "",
  category: "",
  description: "",
  content: "",
  logo: "",
  coverImage: "",
}

export default function SubmitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: editId ? editDefaults : createDefaults,
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    window.setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: editId ? "更新成功" : "提交成功",
        description: editId
          ? `已更新 ${values.name}，等待审核。`
          : `已提交 ${values.name}，等待审核。`,
      })
      router.push("/user/submissions")
    }, 1200)
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
                  <FormLabel>网站名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：AI 写作助手" {...field} />
                  </FormControl>
                  <FormDescription>
                    输入工具名称，它会显示在列表和详情页中。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站 Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：ai-writing-assistant" {...field} />
                  </FormControl>
                  <FormDescription>
                    用于 URL 的唯一标识，只能包含小写字母、数字和连字符。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站 URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>填写工具官网地址。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
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
                  <FormDescription>选择最适合该工具的分类。</FormDescription>
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
                      placeholder="简要描述这个工具的主要功能和适用场景。"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>限制在 200 字以内。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>工具详细介绍</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="详细介绍工具功能、亮点、使用方式和适用人群。"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>支持 Markdown 格式。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站 Logo</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onChange={field.onChange}
                      accept="image/*"
                      maxSize={1024 * 1024}
                      previewHeight={100}
                      previewWidth={100}
                    />
                  </FormControl>
                  <FormDescription>
                    建议上传 200x200 的 PNG 或 JPG 图片。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站预览图</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onChange={field.onChange}
                      accept="image/*"
                      maxSize={2 * 1024 * 1024}
                      previewHeight={200}
                      previewWidth={400}
                    />
                  </FormControl>
                  <FormDescription>
                    建议上传 1200x630 的 PNG 或 JPG 图片。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : editId ? "更新工具" : "提交工具"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
