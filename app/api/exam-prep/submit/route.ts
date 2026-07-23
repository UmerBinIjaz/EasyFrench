import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoCheckBatch } from "@/lib/exam-prep-autocheck";

// POST /api/exam-prep/submit
// Auto-checks writing/speaking answers for an exam-prep quiz and returns the
// scores + feedback immediately. Nothing is stored in the database — the
// auto-check runs purely in memory on each submission.
export async function POST(req: Request) {
    try {
        const { quizId, answers } = await req.json();

        if (!quizId || !answers || !Array.isArray(answers)) {
            return NextResponse.json(
                { error: "quizId and answers array are required" },
                { status: 400 }
            );
        }

        // Verify the quiz exists and is an exam-prep quiz.
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                questions: { orderBy: { order: "asc" } },
            },
        });

        if (!quiz || !quiz.isExamPrep) {
            return NextResponse.json(
                { error: "Exam prep quiz not found" },
                { status: 404 }
            );
        }

        // Filter to only writing/speaking questions for auto-check.
        const writingSpeakingQuestions = quiz.questions.filter(
            (q) => q.questionType === "WRITING" || q.questionType === "SPEAKING"
        );

        if (writingSpeakingQuestions.length === 0) {
            return NextResponse.json(
                { error: "This quiz has no writing or speaking questions to review" },
                { status: 400 }
            );
        }

        // Map answers to question indices for auto-check. Pass the teacher-provided
        // model answer / rubric (stored as `explanation`) so it can be used in scoring.
        const autoCheckQuestions = writingSpeakingQuestions.map((q) => {
            const ans = answers.find(
                (a: { questionIndex: number; answer: string }) =>
                    a.questionIndex === quiz.questions.indexOf(q)
            );
            return {
                questionIndex: quiz.questions.indexOf(q),
                questionType: q.questionType,
                answer: ans?.answer || "",
                wordLimit: q.wordLimit,
                modelAnswer: q.explanation,
            };
        });

        // Run auto-check in memory — no database storage.
        const autoScores = autoCheckBatch(autoCheckQuestions);
        const totalScore = autoScores.reduce((sum, s) => sum + s.score, 0);
        const totalPossible = writingSpeakingQuestions.length;

        return NextResponse.json({ autoScores, totalScore, totalPossible });
    } catch (error) {
        console.error("Error auto-checking exam prep:", error);
        return NextResponse.json(
            { error: "Failed to auto-check exam prep" },
            { status: 500 }
        );
    }
}
