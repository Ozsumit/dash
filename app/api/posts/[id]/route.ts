import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] GET /api/posts/:id - Fetching post:', id)
    const post = await prisma.post.findUnique({
      where: { id: Number.parseInt(id) },
    })
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
    console.log('[v0] GET /api/posts/:id - Found post')
    return NextResponse.json(post)
  } catch (error) {
    console.error('[v0] Error fetching post:', error)
    return NextResponse.json({ 
      error: "Failed to fetch post",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// <CHANGE> Added PUT method for updating posts
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[v0] PUT /api/posts/:id - Updating post:', id, body)
    
    const post = await prisma.post.update({
      where: { id: Number.parseInt(id) },
      data: {
        title: body.title,
        excerpt: body.excerpt,
        author: body.author,
        date: new Date(body.date),
        readTime: body.readTime,
        category: body.category,
        image: body.image,
        accent: body.accent || 'bg-blue-600',
        featured: body.featured || false,
        trending: body.trending || false,
        content: body.content
      }
    })
    
    console.log('[v0] PUT /api/posts/:id - Updated post')
    return NextResponse.json(post)
  } catch (error) {
    console.error('[v0] Error updating post:', error)
    return NextResponse.json({ 
      error: "Failed to update post",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[v0] DELETE /api/posts/:id - Deleting post:', id)
    await prisma.post.delete({
      where: { id: Number.parseInt(id) },
    })
    console.log('[v0] DELETE /api/posts/:id - Deleted post')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[v0] Error deleting post:', error)
    return NextResponse.json({ 
      error: "Failed to delete post",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
