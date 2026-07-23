import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        template: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // 🔥 1. Create PDF
    const pdfDoc = await PDFDocument.create();

    // Default to A4 landscape (842 x 595)
    let page = pdfDoc.addPage([842, 595]);

    // 🔥 2. Try loading template background image
    const bgUrl = certificate.template?.backgroundImage;
    if (bgUrl) {
      try {
        const imageBytes = await fetch(bgUrl).then((res) => res.arrayBuffer());
        const isPng = bgUrl.toLowerCase().endsWith(".png");
        const image = isPng 
          ? await pdfDoc.embedPng(imageBytes) 
          : await pdfDoc.embedJpg(imageBytes);

        // Adjust page size to image dimensions or scale image to page
        page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (e) {
        console.error("Failed to load/draw background image:", e);
        // Fallback to solid color border if image fails
        drawFallbackDecorations(page, certificate.template?.primaryColor || "#1E3A8A");
      }
    } else {
      drawFallbackDecorations(page, certificate.template?.primaryColor || "#1E3A8A");
    }

    const { width, height } = page.getSize();

    // 🔥 3. Add text (Student Name)
    page.drawText(certificate.student.name.toUpperCase(), {
      x: width / 2 - 120,
      y: height / 2 + 40,
      size: 26,
      color: rgb(0.06, 0.09, 0.16), // near black
    });

    // 🔥 4. Add Course Name
    page.drawText(`has successfully completed the course`, {
      x: width / 2 - 140,
      y: height / 2 - 10,
      size: 14,
      color: rgb(0.28, 0.33, 0.41),
    });

    page.drawText(certificate.course.title, {
      x: width / 2 - 120,
      y: height / 2 - 40,
      size: 18,
      color: rgb(0.12, 0.23, 0.54), // primary color feel
    });

    // 🔥 5. Save PDF
    const pdfBytes = await pdfDoc.save();

    // 🔥 6. Convert to base64 or buffer download
    const base64 = Buffer.from(pdfBytes).toString("base64");
    const downloadUrl = `data:application/pdf;base64,${base64}`;

    // 🔥 7. Update certificate
    await prisma.certificate.update({
      where: { id },
      data: {
        status: "ISSUED",
        issuedAt: new Date(),
        downloadUrl,
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}

function drawFallbackDecorations(page: any, hexColor: string) {
  // Simple border fallback
  const r = parseInt(hexColor.slice(1, 3), 16) / 255 || 0.12;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255 || 0.23;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255 || 0.54;

  const { width, height } = page.getSize();
  page.drawRectangle({
    x: 16,
    y: 16,
    width: width - 32,
    height: height - 32,
    borderColor: rgb(r, g, b),
    borderWidth: 3,
  });
}