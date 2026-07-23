import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const exercises = await prisma.exercise.findMany({
            where: { createdById: session.user.id },
            include: {
                questions: { orderBy: { order: "asc" } },
                lesson: { select: { title: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(exercises);
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return NextResponse.json({ error: "Failed to fetch exercises" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, lessonId, moduleId, courseId, questions } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const exercise = await prisma.exercise.create({
            data: {
                title,
                description: description || null,
                courseId: courseId || null,
                lessonId: lessonId || null,
                createdById: session.user.id,
                questions: questions?.length
                    ? {
                        create: questions.map((q: any, i: number) => ({
                            question: q.question,
                            options: q.options || ["", "", "", ""],
                            correctAnswer: q.correctAnswer ?? 0,
                            explanation: q.explanation || null,
                            questionType: q.questionType || "WRITING",
                            order: i,
                        })),
                    }
                    : undefined,
            },
            include: {
                questions: { orderBy: { order: "asc" } },
            },
        });

        return NextResponse.json(exercise);
    } catch (error) {
        console.error("Error creating exercise:", error);
        return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
    }
}