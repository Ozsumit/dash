import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

// GET registration by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const registration = await prisma.sportsRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(registration);
  } catch (error) {
    console.error("[Sports] Error fetching registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch registration" },
      { status: 500 },
    );
  }
}

// PATCH update registration by ID
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // specific validation logic can go here (e.g. checking required fields)

    // Remove 'id' from the body if present to prevent trying to update the primary key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: bodyId, ...updateData } = body;

    const updatedRegistration = await prisma.sportsRegistration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedRegistration);
  } catch (error) {
    console.error("[Sports] Error updating registration:", error);

    // Handle case where record doesn't exist

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 },
    );
  }
}

// DELETE registration by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const registration = await prisma.sportsRegistration.delete({
      where: { id },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error("[Sports] Error deleting registration:", error);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 },
    );
  }
}
