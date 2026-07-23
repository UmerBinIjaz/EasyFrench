import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type LandingQuiz = {
    id: string;
    title: string;
    description: string | null;
    exam: string | null;
    section: string | null;
    level: string | null;
    timeLimit: number | null;
    passMark: number;
    questionCount: number;
};

/**
 * Lightweight endpoint for the landing page.
 * Returns only quiz metadata + question counts (no question bodies),
 * so the homepage can show real teacher-created exam-prep quizzes
 * without shipping the full question set to anonymous visitors.
 */
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
                _count: { select: { questions: true } },
            },
            orderBy: [{ level: "asc" }, { createdAt: "asc" }],
        });

        const payload: LandingQuiz[] = quizzes.map((q) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            exam: q.exam,
            section: q.section,
            level: q.level,
            timeLimit: q.timeLimit,
            passMark: q.passMark,
            questionCount: q._count.questions,
        }));

        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Error fetching landing exam prep quizzes:", error);
        return NextResponse.json([], { status: 200 });
    }
}
