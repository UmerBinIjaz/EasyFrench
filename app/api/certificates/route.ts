import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/** Generate CERT-YYYY-NNNN */
async function generateCertNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.certificate.count({
    where: { issuedAt: { gte: new Date(`${year}-01-01`) } },
  });
  const serial = String(count + 1).padStart(4, "0");
  return `CERT-${year}-${serial}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (session.user.role === "STUDENT" && session.user.id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const whereClause = studentId ? { studentId } : {};

    const certificates = await prisma.certificate.findMany({
      where: whereClause,
      include: {
        student: { select: { name: true, email: true } },
        course: {
          include: {
            createdBy: { select: { name: true } },
          },
        },
        template: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, courseId } = body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { certificateTemplateId: true },
    });

    const certNumber = await generateCertNumber();

    const certificate = await prisma.certificate.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        approvedById: session.user.id,
        certificateNumber: certNumber,
        templateId:
          course?.certificateTemplateId ||
          (
            await prisma.certificateTemplate.findFirst({
              where: { teacherId: { not: null } },
              select: { id: true },
            })
          )?.id,
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
  }
}