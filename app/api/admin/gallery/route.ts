import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "gallery";

async function checkAdmin() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/* ============================================================
   GET
============================================================ */

export async function GET() {
  try {
    const user =
      await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("gallery_items")
      .select(`
        id,
        type,
        file_path,
        file_name,
        file_size,
        mime_type,
        uploaded_by,
        status,
        created_at,
        reviewed_at,
        reviewed_by
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    const items =
      await Promise.all(
        (data || []).map(
          async (item) => {
            const {
              data: signed,
            } =
              await supabaseAdmin.storage
                .from(BUCKET)
                .createSignedUrl(
                  item.file_path,
                  60 * 15
                );

            return {
              ...item,
              preview_url:
                signed?.signedUrl ||
                null,
            };
          }
        )
      );

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error(
      "Admin gallery GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load gallery.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   APPROVE / REJECT
============================================================ */

export async function PATCH(
  request: Request
) {
  try {
    const user =
      await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const id =
      String(body.id || "").trim();

    const status =
      String(body.status || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Gallery item ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !["approved", "rejected"].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid gallery status.",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("gallery_items")
      .update({
        status,
        reviewed_at:
          new Date().toISOString(),
        reviewed_by:
          user.email ||
          user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    console.error(
      "Admin gallery PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update gallery item.",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE
============================================================ */

export async function DELETE(
  request: Request
) {
  try {
    const user =
      await checkAdmin();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const id =
      String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Gallery item ID is required.",
        },
        { status: 400 }
      );
    }

    const {
      data: item,
      error: fetchError,
    } = await supabaseAdmin
      .from("gallery_items")
      .select(
        "id, file_path"
      )
      .eq("id", id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        {
          error:
            "Gallery item not found.",
        },
        { status: 404 }
      );
    }

    await supabaseAdmin.storage
      .from(BUCKET)
      .remove([
        item.file_path,
      ]);

    const {
      error: deleteError,
    } =
      await supabaseAdmin
        .from("gallery_items")
        .delete()
        .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Admin gallery DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete gallery item.",
      },
      { status: 500 }
    );
  }
}