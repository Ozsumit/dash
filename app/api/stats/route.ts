import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const [notices, posts, events, gallery] = await Promise.all([
      prisma.notice.count(),
      prisma.post.count(),
      prisma.event.count(),
      prisma.galleryItem.count(),
    ])

    return NextResponse.json({
      notices,
      posts,
      events,
      gallery,
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
