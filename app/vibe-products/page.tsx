import ChannelPageClient from "@/components/channel-page-client"
import { getChannelPageData } from "@/lib/ai-tools"

export default async function VibeProductsPage() {
  const channelData = await getChannelPageData("vibe-products")

  return <ChannelPageClient {...channelData} />
}
