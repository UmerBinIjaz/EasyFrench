import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required — used by the landing page
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        _count: {
          select: { enrollments: true, lessons: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12, // limit for landing page
    });

    const stats = await prisma.$transaction([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.certificate.count({ where: { status: "ISSUED" } }),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
    ]);

    return NextResponse.json(
      {
        courses,
        stats: {
          students: stats[0],
          certificatesIssued: stats[1],
          publishedCourses: stats[2],
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching public courses:", error);
    return NextResponse.json(
      { courses: [], stats: { students: 0, certificatesIssued: 0, publishedCourses: 0 } },
      { status: 200 } // Return empty gracefully so landing page still renders
    );
  }
}
