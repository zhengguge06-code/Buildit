"use client"

import Image from "next/image"
import { Plus, Tag } from "lucide-react"
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
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-border/60 bg-sidebar md:block">
      <ScrollArea className="h-full">
        <div className="flex h-full flex-col px-5 py-8">
          <div className="mb-5 flex items-center gap-2 px-1">
            <Tag className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
              分类
            </h2>
          </div>

          <nav className="flex flex-col gap-0.5">
            {categories.map((category) => {
              const isActive = activeCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryClick(category.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base">
                    {isImageIcon(category.icon) ? (
                      <Image
                        src={category.icon}
                        alt={category.name}
                        width={18}
                        height={18}
                        className="h-4.5 w-4.5 object-contain"
                      />
                    ) : (
                      <span className="leading-none">{category.icon || "•"}</span>
                    )}
                  </span>
                  <span className={cn("flex-1 truncate", isActive && "font-medium")}>
                    {category.name}
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-accent/8 p-5">
            <h3 className="font-serif text-sm font-semibold text-foreground">
              发现了好工具？
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              提交后审核通过即可出现在频道中。
            </p>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={onSubmitClick}
            >
              <Plus className="h-3.5 w-3.5" />
              提交条目
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
