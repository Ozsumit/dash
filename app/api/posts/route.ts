import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Ensure this path matches your project

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { seo: true }, // <--- NEW: Include SEO data
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("[v0] Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const post = await prisma.post.create({
      data: {
        title: body.title,
        excerpt: body.excerpt,
        author: body.author,
        date: new Date(body.date),
        category: body.category,
        image: body.image,
        content: body.content,

        // <--- NEW: Create SEO relation immediately
        seo: {
          create: {
            metaTitle: body.seoTitle || body.title, // Fallback to title
            metaDescription: body.seoDescription || body.excerpt, // Fallback to excerpt
            noIndex: body.noIndex || false,
          },
        },
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 },
    );
  }
}
