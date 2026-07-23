import { prisma } from "@/lib/prisma";

export async function checkCourseCompletion(studentId: string, courseId: string) {
  const totalLessons = await prisma.lesson.count({
    where: {
      courseId,
    },
  });

  const completedLessons = await prisma.progress.count({
    where: {
      studentId,
      completed: true,
      lesson: {
        courseId,
      },
    },
  });

  return totalLessons > 0 && totalLessons === completedLessons;
}