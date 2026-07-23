import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { certificateTemplateId } = await req.json();

    if (!certificateTemplateId) {
      return NextResponse.json(
        { error: "certificateTemplateId is required" },
        { status: 400 }
      );
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id,
      },
      data: {
        certificateTemplateId,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Certificate template assignment error:", error);

    return NextResponse.json(
      { error: "Failed to assign template" },
      { status: 500 }
    );
  }
}