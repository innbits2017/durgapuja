
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cultural-media";
const MAX_FILE_SIZE = 200 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "mp3", "wav", "aac", "m4a", "ogg",
  "mp4", "mov", "webm",
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "aac", "m4a", "ogg",
]);

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
]);

export async function POST(request: Request) {
  let storagePath: string | null = null;

  try {
    const formData = await request.formData();

    // Honeypot field: should remain empty for real users.
    if (String(formData.get("website") || "").trim()) {
      return NextResponse.json(
        { error: "Invalid submission." },
        { status: 400 }
      );
    }

    const participantName = String(
      formData.get("participantName") || ""
    ).trim();

    const slotNumber = Number(formData.get("slotNumber"));
    const file = formData.get("file");

    if (!participantName || participantName.length > 150) {
      return NextResponse.json(
        { error: "Please enter a valid participant name." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(slotNumber) || slotNumber < 1) {
      return NextResponse.json(
        { error: "Please enter a valid slot number." },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select a song or video file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The file must be smaller than 200 MB." },
        { status: 400 }
      );
    }

    const originalName = file.name.split(/[\\/]/).pop() || "";
    const extension = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file format." },
        { status: 400 }
      );
    }

    if (
      file.type &&
      !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())
    ) {
      return NextResponse.json(
        { error: "The uploaded file type is not supported." },
        { status: 400 }
      );
    }

    const mediaType = AUDIO_EXTENSIONS.has(extension)
      ? "audio"
      : "video";

    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-120) || `upload.${extension}`;

    storagePath = `${crypto.randomUUID()}-${safeName}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Cultural media upload error:", uploadError);
      return NextResponse.json(
        { error: "Unable to upload the file. Please try again." },
        { status: 500 }
      );
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("cultural_program_media")
      .insert({
        participant_name: participantName,
        slot_number: slotNumber,
        media_type: mediaType,
        file_name: originalName,
        storage_path: storagePath,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Cultural media database error:", insertError);

      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([storagePath]);

      return NextResponse.json(
        { error: "The submission could not be saved. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Your file has been uploaded successfully.",
    });
  } catch (error) {
    console.error("Cultural media submission error:", error);

    if (storagePath) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([storagePath])
        .catch(() => undefined);
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
