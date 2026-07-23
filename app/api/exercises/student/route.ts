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

        const { searchParams } = new URL(req.url);
        const exerciseId = searchParams.get("exerciseId");

        // If no specific exerciseId is provided, return ALL submissions for the student
        // (used by course page and lesson page to build progression maps)
        if (!exerciseId) {
            if (session.user.role !== "STUDENT") {
                return NextResponse.json([]);
            }
            const submissions = await prisma.exerciseSubmission.findMany({
                where: { studentId: session.user.id },
                orderBy: { submittedAt: "desc" },
            });
            return NextResponse.json(submissions);
        }

        // Get the exercise
        const exercise = await prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: {
                questions: { orderBy: { order: "asc" } },
                lesson: { select: { id: true, title: true } },
            },
        });

        if (!exercise) {
            return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
        }

        // Get student's submission if exists
        let submission = null;
        if (session.user.role === "STUDENT") {
            submission = await prisma.exerciseSubmission.findFirst({
                where: { studentId: session.user.id, exerciseId },
            });
        }

        return NextResponse.json({ exercise, submission });
    } catch (error) {
        console.error("Error fetching exercise:", error);
        return NextResponse.json({ error: "Failed to fetch exercise" }, { status: 500 });
    }
}