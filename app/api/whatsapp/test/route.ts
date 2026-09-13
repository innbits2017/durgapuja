import { NextResponse } from "next/server";
import { sendWhatsAppTestMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { mobile, name } = body;

    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Mobile number is required.",
        },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppTestMessage({
      mobile,
      name: name || "Rahul Sharma",
    });

    if (!result.sent) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp message sent successfully.",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("WhatsApp test error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "WhatsApp test failed.",
      },
      { status: 500 }
    );
  }
}