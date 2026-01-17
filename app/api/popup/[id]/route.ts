import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Make sure you are using the singleton pattern!

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Define params as a Promise
) {
  try {
    // 1. Await the params to get the ID
    const { id } = await params;

    const body = await req.json();

    // If setting this to active, deactivate all others first
    if (body.isActive) {
      await prisma.popup.updateMany({
        where: {
          isActive: true,
          NOT: { id: id },
        },
        data: { isActive: false },
      });
    }

    const popup = await prisma.popup.update({
      where: { id: id }, // Use the awaited id
      data: {
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        buttonText: body.buttonText,
        buttonLink: body.buttonLink,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(popup);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: "Error updating popup" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Define params as a Promise
) {
  try {
    // 2. Await the params to get the ID
    const { id } = await params;

    await prisma.popup.delete({
      where: { id: id }, // Use the awaited id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Error deleting popup" },
      { status: 500 }
    );
  }
}
