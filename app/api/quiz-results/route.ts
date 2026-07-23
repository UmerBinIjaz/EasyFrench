import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support optional quizId filter to get result for a specific quiz
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    const where: any = { studentId: session.user.id };
    if (quizId) {
      where.quizId = quizId;
    }

    const results = await prisma.quizResult.findMany({
      where,
      orderBy: { completedAt: "desc" },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 });
  }
}
