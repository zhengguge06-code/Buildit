import HomePageClient from "@/components/home-page-client"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/utils"
import { categories as fallbackCategories } from "@/lib/data"

type SidebarCategory = {
  id: string
  name: string
  icon: string
}

async function getSidebarCategories(): Promise<SidebarCategory[]> {
  if (!hasSupabaseEnv) {
    return fallbackCategories
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tool_categories")
    .select("id, name, icon, created_at")
    .order("created_at", { ascending: true })

  if (error || !data || data.length === 0) {
    return fallbackCategories
  }

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon || "",
  }))
}

export default async function HomePage() {
  const categories = await getSidebarCategories()

  return <HomePageClient categories={categories} />
}
