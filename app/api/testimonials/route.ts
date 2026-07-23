import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET testimonials. Public users only see approved items; teachers/admins can request all.
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const isAdminOrTeacher = session && (session.user.role === "ADMIN" || session.user.role === "TEACHER");
        const showAll = new URL(req.url).searchParams.get("all") === "true" && isAdminOrTeacher;

        const testimonials = await prisma.testimonial.findMany({
            where: showAll ? undefined : { approved: true },
            orderBy: [
                { featured: "desc" },
                { createdAt: "desc" },
            ],
        });
        return NextResponse.json(testimonials, {
            headers: showAll
                ? { "Cache-Control": "no-store" }
                : {
                    "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
                },
        });
    } catch (error) {
        console.error("Error fetching testimonials:", error);
        return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
    }
}

// POST create a new testimonial (admin/teacher only)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, role, text, avatar, rating, color, approved, featured } = body;

        // Validate required fields
        if (!name || !role || !text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate rating range
        if (rating && (rating < 1 || rating > 5)) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        const testimonial = await prisma.testimonial.create({
            data: {
                name,
                role,
                text,
                avatar: avatar || null,
                rating: rating || 5,
                color: color || null,
                approved: approved || false,
                featured: featured || false,
            },
        });

        return NextResponse.json(testimonial, { status: 201 });
    } catch (error) {
        console.error("Error creating testimonial:", error);
        return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
    }
}