import { NextResponse } from "next/server"
import { getSearchableTools } from "@/lib/ai-tools"

export const revalidate = 300

export async function GET() {
  const tools = await getSearchableTools()

  return NextResponse.json(
    { tools },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  )
}
