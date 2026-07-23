import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: courseId } = await params;

        // Verify the course exists and the teacher owns it
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, createdById: true, title: true },
        });

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Teachers can only view students in their own courses (admins can view all)
        if (session.user.role === "TEACHER" && course.createdById !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get all enrollments for this course with student details and progress
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { enrolledAt: "desc" },
        });

        // Get lesson count for progress calculation
        const totalLessons = await prisma.lesson.count({
            where: { courseId },
        });

        // Attach progress data for each student
        const studentsWithProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
                const completedLessons = await prisma.progress.count({
                    where: {
                        studentId: enrollment.studentId,
                        completed: true,
                        lesson: { courseId },
                    },
                });

                // Get average quiz score for this course
                const quizResults = await prisma.quizResult.findMany({
                    where: {
                        studentId: enrollment.studentId,
                        quiz: {
                            courseId,
                        },
                    },
                    select: { score: true },
                });

                const avgScore =
                    quizResults.length > 0
                        ? Math.round(
                            quizResults.reduce((sum, r) => sum + r.score, 0) /
                            quizResults.length
                        )
                        : null;

                return {
                    id: enrollment.id,
                    enrolledAt: enrollment.enrolledAt,
                    status: enrollment.status,
                    completedAt: enrollment.completedAt,
                    student: enrollment.student,
                    progress: {
                        completedLessons,
                        totalLessons,
                        percentage:
                            totalLessons > 0
                                ? Math.round((completedLessons / totalLessons) * 100)
                                : 0,
                    },
                    avgQuizScore: avgScore,
                };
            })
        );

        return NextResponse.json({
            courseTitle: course.title,
            totalEnrolled: enrollments.length,
            students: studentsWithProgress,
        });
    } catch (error) {
        console.error("Error fetching course students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
}