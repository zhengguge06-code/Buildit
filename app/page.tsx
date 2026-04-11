import HomePageClient from "@/components/home-page-client"
import { getHomePageData } from "@/lib/ai-tools"

export default async function HomePage() {
  const { categories, hotTools, newTools, toolsByCategory } = await getHomePageData()

  return (
    <HomePageClient
      categories={categories}
      hotTools={hotTools}
      newTools={newTools}
      toolsByCategory={toolsByCategory}
    />
  )
}
