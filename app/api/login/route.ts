import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function POST(req: Request) {
  try {
    // 1. Parse the data sent from the AuthGuard component
    const body = await req.json()
    const { username, password, collegeCode } = body

    // 2. Query the database dynamically
    // We look for a user where ALL three fields match
    const user = await (prisma as any).user.findFirst({
      where: {
        username: username,
        collegeCode: collegeCode, // Check college code
      },
    })

    // 3. Verify the password
    // (If using plain text for simplicity as requested, direct comparison)
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid username, password, or college code." },
        { status: 401 }
      )
    }

    // 4. Return success if matches found
    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role } 
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}