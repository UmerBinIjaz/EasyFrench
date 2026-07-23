import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        quizzes: { include: { questions: { orderBy: { order: "asc" } } } },
        exercises: { include: { questions: { orderBy: { order: "asc" } } } },
        course: {
          include: {
            lessons: {
              orderBy: { order: "asc" }
            }
          }
        }
      },
    });
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, videoUrl, pdfUrl, order } = body;

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        textContent: content,
        videoUrl,
        pdfUrl,
        order,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.lesson.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}