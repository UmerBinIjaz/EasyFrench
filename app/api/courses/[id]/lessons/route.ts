import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lessons = await prisma.lesson.findMany({
      where: { courseId: id },
      include: {
        quizzes: true,
        exercises: true,
      },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, videoUrl, textContent, pdfUrl, order, duration } = body;

    const newLesson = await prisma.lesson.create({
      data: {
        courseId: id,
        title,
        description,
        videoUrl,
        textContent,
        pdfUrl,
        order: order || 0,
        duration,
      },
    });

    return NextResponse.json(newLesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
