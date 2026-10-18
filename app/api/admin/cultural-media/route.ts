
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "cultural-media";
const MAX_FILE_SIZE = 200 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "mp3", "wav", "aac", "m4a", "ogg",
  "mp4", "mov", "webm",
]);

const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

async function authorize() {
  const session = await getAdminSession();
  return session;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// GET: List media and generate temporary playback/download URLs.
export async function GET() {
  try {
    const session = await authorize();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { data, error } = await supabaseAdmin
      .from("cultural_program_media")
      .select(
        "id, participant_name, slot_number, media_type, file_name, storage_path, created_at"
      )
      .order("slot_number", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Media list error:", error);
      return errorResponse("Unable to load media.", 500);
    }

    const items = await Promise.all(
      (data ?? []).map(async (item) => {
        const { data: playback, error: playbackError } =
          await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(item.storage_path, 3600);

        const { data: download, error: downloadError } =
          await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(item.storage_path, 3600, {
              download: item.file_name,
            });

        return {
          ...item,
          play_url: playbackError
            ? null
            : playback?.signedUrl ?? null,
          download_url: downloadError
            ? null
            : download?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Media GET error:", error);
    return errorResponse("Unable to load media.", 500);
  }
}

// POST: Upload a song or video.
export async function POST(request: Request) {
  let uploadedPath: string | null = null;

  try {
    const session = await authorize();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const formData = await request.formData();

    const participantName = String(
      formData.get("participant_name") ?? ""
    ).trim();

    const slotNumber = Number(formData.get("slot_number"));
    const file = formData.get("file");

    if (!participantName || participantName.length > 150) {
      return errorResponse(
        "Enter a participant or performance name (maximum 150 characters).",
        400
      );
    }

    if (!Number.isSafeInteger(slotNumber) || slotNumber < 1) {
      return errorResponse("Enter a valid positive slot number.", 400);
    }

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Please select a file.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "The maximum file size is 200 MB.",
        400
      );
    }

    const originalName = file.name;
    const extension = originalName
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !ALLOWED_EXTENSIONS.has(extension) ||
      !ALLOWED_MIME_TYPES.has(file.type)
    ) {
      return errorResponse(
        "Unsupported format. Use MP3, WAV, AAC, M4A, OGG, MP4, MOV or WebM.",
        400
      );
    }

    const mediaType = file.type.startsWith("audio/")
      ? "audio"
      : "video";

    const safeFileName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-180);

    const storagePath =
      `${crypto.randomUUID()}-${safeFileName}`;

    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return errorResponse(
        "File upload failed. Check your Storage bucket and upload limits.",
        500
      );
    }

    uploadedPath = storagePath;

    const { data: item, error: insertError } = await supabaseAdmin
      .from("cultural_program_media")
      .insert({
        participant_name: participantName,
        slot_number: slotNumber,
        media_type: mediaType,
        file_name: originalName,
        storage_path: storagePath,
      })
      .select(
        "id, participant_name, slot_number, media_type, file_name, storage_path, created_at"
      )
      .single();

    if (insertError) {
      console.error("Media database insert error:", insertError);

      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([storagePath]);

      uploadedPath = null;

      return errorResponse(
        "The file uploaded, but its record could not be saved.",
        500
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Media POST error:", error);

    if (uploadedPath) {
      await supabaseAdmin.storage
        .from(BUCKET)
        .remove([uploadedPath]);
    }

    return errorResponse("Upload failed. Please try again.", 500);
  }
}

// DELETE: Remove a media record and its stored file.
export async function DELETE(request: Request) {
  try {
    const session = await authorize();

    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    let body: { id?: unknown };

    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    if (typeof body.id !== "string" || !body.id.trim()) {
      return errorResponse("Invalid media ID.", 400);
    }

    const { data: item, error: findError } = await supabaseAdmin
      .from("cultural_program_media")
      .select("id, storage_path")
      .eq("id", body.id)
      .maybeSingle();

    if (findError) {
      console.error("Media lookup error:", findError);
      return errorResponse("Unable to find media.", 500);
    }

    if (!item) {
      return errorResponse("Media not found.", 404);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("cultural_program_media")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      console.error("Media record delete error:", deleteError);
      return errorResponse("Unable to delete media record.", 500);
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([item.storage_path]);

    if (storageError) {
      console.error("Storage cleanup error:", storageError);

      return NextResponse.json({
        success: true,
        warning: "Record deleted, but the stored file could not be removed.",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media DELETE error:", error);
    return errorResponse("Unable to delete media.", 500);
  }
}
