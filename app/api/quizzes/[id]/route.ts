import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
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
    const { title, description, passMark, timeLimit, questions, isExamPrep, exam, section, level } = body;

    // Replace questions in a transaction
    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.quizQuestion.deleteMany({ where: { quizId: id } });
      return tx.quiz.update({
        where: { id },
        data: {
          title,
          description,
          passMark,
          timeLimit,
          isExamPrep: Boolean(isExamPrep),
          exam: isExamPrep ? exam || null : null,
          section: isExamPrep ? section || null : null,
          level: isExamPrep ? level || null : null,
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
        include: { questions: true },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
