import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_BLOCKS = ["P1", "P2", "Villa"];

const MATERIAL_IDS = [
  "rice",
  "dal",
  "vegetables",
  "full_prasad",
  "cylinder",
  "water_cans",
  "sukha_prasad",
];

const VOLUNTEER_IDS = [
  "cooking_management",
  "grocery_purchase",
  "deity_keeper",
  "idol_help",
  "decoration",
  "chanda_collection",
  "tent_puja_place",
  "idol_transportation",
  "puja_material",
  "flower",
  "daily_prasad",
  "fruits_vegetables",
  "prasad_meals",
  "cultural_program",
  "devotee_management",
  "cleanliness",
];

function generateSevaNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SEVA-2026-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      block,
      flatNo,
      mobile,
      materials,
      volunteerRoles,
      volunteerRoleNames,
      volunteerNote,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!VALID_BLOCKS.includes(block)) {
      return NextResponse.json({ error: "Invalid block." }, { status: 400 });
    }

    if (!flatNo?.trim()) {
      return NextResponse.json({ error: "Flat number is required." }, { status: 400 });
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(materials)) {
      return NextResponse.json({ error: "Invalid material Seva data." }, { status: 400 });
    }

    if (!Array.isArray(volunteerRoles)) {
      return NextResponse.json({ error: "Invalid volunteer Seva data." }, { status: 400 });
    }

    const cleanMaterials = materials
      .filter((item) => item && MATERIAL_IDS.includes(item.type))
      .map((item) => ({
        type: item.type,
        title: String(item.title || "").trim(),
        quantity:
          item.quantity === null || item.quantity === undefined || item.quantity === ""
            ? null
            : Number(item.quantity),
        unit: String(item.unit || "").trim() || null,
      }));

    for (const item of cleanMaterials) {
      if (item.type !== "full_prasad" && item.type !== "cylinder") {
        if (!Number.isFinite(item.quantity) || Number(item.quantity) <= 0) {
          return NextResponse.json(
            { error: `Please provide a valid quantity for ${item.title || item.type}.` },
            { status: 400 }
          );
        }
      }
    }

    const cleanVolunteerRoles = volunteerRoles.filter((id: unknown) =>
      typeof id === "string" && VOLUNTEER_IDS.includes(id)
    );

    if (!cleanMaterials.length && !cleanVolunteerRoles.length) {
      return NextResponse.json(
        { error: "Please select at least one Seva." },
        { status: 400 }
      );
    }

    const cleanVolunteerRoleNames = Array.isArray(volunteerRoleNames)
      ? volunteerRoleNames
          .filter((item: unknown) => typeof item === "string")
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

    const sevaNo = generateSevaNo();

    const { data, error } = await supabaseAdmin
      .from("seva_registrations")
      .insert({
        seva_no: sevaNo,
        name: name.trim(),
        block,
        flat_no: flatNo.trim(),
        mobile: cleanMobile,
        materials: cleanMaterials,
        volunteer_roles: cleanVolunteerRoles,
        volunteer_role_names: cleanVolunteerRoleNames,
        volunteer_note: volunteerNote?.trim() || null,
        status: "pending",
      })
      .select("id, seva_no")
      .single();

    if (error) {
      console.error("Seva insert error:", error);

      return NextResponse.json(
        { error: "Unable to submit Seva registration. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        sevaNo: data.seva_no,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seva API error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
