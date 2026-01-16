import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const registrations = await prisma.sportsRegistration.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(registrations);
  } catch (error) {
    console.error("[Sports] Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch sports registrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.phone ||
      !body.sport ||
      !body.participationType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If team participation, require team name
    if (body.participationType === "Team" && !body.teamName) {
      return NextResponse.json(
        { error: "Team name is required for team participation" },
        { status: 400 }
      );
    }

    const registration = await prisma.sportsRegistration.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        sport: body.sport,
        participationType: body.participationType,
        teamName: body.teamName || null,
        message: body.message || null,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("[Sports] Error creating registration:", error);
    return NextResponse.json(
      { error: "Failed to create sports registration" },
      { status: 500 }
    );
  }
}
