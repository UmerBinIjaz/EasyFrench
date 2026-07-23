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
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, downloadUrl } = body;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // ── ACTION: upload — Teacher uploads an external PDF/image ──
    if (action === "upload") {
      if (!downloadUrl) {
        return NextResponse.json({ error: "downloadUrl is required for upload action" }, { status: 400 });
      }

      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          status: "ISSUED",
          issuedAt: new Date(),
          approvedById: session.user.id,
          downloadUrl,
        },
        include: {
          student: { select: { name: true, email: true } },
          course: { select: { title: true } },
          template: { select: { name: true } },
        },
      });
      return NextResponse.json(updated);
    }

    // ── LEGACY: direct status update (kept for backward compatibility) ──
    const { status } = body;
    if (status) {
      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          status,
          issuedAt: status === "ISSUED" ? new Date() : undefined,
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "No valid action specified" }, { status: 400 });
  } catch (error) {
    console.error("Error updating certificate:", error);
    return NextResponse.json(
      { error: "Failed to update certificate" },
      { status: 500 }
    );
  }
}