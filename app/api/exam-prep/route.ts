import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const quizzes = await prisma.quiz.findMany({
            where: {
                isExamPrep: true,
                type: "QUIZ",
                questions: { some: {} },
            },
            select: {
                id: true,
                title: true,
                description: true,
                exam: true,
                section: true,
                level: true,
                timeLimit: true,
                passMark: true,
                questions: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        question: true,
                        options: true,
                        correctAnswer: true,
                        explanation: true,
                        questionType: true,
                        audioUrl: true,
                        passage: true,
                        wordLimit: true,
                    },
                },
            },
            orderBy: [{ level: "asc" }, { createdAt: "asc" }],
        });

        return NextResponse.json(quizzes, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Error fetching exam prep quizzes:", error);
        return NextResponse.json([], { status: 200 });
    }
}
