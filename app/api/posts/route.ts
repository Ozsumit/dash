import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('[v0] Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const post = await prisma.post.create({
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
        trending: body.trending || false
      }
    })
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
