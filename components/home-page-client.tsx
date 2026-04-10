"use client"

import { useRef, useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import CategorySidebar from "@/components/category-sidebar"
import ToolCard from "@/components/tool-card"
import {
  categories as legacyCategories,
  hotTools,
  newTools,
  toolsByCategory,
} from "@/lib/data"

type SidebarCategory = {
  id: string
  name: string
  icon: string
}

type HomePageClientProps = {
  categories: SidebarCategory[]
}

export default function HomePageClient({ categories }: HomePageClientProps) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  const categorySections = categories.map((category, index) => ({
    ...category,
    toolGroupKey: legacyCategories[index]?.id ?? "",
  }))

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleSubmitClick = () => {
    router.push("/user/submit")
  }

  return (
    <div className="flex">
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        onSubmitClick={handleSubmitClick}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="relative mb-6 md:hidden">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="搜索 AI 工具..."
            className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold">热门工具</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {hotTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold">最新收录</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {newTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {categorySections.map((category) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => {
              categoryRefs.current[category.id] = el
            }}
            className="mb-10"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold">{category.name}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(toolsByCategory[category.toolGroupKey] ?? []).map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
