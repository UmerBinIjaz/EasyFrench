import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required — lightweight course detail for the public page
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const course = await prisma.course.findUnique({
            where: { id, status: "PUBLISHED" },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                status: true,
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        passMark: true,
                        timeLimit: true,
                        _count: { select: { questions: true } },
                    },
                },
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        quizzes: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                                passMark: true,
                                timeLimit: true,
                                _count: { select: { questions: true } },
                            },
                        },
                    },
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!course) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(course, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
        });
    } catch (error) {
        console.error("Error fetching public course:", error);
        return NextResponse.json(
            { error: "Failed to fetch course" },
            { status: 500 }
        );
    }
}