import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Returns all published courses with their quizzes (no lesson content)
// Used by the student Practice Tests page
export async function GET() {
  try {

    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        quizzes: {
          select: {
            id: true,
            title: true,
            type: true,
            passMark: true,
            timeLimit: true,
            questions: {
              select: { id: true },
            },
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            quizzes: {
              select: {
                id: true,
                title: true,
                type: true,
                passMark: true,
                timeLimit: true,
                questions: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    // Reshape: add question count to each quiz
    const shaped = courses.map((course) => ({
      ...course,
      quizzes: course.quizzes.map(q => ({ ...q, _count: { questions: q.questions.length } })),
      lessons: course.lessons.map(l => ({
        ...l,
        quizzes: l.quizzes.map(q => ({ ...q, _count: { questions: q.questions.length } })),
      })),
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("Error fetching courses with quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
