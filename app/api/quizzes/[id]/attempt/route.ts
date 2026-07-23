import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { answers } = body; // Array of selected options [0, 2, 1...]

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let correctCount = 0;
    quiz.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= quiz.passMark;

    let result = null;
    if (session?.user?.id) {
      result = await prisma.quizResult.create({
        data: {
          studentId: session.user.id,
          quizId: quiz.id,
          score,
          totalQuestions,
          correctAnswers: correctCount,
          answers: answers,
          passed,
        },
      });
    } else {
      // Simulate result object structure for anonymous attempts
      result = {
        quizId: quiz.id,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        answers: answers,
        passed,
      };
    }

    return NextResponse.json({
      result,
      passed,
      score,
      correctCount,
      totalQuestions,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
