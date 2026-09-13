// lib/whatsapp.ts

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0";

const WHATSAPP_TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

const SITE_URL =
  process.env.NEXT_PUBLIC_PUJA_WEBSITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://buhdurgapuja.org.in";

const WHATSAPP_API_URL =
  `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type TemplateParameter = {
  type: "text";
  text: string;
};

type SendTemplateOptions = {
  mobile: string;
  templateName: string;
  parameters?: string[];
};

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

function validateWhatsAppConfig() {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is not configured.");
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured.");
  }
}

/* -------------------------------------------------------------------------- */
/* MOBILE NUMBER                                                              */
/* -------------------------------------------------------------------------- */

function normalizeIndianMobile(mobile: string) {
  const cleaned = mobile.replace(/\D/g, "");

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  throw new Error(
    "Invalid Indian mobile number. Expected a 10-digit number."
  );
}

/* -------------------------------------------------------------------------- */
/* GENERIC TEMPLATE SENDER                                                     */
/* -------------------------------------------------------------------------- */

export async function sendWhatsAppTemplate({
  mobile,
  templateName,
  parameters = [],
}: SendTemplateOptions) {
  validateWhatsAppConfig();

  const phoneNumber = normalizeIndianMobile(mobile);

  const bodyParameters: TemplateParameter[] = parameters.map((value) => ({
    type: "text",
    text: String(value ?? ""),
  }));

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: WHATSAPP_TEMPLATE_LANGUAGE,
      },
      components:
        bodyParameters.length > 0
          ? [
              {
                type: "body",
                parameters: bodyParameters,
              },
            ]
          : [],
    },
  };

  console.log("Sending WhatsApp template:", {
    templateName,
    mobile: `********${phoneNumber.slice(-4)}`,
  });

  const response = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", result);

    return {
      sent: false,
      error:
        result?.error?.message ||
        "WhatsApp message could not be sent.",
      details: result,
    };
  }

  console.log("WhatsApp message sent:", result);

  return {
    sent: true,
    messageId: result?.messages?.[0]?.id || null,
    details: result,
  };
}

/* -------------------------------------------------------------------------- */
/* 1. COMMITTEE CONTRIBUTION CONFIRMED                                        */
/* -------------------------------------------------------------------------- */

export async function sendCommitteeContributionConfirmedWhatsApp({
  mobile,
  name,
  paymentId,
  amount,
  blockFlat,
  paymentMode,
}: {
  mobile: string;
  name: string;
  paymentId: string;
  amount: number | string;
  blockFlat: string;
  paymentMode: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_committee_contribution_confirmed",
    parameters: [
      name,
      paymentId,
      String(amount),
      blockFlat,
      paymentMode,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 2. CONTRIBUTION VERIFICATION                                              */
/* -------------------------------------------------------------------------- */

export async function sendContributionVerificationWhatsApp({
  mobile,
  name,
  amount,
  blockFlat,
  utr,
}: {
  mobile: string;
  name: string;
  amount: number | string;
  blockFlat: string;
  utr: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_contribution_verification",
    parameters: [
      name,
      String(amount),
      blockFlat,
      utr,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 3. CONTRIBUTION CONFIRMED                                                 */
/* -------------------------------------------------------------------------- */

export async function sendContributionConfirmedWhatsApp({
  mobile,
  name,
  amount,
  blockFlat,
}: {
  mobile: string;
  name: string;
  amount: number | string;
  blockFlat: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_contribution_confirmed",
    parameters: [
      name,
      String(amount),
      blockFlat,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 4. CONTRIBUTION REJECTED                                                   */
/* -------------------------------------------------------------------------- */

export async function sendContributionRejectedWhatsApp({
  mobile,
  name,
  amount,
  blockFlat,
  utr,
}: {
  mobile: string;
  name: string;
  amount: number | string;
  blockFlat: string;
  utr: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_contribution_rejected",
    parameters: [
      name,
      String(amount),
      blockFlat,
      utr,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 5. EXTERNAL DONATION CONFIRMED                                             */
/* -------------------------------------------------------------------------- */

export async function sendExternalDonationConfirmedWhatsApp({
  mobile,
  contactName,
  donorName,
  amount,
  paymentMode,
  paymentId,
}: {
  mobile: string;
  contactName: string;
  donorName: string;
  amount: number | string;
  paymentMode: string;
  paymentId: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_external_donation_confirmed",
    parameters: [
      contactName,
      donorName,
      String(amount),
      paymentMode,
      paymentId,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 6. CULTURAL PROGRAM SUBMITTED                                              */
/* -------------------------------------------------------------------------- */

export async function sendCulturalProgramSubmittedWhatsApp({
  mobile,
  participantName,
  registrationNo,
  performance,
}: {
  mobile: string;
  participantName: string;
  registrationNo: string;
  performance: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_cultural_program_submitted",
    parameters: [
      participantName,
      registrationNo,
      participantName,
      performance,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 7. CULTURAL PROGRAM CONFIRMED                                              */
/* -------------------------------------------------------------------------- */

export async function sendCulturalProgramConfirmedWhatsApp({
  mobile,
  participantName,
  registrationNo,
  performance,
  slotNumber,
}: {
  mobile: string;
  participantName: string;
  registrationNo: string;
  performance: string;
  slotNumber: number | string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_cultural_program_confirmed",
    parameters: [
      participantName,
      registrationNo,
      performance,
      String(slotNumber),
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 8. SEVA SUBMITTED                                                          */
/* -------------------------------------------------------------------------- */

export async function sendSevaSubmittedWhatsApp({
  mobile,
  name,
  sevaNo,
  sevaDetails,
}: {
  mobile: string;
  name: string;
  sevaNo: string;
  sevaDetails: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_seva_submitted",
    parameters: [
      name,
      sevaNo,
      sevaDetails,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* 9. SEVA CONFIRMED                                                          */
/* -------------------------------------------------------------------------- */

export async function sendSevaConfirmedWhatsApp({
  mobile,
  name,
  sevaNo,
  sevaDetails,
}: {
  mobile: string;
  name: string;
  sevaNo: string;
  sevaDetails: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_seva_confirmed",
    parameters: [
      name,
      sevaNo,
      sevaDetails,
    ],
  });
}

/* -------------------------------------------------------------------------- */
/* SIMPLE TEST FUNCTION                                                       */
/* -------------------------------------------------------------------------- */

export async function sendWhatsAppTestMessage({
  mobile,
  name,
}: {
  mobile: string;
  name: string;
}) {
  return sendWhatsAppTemplate({
    mobile,
    templateName: "buh_contribution_verification",
    parameters: [
      name,
      "1001",
      "P1-101",
      "TEST123456",
    ],
  });
}