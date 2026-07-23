import { prisma } from "@/lib/prisma";

export async function generateCertificate(studentId: string, courseId: string) {
  const existing = await prisma.certificate.findUnique({
    where: {
      studentId_courseId: { studentId, courseId },
    },
  });

  if (existing) return existing;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { certificateTemplateId: true },
  });

  const certificate = await prisma.certificate.create({
    data: {
      studentId,
      courseId,
      templateId: course?.certificateTemplateId || null,
      status: "PENDING",
    },
  });

  return certificate;
}