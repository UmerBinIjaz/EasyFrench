import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title, description, questions } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Delete existing questions first, then update — avoids P2028 transaction timeout in serverless
        await prisma.exerciseQuestion.deleteMany({ where: { exerciseId: id } });

        const updated = await prisma.exercise.update({
            where: { id },
            data: {
                title,
                description: description || null,
                questions: {
                    create: (questions || []).map((q: any, i: number) => ({
                        question: q.question,
                        options: q.options || ["", "", "", ""],
                        correctAnswer: q.correctAnswer ?? 0,
                        explanation: q.explanation || null,
                        questionType: q.questionType || "WRITING",
                        order: i,
                    })),
                },
            },
            include: {
                questions: { orderBy: { order: "asc" } },
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating exercise:", error);
        return NextResponse.json({ error: "Failed to update exercise" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.exercise.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting exercise:", error);
        return NextResponse.json({ error: "Failed to delete exercise" }, { status: 500 });
    }
}