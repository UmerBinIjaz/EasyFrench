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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Students can only fetch their own enrollments, teachers/admins can fetch any
    if (session.user.role === "STUDENT" && studentId && session.user.id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetStudentId = studentId || session.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: targetStudentId },
      include: {
        course: {
          include: {
            lessons: true,
          },
        },
      },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, studentId } = body;

    // Teachers/Admins can enroll any student; students can only enroll themselves
    if (session.user.role === "STUDENT" && studentId && session.user.id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetStudentId = studentId || session.user.id;

    // Check if enrollment already exists
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: targetStudentId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: targetStudentId,
        courseId,
        status: "ACTIVE",
      },
      include: {
        course: { select: { id: true, title: true } },
        student: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}
