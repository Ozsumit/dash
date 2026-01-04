import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] GET /api/events/:id - Fetching event:', id)
    const event = await prisma.event.findUnique({
      where: { id: Number.parseInt(id) },
    })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    console.log('[v0] GET /api/events/:id - Found event')
    return NextResponse.json(event)
  } catch (error) {
    console.error('[v0] Error fetching event:', error)
    return NextResponse.json({
      error: "Failed to fetch event",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[v0] PUT /api/events/:id - Updating event:', id, body)

    const event = await prisma.event.update({
      where: { id: Number.parseInt(id) },
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        location: body.location,
        category: body.category,
        image: body.image,
      }
    })

    console.log('[v0] PUT /api/events/:id - Updated event')
    return NextResponse.json(event)
  } catch (error) {
    console.error('[v0] Error updating event:', error)
    return NextResponse.json({
      error: "Failed to update event",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] DELETE /api/events/:id - Deleting event:', id)
    await prisma.event.delete({
      where: { id: Number.parseInt(id) },
    })
    console.log('[v0] DELETE /api/events/:id - Deleted event')
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('[v0] Error deleting event:', error)
    return NextResponse.json({
      error: "Failed to delete event",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}