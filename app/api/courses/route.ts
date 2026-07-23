import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        certificateTemplateId: true,
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status, imageUrl } = body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        status: status || "DRAFT",
        createdById: session.user.id,
        ...(imageUrl && { imageUrl }),
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
