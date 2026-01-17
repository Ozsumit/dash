import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Adjust this import path to your prisma instance

export async function GET() {
  try {
    // Fetch counts from all tables in parallel for performance
    const [
      eventsCount,
      // galleryCount,
      noticesCount,
      postsCount,
      registrationsCount,
      recentEvents,
      recentNotices,
    ] = await Promise.all([
      prisma.event.count(),
      // prisma.gallery.count(),
      prisma.notice.count(),
      prisma.post.count(),
      prisma.sportsRegistration.count(), // Assuming this model exists based on folder structure
      // Fetch upcoming events for the "Upcoming" card
      prisma.event.findMany({
        take: 3,
        orderBy: { date: "asc" },
        where: { date: { gte: new Date() } },
      }),
      // Fetch recent notices
      prisma.notice.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      counts: {
        events: eventsCount,
        // gallery: galleryCount,
        notices: noticesCount,
        posts: postsCount,
        registrations: registrationsCount,
      },
      recentActivity: {
        events: recentEvents,
        notices: recentNotices,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
