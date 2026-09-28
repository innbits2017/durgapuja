import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "gallery";
const SIGNED_URL_SECONDS = 60 * 60; // 1 hour

export async function GET() {
  try {
    const { data: items, error } = await supabaseAdmin
      .from("gallery_items")
      .select(
        "id, type, file_name, file_size, mime_type, uploaded_by, created_at, file_path"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Public gallery database error:", error);
      return NextResponse.json(
        { error: "Unable to load the gallery." },
        { status: 500 }
      );
    }

    const approvedItems = await Promise.all(
      (items || []).map(async (item) => {
        const { data: signed, error: signedUrlError } =
          await supabaseAdmin.storage
            .from(BUCKET)
            .createSignedUrl(item.file_path, SIGNED_URL_SECONDS);

        if (signedUrlError || !signed?.signedUrl) {
          console.error(
            "Gallery signed URL error:",
            item.file_path,
            signedUrlError
          );
          return null;
        }

        return {
          id: item.id,
          type: item.type,
          file_name: item.file_name,
          file_size: item.file_size,
          mime_type: item.mime_type,
          uploaded_by: item.uploaded_by,
          created_at: item.created_at,
          file_url: signed.signedUrl,
          // The current gallery schema does not store separate thumbnails.
          // Homepage uses its existing Durga Puja image as the video thumbnail.
          thumbnail_url: null,
          title: item.file_name,
          description: "A memory shared by our BUH community.",
        };
      })
    );

    return NextResponse.json(
      { items: approvedItems.filter(Boolean) },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Public gallery error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the gallery.",
      },
      { status: 500 }
    );
  }
}
