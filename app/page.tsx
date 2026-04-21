import HomePageClient from "@/components/home-page-client"
import { getChannelPageData } from "@/lib/ai-tools"

export default async function HomePage() {
  const [toolsData, productsData] = await Promise.all([
    getChannelPageData("vibe-tools"),
    getChannelPageData("vibe-products"),
  ])

  const toolsCount = Object.values(toolsData.toolsByCategory).reduce(
    (sum, list) => sum + list.length,
    0
  )
  const productsCount = Object.values(productsData.toolsByCategory).reduce(
    (sum, list) => sum + list.length,
    0
  )
  const categoriesCount = toolsData.categories.length + productsData.categories.length

  return (
    <HomePageClient
      toolsCount={toolsCount}
      productsCount={productsCount}
      categoriesCount={categoriesCount}
    />
  )
}
