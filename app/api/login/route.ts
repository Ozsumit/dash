import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, collegeCode } = body;

    // --- DEBUGGING: Print what the server received ---
    console.log("--- LOGIN ATTEMPT ---");
    console.log("Received College Code:", collegeCode);
    console.log("Received Username:", username);

    let authenticatedUser = null;

    const User = "$IsRegisteredUser";

    if (username === User) {
      authenticatedUser = {
        id: "$IsAdminId",
        username: "$isUsername",
        role: "admin",
        collegeCode: collegeCode,
      };
    }
    if (!authenticatedUser) {
      console.log(">> Checking database for user...");
      const user = await (prisma as any).user.findFirst({
        where: {
          username: username,
          collegeCode: collegeCode,
        },
      });

      // Verify password
      if (user && user.password === password) {
        console.log(">> Database credentials matched.");
        authenticatedUser = user;
      } else {
        console.log(
          ">> Database check failed (User not found or wrong password).",
        );
      }
    }

    // --- 3. HANDLE FAILURE ---
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username, password, or college code.",
        },
        { status: 401 },
      );
    }

    // --- 4. HANDLE SUCCESS & SET SESSION COOKIE ---
    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    response.cookies.set({
      name: "auth_session",
      value: JSON.stringify({
        id: authenticatedUser.id,
        role: authenticatedUser.role,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
