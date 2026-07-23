import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getLessonContentInfo } from "@/lib/progression";
import { autoCheckExercise } from "@/lib/exercise-autocheck";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { exerciseId, answers } = await req.json();

        if (!exerciseId || !answers || !Array.isArray(answers)) {
            return NextResponse.json({ error: "exerciseId and answers array are required" }, { status: 400 });
        }

        // Verify the exercise exists and get lesson context
        const exercise = await prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: {
                questions: { orderBy: { order: "asc" } },
                lesson: {
                    include: {
                        course: { select: { id: true } },
                        exercises: { select: { id: true } },
                        quizzes: { select: { id: true, title: true, type: true } },
                    },
                },
            },
        });

        if (!exercise) {
            return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }

        // Check if student already submitted
        const existing = await prisma.exerciseSubmission.findFirst({
            where: { studentId: session.user.id, exerciseId },
        });

        if (existing) {
            return NextResponse.json({ error: "You have already submitted this exercise" }, { status: 400 });
        }

        // Auto-check the submission against the teacher-defined correct answers.
        // This grades every question type (multiple choice, fill in the blank,
        // matching, and writing) and produces per-question scores + feedback.
        const autoResult = autoCheckExercise(
            exercise.questions.map((q) => ({
                id: q.id,
                questionType: q.questionType,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                order: q.order,
            })),
            answers
        );

        // Store the submission in the database as GRADED with the auto-check
        // scores so the student sees the result immediately on reload.
        const submission = await prisma.exerciseSubmission.create({
            data: {
                studentId: session.user.id,
                exerciseId,
                answers,
                // Cast to Prisma's JSON input type — the array of score objects
                // is stored as-is and read back as plain JSON.
                scores: autoResult.scores as unknown as import("@prisma/client").Prisma.JsonObject,
                totalScore: autoResult.totalScore,
                totalPossible: autoResult.totalPossible,
                status: "GRADED",
                gradedAt: new Date(),
            },
        });

        // Determine next action after exercise submission
        let nextAction = null;
        if (exercise.lesson) {
            const info = getLessonContentInfo(exercise.lesson);
            if (info.hasQuiz) {
                nextAction = {
                    type: "redirect",
                    url: `/dashboard/quizzes/${info.quizId}?lessonId=${exercise.lesson.id}&courseId=${exercise.lesson.courseId}`,
                    label: "Proceed to Quiz",
                    message: "Exercise submitted and auto-graded! Now take the quiz to complete this lesson.",
                };
            } else {
                nextAction = {
                    type: "redirect",
                    url: `/dashboard/lessons/${exercise.lesson.id}`,
                    label: "Back to Lesson",
                    message: "Exercise submitted and auto-graded! The next lesson is now unlocked.",
                };
            }
        }

        return NextResponse.json({ submission, nextAction, autoResult });
    } catch (error) {
        console.error("Error submitting exercise:", error);
        return NextResponse.json({ error: "Failed to submit exercise" }, { status: 500 });
    }
}