import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ message: "No account found with this email" }, { status: 404 })
    }

    return NextResponse.json({ message: "User verified successfully", email: user.email }, { status: 200 })
  } catch (error) {
    console.error("[VERIFY_EMAIL_ERROR]", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
