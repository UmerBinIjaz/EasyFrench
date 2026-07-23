import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getLessonContentInfo, getPostCompletionAction } from "@/lib/progression";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.progress.findMany({
      where: { studentId: session.user.id },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, timeSpent, completed } = body;

    const progress = await prisma.progress.upsert({
      where: {
        studentId_lessonId: {
          studentId: session.user.id,
          lessonId,
        },
      },
      update: {
        timeSpent: { increment: timeSpent || 0 },
        completed: completed !== undefined ? completed : undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        studentId: session.user.id,
        lessonId,
        timeSpent: timeSpent || 0,
        completed: completed || false,
        completedAt: completed ? new Date() : null,
      },
    });

    // Determine next action if lesson was just completed
    let nextAction = null;
    if (completed) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          exercises: { select: { id: true, title: true } },
          quizzes: { select: { id: true, title: true, type: true } },
          course: true,
        },
      });

      if (lesson) {
        const info = getLessonContentInfo(lesson);
        const postAction = getPostCompletionAction(lesson);

        if (postAction.action === "redirect") {
          nextAction = {
            type: "redirect",
            url: postAction.url,
            message: info.hasExercise && info.hasQuiz
              ? "Lesson complete! Proceed to the exercise, then the quiz."
              : "Lesson complete! Now solve the exercise to unlock the next lesson.",
          };
        } else {
          nextAction = {
            type: "unlock",
            message: "Lesson completed! You can now proceed to the next lesson.",
          };
        }

        // Check if the entire course is now completed
        const courseId = lesson.course.id;
        const allCourseLessons = await prisma.lesson.findMany({
          where: { courseId },
        });

        const allProgress = await prisma.progress.findMany({
          where: {
            studentId: session.user.id,
            lessonId: { in: allCourseLessons.map((l: any) => l.id) },
            completed: true,
          },
        });

        if (allProgress.length >= allCourseLessons.length) {
          await prisma.enrollment.update({
            where: { studentId_courseId: { studentId: session.user.id, courseId } },
            data: { status: "COMPLETED", completedAt: new Date() },
          });

          const completedCourse = await prisma.course.findUnique({
            where: { id: courseId },
            select: { certificateTemplateId: true },
          });

          const existingCert = await prisma.certificate.findUnique({
            where: { studentId_courseId: { studentId: session.user.id, courseId } },
          });

          if (!existingCert) {
            await prisma.certificate.create({
              data: {
                studentId: session.user.id,
                courseId,
                templateId: completedCourse?.certificateTemplateId ?? null,
                status: "PENDING",
              },
            });
          } else if (existingCert.status !== "ISSUED") {
            await prisma.certificate.update({
              where: { id: existingCert.id },
              data: {
                status: "PENDING",
                templateId: completedCourse?.certificateTemplateId ?? existingCert.templateId,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ ...progress, nextAction });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
