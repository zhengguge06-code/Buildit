"use client"

import { useEffect } from "react"

type TrackToolViewProps = {
  toolId: string
}

export function TrackToolView({ toolId }: TrackToolViewProps) {
  useEffect(() => {
    if (!toolId) {
      return
    }

    void fetch("/api/tool-views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ toolId }),
    }).catch(() => {
      // Ignore analytics errors and keep the page responsive.
    })
  }, [toolId])

  return null
}
