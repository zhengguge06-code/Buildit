"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon: string
}

interface CategorySidebarProps {
  categories: Category[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
  onSubmitClick: () => void
}

function isImageIcon(icon: string) {
  return (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/") ||
    icon.startsWith("data:image/")
  )
}

export default function CategorySidebar({
  categories,
  activeCategory,
  onCategoryClick,
  onSubmitClick,
}: CategorySidebarProps) {
  return (
    <div className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 border-r bg-background md:block">
      <ScrollArea className="h-full py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">分类</h2>
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={cn("w-full justify-start", activeCategory === category.id && "bg-accent")}
                onClick={() => onCategoryClick(category.id)}
              >
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center overflow-hidden rounded-sm">
                  {isImageIcon(category.icon) ? (
                    <Image
                      src={category.icon}
                      alt={category.name}
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <span>{category.icon}</span>
                  )}
                </span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4 px-3 py-4">
          <Button className="flex w-full items-center gap-2" onClick={onSubmitClick}>
            <Plus className="h-4 w-4" />
            提交条目
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
