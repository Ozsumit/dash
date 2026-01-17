import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const popups = await prisma.popup.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(popups);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching popups" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // If setting this to active, deactivate all others first
    if (body.isActive) {
      await prisma.popup.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const popup = await prisma.popup.create({
      data: {
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl || null,
        buttonText: body.buttonText,
        buttonLink: body.buttonLink,
        isActive: body.isActive || false,
      },
    });

    return NextResponse.json(popup);
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating popup" },
      { status: 500 }
    );
  }
}
