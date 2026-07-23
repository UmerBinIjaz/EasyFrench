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

    if (session.user.role === "STUDENT") {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: session.user.id },
        select: { courseId: true },
      });

      const courseIds = enrollments.map((e) => e.courseId);

      let quizzes;
      if (courseIds.length > 0) {
        quizzes = await prisma.quiz.findMany({
          where: {
            OR: [
              { courseId: { in: courseIds } },
              { lesson: { courseId: { in: courseIds } } },
            ],
          },
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
        });
      } else {
        quizzes = await prisma.quiz.findMany({
          include: { questions: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" },
        });
      }
      return NextResponse.json(quizzes);
    } else {
      // ADMIN or TEACHER
      const { searchParams } = new URL(req.url);
      const typeFilter = searchParams.get("type");

      const where: any = { createdById: session.user.id };
      if (typeFilter) {
        where.type = typeFilter; // Filter by QUIZ or EXERCISE
      }

      const quizzes = await prisma.quiz.findMany({
        where,
        include: { questions: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(quizzes);
    }
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, type, lessonId, moduleId, courseId, timeLimit, passMark, questions, isExamPrep, exam, section, level } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        type: type || "QUIZ",
        lessonId: lessonId || null,
        courseId: courseId || null,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passMark: passMark ? parseInt(passMark) : 60,
        isExamPrep: Boolean(isExamPrep),
        exam: isExamPrep ? exam || null : null,
        section: isExamPrep ? section || null : null,
        level: isExamPrep ? level || null : null,
        createdById: session.user.id,
        questions: questions?.length
          ? {
            create: questions.map((q: any, i: number) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
              questionType: q.questionType || "WRITING",
              audioUrl: q.audioUrl || null,
              passage: q.passage || null,
              wordLimit: q.wordLimit || null,
              order: i,
            })),
          }
          : undefined,
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
