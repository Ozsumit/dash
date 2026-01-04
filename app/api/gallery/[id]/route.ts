import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] GET /api/gallery/:id - Fetching gallery item:', id)
    const item = await prisma.galleryItem.findUnique({
      where: { id: Number.parseInt(id) },
    })
    if (!item) return NextResponse.json({ error: "Gallery item not found" }, { status: 404 })
    console.log('[v0] GET /api/gallery/:id - Found gallery item')
    return NextResponse.json(item)
  } catch (error) {
    console.error('[v0] Error fetching gallery item:', error)
    return NextResponse.json({
      error: "Failed to fetch gallery item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[v0] PUT /api/gallery/:id - Updating gallery item:', id, body)

    const item = await prisma.galleryItem.update({
      where: { id: Number.parseInt(id) },
      data: {
        title: body.title,
        imageUrl: body.imageUrl,
        description: body.description,
        category: body.category,
      }
    })

    console.log('[v0] PUT /api/gallery/:id - Updated gallery item')
    return NextResponse.json(item)
  } catch (error) {
    console.error('[v0] Error updating gallery item:', error)
    return NextResponse.json({
      error: "Failed to update gallery item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] DELETE /api/gallery/:id - Deleting gallery item:', id)
    await prisma.galleryItem.delete({
      where: { id: Number.parseInt(id) },
    })
    console.log('[v0] DELETE /api/gallery/:id - Deleted gallery item')
    return NextResponse.json({ message: 'Gallery item deleted successfully' })
  } catch (error) {
    console.error('[v0] Error deleting gallery item:', error)
    return NextResponse.json({
      error: "Failed to delete gallery item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}