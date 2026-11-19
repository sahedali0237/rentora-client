import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * POST /api/upload-image
 *
 * Receives a multipart form-data upload from the browser, validates it, and
 * forwards it to the ImgBB API using the server-side IMGBB_API_KEY. The client
 * never sees or handles the API key — it only receives the hosted image URL.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, or WEBP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image size must be less than 2MB." },
      { status: 400 },
    );
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Image upload is not configured" },
      { status: 500 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const imgbbFormData = new FormData();
    imgbbFormData.append("image", base64Image);

    const imgbbResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        body: imgbbFormData,
      },
    );

    const imgbbData = (await imgbbResponse.json().catch(() => null)) as {
      success?: boolean;
      data?: { url?: string; display_url?: string };
      error?: { message?: string };
    } | null;

    const imageUrl = imgbbData?.data?.display_url || imgbbData?.data?.url;

    if (!imgbbResponse.ok || !imgbbData?.success || !imageUrl) {
      console.error("ImgBB upload error:", imgbbData);
      return NextResponse.json(
        { error: imgbbData?.error?.message || "Image upload failed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err) {
    console.error("ImgBB fetch failed:", err);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 502 },
    );
  }
}