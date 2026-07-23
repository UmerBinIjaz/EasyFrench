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

        const { searchParams } = new URL(req.url);
        const submissionId = searchParams.get("id");
        const exerciseId = searchParams.get("exerciseId");

        if (submissionId) {
            const submission = await prisma.exerciseSubmission.findUnique({
                where: { id: submissionId },
                include: {
                    student: { select: { id: true, name: true, email: true } },
                    exercise: { include: { questions: true, lesson: { select: { title: true } } } },
                },
            });
            if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
            return NextResponse.json(submission);
        }

        const where: any = {};
        if (exerciseId) where.exerciseId = exerciseId;

        const submissions = await prisma.exerciseSubmission.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, email: true } },
                exercise: { select: { id: true, title: true, lesson: { select: { title: true } } } },
            },
            orderBy: { submittedAt: "desc" },
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { submissionId, scores, totalScore } = await req.json();
        if (!submissionId || !scores) {
            return NextResponse.json({ error: "submissionId and scores are required" }, { status: 400 });
        }

        const submission = await prisma.exerciseSubmission.update({
            where: { id: submissionId },
            data: {
                scores,
                totalScore,
                status: "GRADED",
                gradedAt: new Date(),
                gradedById: session.user.id,
            },
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("Error grading submission:", error);
        return NextResponse.json({ error: "Failed to grade submission" }, { status: 500 });
    }
}