import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadToCloudinary(buffer, {
      folder: "lacademie/audio",
      resource_type: "auto", // let Cloudinary detect audio; avoids extra video-processing overhead
      timeout: 180000, // 3 minutes — audio files can be large
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json({ error: "Failed to upload audio" }, { status: 500 });
  }
}
