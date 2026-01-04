import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    console.log('[v0] GET /api/notices - Starting fetch')
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
    })
    console.log('[v0] GET /api/notices - Found', notices.length, 'notices')
    return NextResponse.json(notices)
  } catch (error) {
    console.error('[v0] Error fetching notices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    let data: any = {}
    const contentType = request.headers.get('content-type') || ''

    if (contentType.startsWith('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      data.title = formData.get('title')?.toString() || ''
      data.description = formData.get('description')?.toString() || ''
      data.date = new Date(formData.get('date')?.toString() || '')
      data.category = formData.get('category')?.toString() || ''
      data.mediaType = formData.get('mediaType')?.toString() || 'none'
      data.accent = formData.get('accent')?.toString() || 'bg-blue-600'

      const file = formData.get('file') as File
      if (file) {
        const filePath = path.join(process.cwd(), 'public/notices', file.name)
        const buffer = Buffer.from(await file.arrayBuffer())
        fs.writeFileSync(filePath, buffer)
        data.mediaUrl = `/notices/${file.name}`
      }
    } else {
      // Handle JSON payload
      data = await request.json()
    }

    const notice = await prisma.notice.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        category: data.category,
        mediaType: data.mediaType || 'none',
        mediaUrl: data.mediaUrl,
        accent: data.accent || 'bg-blue-600',
      },
    })

    console.log('[v0] POST /api/notices - Created notice with ID:', notice.id)
    return NextResponse.json(notice, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating notice:', error)
    return NextResponse.json(
      { error: 'Failed to create notice', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
