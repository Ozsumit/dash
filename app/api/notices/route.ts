import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('[v0] GET /api/notices - Starting fetch')
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' }
    })
    console.log('[v0] GET /api/notices - Found', notices.length, 'notices')
    return NextResponse.json(notices)
  } catch (error) {
    console.error('[v0] Error fetching notices:', error)
    // <CHANGE> Added more detailed error information
    return NextResponse.json({ 
      error: 'Failed to fetch notices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[v0] POST /api/notices - Creating notice:', body)
    const notice = await prisma.notice.create({
      data: {
        title: body.title,
        date: new Date(body.date),
        category: body.category,
        description: body.description,
        mediaType: body.mediaType || 'none',
        mediaUrl: body.mediaUrl,
        accent: body.accent || 'bg-blue-600'
      }
    })
    console.log('[v0] POST /api/notices - Created notice with ID:', notice.id)
    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating notice:', error)
    // <CHANGE> Added more detailed error information
    return NextResponse.json({ 
      error: 'Failed to create notice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
