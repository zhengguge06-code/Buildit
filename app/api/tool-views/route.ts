import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseEnv } from "@/lib/utils"

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ ok: true })
  }

  try {
    const { toolId } = (await request.json()) as { toolId?: string }

    if (!toolId) {
      return NextResponse.json({ ok: false, error: "missing_tool_id" }, { status: 400 })
    }

    const supabase = await createClient()
    await supabase.from("tool_views").insert({
      tool_id: toolId,
      viewed_at: new Date().toISOString(),
    })
  } catch {
    // Swallow analytics errors to keep the detail page path stable.
  }

  return NextResponse.json({ ok: true })
}
