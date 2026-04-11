"use client"

import type React from "react"

import { useRef, useState } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { hasSupabaseEnv } from "@/lib/utils"

interface FileUploaderProps {
  value: string
  onChange: (value: string) => void
  bucket: string
  pathPrefix: string
  accept?: string
  maxSize?: number
  previewWidth?: number
  previewHeight?: number
}

function getFileExtension(file: File) {
  const nameParts = file.name.split(".")
  const extensionFromName = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : ""

  if (extensionFromName) {
    return extensionFromName
  }

  const mimeExtension = file.type.split("/")[1]?.toLowerCase()
  return mimeExtension || "png"
}

export function FileUploader({
  value,
  onChange,
  bucket,
  pathPrefix,
  accept = "image/*",
  maxSize = 1024 * 1024,
  previewWidth = 200,
  previewHeight = 200,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const notifyError = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    })

    if (typeof window !== "undefined") {
      window.alert(description)
    }
  }

  const uploadFile = async (file: File) => {
    if (file.size > maxSize) {
      notifyError("文件过大", `文件大小不能超过 ${(maxSize / (1024 * 1024)).toFixed(0)}MB`)
      return
    }

    if (!hasSupabaseEnv) {
      notifyError("上传未启用", "当前环境缺少 Supabase 配置，暂时无法上传图片。")
      return
    }

    setIsUploading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        notifyError("请先登录", "登录后才能上传图片。")
        return
      }

      const extension = getFileExtension(file)
      const objectPath = `${pathPrefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(objectPath)

      onChange(publicUrl)

      toast({
        title: "上传成功",
        description: "图片上传完成。",
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("row-level security policy")
          ? "上传被存储权限拦截，请确认已登录，并检查 Supabase Storage 的 bucket policy。"
          : error instanceof Error
            ? error.message
            : "上传失败，请稍后重试。"

      notifyError("上传失败", message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    await uploadFile(file)
    event.target.value = ""
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files[0]
    if (!file) {
      return
    }

    await uploadFile(file)
  }

  const handleRemove = () => {
    onChange("")
  }

  return (
    <div>
      {value ? (
        <div className="relative">
          <div
            style={{
              width: previewWidth,
              height: previewHeight,
              position: "relative",
            }}
            className="overflow-hidden rounded-md border"
          >
            <Image src={value} alt="Preview" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`rounded-md border-2 border-dashed p-6 text-center ${
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            {isUploading ? "图片上传中..." : "拖拽图片到这里，或点击选择文件"}
          </p>
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {isUploading ? "上传中..." : "选择文件"}
          </Button>
        </div>
      )}
    </div>
  )
}
