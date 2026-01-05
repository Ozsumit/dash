import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] GET /api/notices/:id - Fetching notice:', id)
    const notice = await prisma.notice.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
    }
    
    console.log('[v0] GET /api/notices/:id - Found notice')
    return NextResponse.json(notice)
  } catch (error) {
    console.error('[v0] Error fetching notice:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// <CHANGE> Added PUT method support alongside PATCH
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('[v0] PUT /api/notices/:id - Updating notice:', id, body)
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        category: body.category,
        mediaType: body.mediaType || 'none',
        mediaUrl: body.mediaUrl,
        accent: body.accent || 'bg-blue-600'
      }
    })
    
    console.log('[v0] PUT /api/notices/:id - Updated notice')
    return NextResponse.json(notice)
  } catch (error) {
    console.error('[v0] Error updating notice:', error)
    return NextResponse.json({ 
      error: 'Failed to update notice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const notice = await prisma.notice.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.category && { category: body.category }),
        ...(body.description && { description: body.description }),
        ...(body.mediaType && { mediaType: body.mediaType }),
        ...(body.mediaUrl !== undefined && { mediaUrl: body.mediaUrl }),
        ...(body.accent && { accent: body.accent })
      }
    })
    
    return NextResponse.json(notice)
  } catch (error) {
    console.error('[v0] Error updating notice:', error)
    return NextResponse.json({ 
      error: 'Failed to update notice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[v0] DELETE /api/notices/:id - Deleting notice:', id)
    await prisma.notice.delete({
      where: { id: parseInt(id) }
    })
    
    console.log('[v0] DELETE /api/notices/:id - Deleted notice')
    return NextResponse.json({ message: 'Notice deleted successfully' })
  } catch (error) {
    console.error('[v0] Error deleting notice:', error)
    return NextResponse.json({ 
      error: 'Failed to delete notice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
