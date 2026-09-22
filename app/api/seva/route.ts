import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSevaSubmittedWhatsApp } from "@/lib/whatsapp";

const VALID_BLOCKS = ["P1", "P2", "Villa"] as const;

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
] as const;

const MATERIAL_PRICING: Record<
  string,
  { title: string; packages: Record<string, number> }
> = {
  rice: {
    title: "Rice",
    packages: {
      "10 kg": 701,
      "26 kg": 1751,
      "52 kg": 3501,
    },
  },
  dal: {
    title: "Dal",
    packages: {
      "5 kg": 601,
    },
  },
  vegetables: {
    title: "Vegetables",
    packages: {
      "10 kg": 1001,
      "20 kg": 2001,
    },
  },
  sukha_prasad: {
    title: "Sukha Prasad",
    packages: {
      "One Time": 1001,
      "Both Times": 2001,
    },
  },
  annadana: {
    title: "Annadana Seva",
    packages: {
      "₹5,001": 5001,
      "₹10,001": 10001,
      "₹15,001": 15001,
      "₹20,001": 20001,
      "₹25,001": 25001,
    },
  },
};

function generateSevaNo() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `SEVA-2026-${random}`;
}

function sanitizeWhatsAppParameter(value: string) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
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
      amount,
      paymentMethod,
      utr,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!VALID_BLOCKS.includes(block)) {
      return NextResponse.json(
        { error: "Invalid block." },
        { status: 400 }
      );
    }

    if (!flatNo?.trim()) {
      return NextResponse.json(
        { error: "Flat number is required." },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(materials)) {
      return NextResponse.json(
        { error: "Invalid Material Seva data." },
        { status: 400 }
      );
    }

    if (!Array.isArray(volunteerRoles)) {
      return NextResponse.json(
        { error: "Invalid Volunteer Seva data." },
        { status: 400 }
      );
    }

    const cleanMaterials: Array<{
      type: string;
      title: string;
      package: string;
      quantity: number | null;
      unit: string | null;
      price: number;
      day: string | null;
    }> = [];

    // Multiple material / Annadana options are intentionally supported.
    // Each selected option is stored as its own entry in the materials array.
    for (const item of materials) {
      if (!item || typeof item !== "object") {
        return NextResponse.json(
          { error: "Invalid Material Seva option." },
          { status: 400 }
        );
      }

      const type = String(item.type || "").trim();
      const pricing = MATERIAL_PRICING[type];

      if (!pricing) {
        return NextResponse.json(
          { error: `Invalid Seva item: ${type || "Unknown"}.` },
          { status: 400 }
        );
      }

      const packageLabel = String(item.package || "").trim();
      const expectedPrice = pricing.packages[packageLabel];

      if (expectedPrice === undefined) {
        return NextResponse.json(
          {
            error: `Invalid sponsorship option for ${pricing.title}.`,
          },
          { status: 400 }
        );
      }

      const day = String(item.day || "").trim();

      if (
        !["Shashti", "Saptami", "Ashtami", "Navami", "Dasami"].includes(day)
      ) {
        return NextResponse.json(
          {
            error: `Please select a valid Puja day for ${pricing.title}.`,
          },
          { status: 400 }
        );
      }

      const quantityMatch = packageLabel.match(/^(\d+)/);

      cleanMaterials.push({
        type,
        title: pricing.title,
        package: packageLabel,
        quantity: quantityMatch ? Number(quantityMatch[1]) : null,
        unit:
          type === "sukha_prasad"
            ? "time"
            : type === "annadana"
              ? "service"
              : "kg",
        price: expectedPrice,
        day,
      });
    }

    const cleanVolunteerRoles = volunteerRoles.filter(
      (id: unknown): id is string =>
        typeof id === "string" &&
        (VOLUNTEER_IDS as readonly string[]).includes(id)
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

    const calculatedAmount = cleanMaterials.reduce(
      (sum, item) => sum + item.price,
      0
    );

    const clientAmount = Number(amount || 0);

    if (
      !Number.isFinite(clientAmount) ||
      clientAmount !== calculatedAmount
    ) {
      return NextResponse.json(
        {
          error:
            "The sponsorship amount does not match the selected Seva options.",
        },
        { status: 400 }
      );
    }

    if (calculatedAmount > 0) {
      if (paymentMethod !== "upi") {
        return NextResponse.json(
          { error: "Please complete the payment using UPI." },
          { status: 400 }
        );
      }

      if (!String(utr || "").trim()) {
        return NextResponse.json(
          { error: "Please enter the UTR / Transaction ID." },
          { status: 400 }
        );
      }

      const cleanUtr = String(utr).trim();

      const { data: existingUtr, error: utrError } =
        await supabaseAdmin
          .from("seva_registrations")
          .select("id")
          .eq("utr", cleanUtr)
          .maybeSingle();

      if (utrError) {
        console.error("Seva UTR check error:", utrError);
        return NextResponse.json(
          { error: "Unable to validate the UTR / Transaction ID." },
          { status: 500 }
        );
      }

      if (existingUtr) {
        return NextResponse.json(
          {
            error:
              "This UTR / Transaction ID has already been submitted.",
          },
          { status: 409 }
        );
      }
    }

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
        amount: calculatedAmount,
        payment_method: calculatedAmount > 0 ? "upi" : null,
        utr: calculatedAmount > 0 ? String(utr).trim() : null,
        payment_status: calculatedAmount > 0 ? "pending" : null,
        status: "pending",
      })
      .select("id, seva_no")
      .single();

    if (error) {
      console.error("Seva insert error:", error);

      return NextResponse.json(
        {
          error:
            "Unable to submit Seva registration. Please try again.",
        },
        { status: 500 }
      );
    }

    /*
     * WhatsApp submission notification.
     *
     * IMPORTANT:
     * The registration is already saved. A WhatsApp failure must
     * never make the Seva submission fail.
     */
    let whatsappSent = false;
    let whatsappSkipped = false;
    let whatsappMessageId: string | null = null;
    let whatsappError: string | null = null;

    try {
      const sevaDetails = [
        ...cleanMaterials.map(
          (item) =>
            `${item.title}: ${item.package}, ${item.day}, Rs.${item.price.toLocaleString("en-IN")}`
        ),
        ...cleanVolunteerRoleNames.map(
          (role) => `${role}: Volunteer`
        ),
      ].join("; ");

      const result = await sendSevaSubmittedWhatsApp({
        mobile: cleanMobile,
        name: sanitizeWhatsAppParameter(name.trim()),
        sevaNo: sanitizeWhatsAppParameter(data.seva_no),
        sevaDetails: sanitizeWhatsAppParameter(
          calculatedAmount > 0
            ? `${sevaDetails}; Total Sponsorship: Rs.${calculatedAmount.toLocaleString("en-IN")}; Payment: UPI; UTR: ${String(utr).trim()}`
            : sevaDetails
        ),
      });

      whatsappSent = Boolean(result.sent);
      whatsappSkipped = Boolean(result.skipped);
      whatsappMessageId = result.messageId || null;
      whatsappError = result.sent
        ? null
        : result.error || null;

      if (!result.sent && result.error) {
        console.error(
          "Seva WhatsApp submission notification failed:",
          result.error
        );
      }
    } catch (whatsappErrorValue) {
      whatsappError =
        whatsappErrorValue instanceof Error
          ? whatsappErrorValue.message
          : "WhatsApp submission message failed.";

      console.error(
        "Seva submitted WhatsApp error:",
        whatsappErrorValue
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        sevaNo: data.seva_no,
        amount: calculatedAmount,
        paymentMethod:
          calculatedAmount > 0 ? "upi" : null,
        paymentStatus:
          calculatedAmount > 0 ? "pending" : null,
        whatsappSent,
        whatsappSkipped,
        whatsappMessageId,
        whatsappError,
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
