import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET a specific testimonial by ID (public)
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const testimonial = await prisma.testimonial.findUnique({
            where: { id },
        });

        if (!testimonial) {
            return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
        }

        // Only return approved testimonials for non-admin users
        const session = await getServerSession(authOptions);
        const isAdminOrTeacher = session && (session.user.role === "ADMIN" || session.user.role === "TEACHER");

        if (!testimonial.approved && !isAdminOrTeacher) {
            return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
        }

        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error fetching testimonial:", error);
        return NextResponse.json({ error: "Failed to fetch testimonial" }, { status: 500 });
    }
}

// PUT update a testimonial (admin/teacher only)
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, role, text, avatar, rating, color, approved, featured } = body;

        // Check if testimonial exists
        const existing = await prisma.testimonial.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
        }

        // Validate rating range if provided
        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const testimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(role !== undefined && { role }),
                ...(text !== undefined && { text }),
                ...(avatar !== undefined && { avatar }),
                ...(rating !== undefined && { rating }),
                ...(color !== undefined && { color }),
                ...(approved !== undefined && { approved }),
                ...(featured !== undefined && { featured }),
            },
        });

        return NextResponse.json(testimonial);
    } catch (error) {
        console.error("Error updating testimonial:", error);
        return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
    }
}

// DELETE a testimonial (admin/teacher only)
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check if testimonial exists
        const existing = await prisma.testimonial.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
        }

        await prisma.testimonial.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
        console.error("Error deleting testimonial:", error);
        return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
    }
}