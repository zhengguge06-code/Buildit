import ChannelPageClient from "@/components/channel-page-client"
import { getChannelPageData } from "@/lib/ai-tools"

export default async function VibeToolsPage() {
  const channelData = await getChannelPageData("vibe-tools")

  return <ChannelPageClient {...channelData} />
}
