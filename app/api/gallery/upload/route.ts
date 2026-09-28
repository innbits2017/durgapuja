import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "gallery";
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;

  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/webm") return "webm";

  return "bin";
}

async function ensureBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);

  if (error || !data) {
    throw new Error(
      `Gallery bucket is not available. Please create a private Supabase Storage bucket named "${BUCKET}" with a file-size limit of at least 10 MB.`
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const uploadedByValue = formData.get("name");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        { error: "Please select a photo or video to upload." },
        { status: 400 }
      );
    }

    const file = fileValue;
    const mimeType = (file.type || "").toLowerCase();
    const extension = getExtension(file);

    const isPhoto = PHOTO_TYPES.has(mimeType) ||
      (!mimeType && ["jpg", "jpeg", "png", "webp"].includes(extension));

    const isVideo = VIDEO_TYPES.has(mimeType) ||
      (!mimeType && ["mp4", "mov", "webm"].includes(extension));

    if (!isPhoto && !isVideo) {
      return NextResponse.json(
        {
          error:
            "Unsupported file. Photos: JPG, JPEG, PNG, WEBP. Videos: MP4, MOV, WEBM.",
        },
        { status: 400 }
      );
    }

    const maxSize = isPhoto ? MAX_PHOTO_SIZE : MAX_VIDEO_SIZE;

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isPhoto
            ? "Photo must be 10 MB or smaller."
            : "Video must be 50 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const uploadedBy =
      typeof uploadedByValue === "string"
        ? uploadedByValue.trim().slice(0, 100)
        : "";

    await ensureBucket();

    const type = isPhoto ? "photo" : "video";
    const folder = isPhoto ? "photos" : "videos";
    const date = new Date().toISOString().slice(0, 10);
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "bin";
    const filePath = `${folder}/${date}/${crypto.randomUUID()}.${safeExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType || undefined,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Gallery storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: galleryItem, error: insertError } = await supabaseAdmin
      .from("gallery_items")
      .insert({
        type,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: mimeType || null,
        uploaded_by: uploadedBy || null,
        status: "pending",
      })
      .select("id, type, file_name, status, created_at")
      .single();

    if (insertError) {
      console.error("Gallery database insert error:", insertError);

      await supabaseAdmin.storage.from(BUCKET).remove([filePath]);

      return NextResponse.json(
        { error: `Gallery database error: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Memory uploaded successfully and sent for approval.",
        item: galleryItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gallery upload error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload the file.",
      },
      { status: 500 }
    );
  }
}
