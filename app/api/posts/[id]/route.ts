import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id: Number.parseInt(id) },
      include: { seo: true }, // <--- NEW: Fetch SEO data for the edit form
    });
    if (!post)
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error("[v0] Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const post = await prisma.post.update({
      where: { id: Number.parseInt(id) },
      data: {
        // 1. Basic Fields
        title: body.title,
        excerpt: body.excerpt,
        author: body.author,
        date: new Date(body.date),
        category: body.category,
        image: body.image,
        content: body.content,

        // 2. SEO Fields (Using upsert to be safe)
        seo: {
          upsert: {
            create: {
              metaTitle: body.seoTitle,
              metaDescription: body.seoDescription,
              noIndex: body.noIndex || false,
            },
            update: {
              metaTitle: body.seoTitle,
              metaDescription: body.seoDescription,
              noIndex: body.noIndex || false,
            },
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[v0] Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.post.delete({
      where: { id: Number.parseInt(id) },
    });
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("[v0] Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
