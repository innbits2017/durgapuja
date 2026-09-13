// lib/whatsapp.ts

const GRAPH_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v26.0";

const WHATSAPP_TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

/*
 * Optional image header media ID.
 *
 * If a template does not have an image header,
 * do not pass imageMediaId to sendTemplate().
 */
const CONTRIBUTION_IMAGE_MEDIA_ID =
  process.env.WHATSAPP_CONTRIBUTION_IMAGE_MEDIA_ID ||
  "1590506885817187";

/* ============================================================
   TYPES
============================================================ */

type WhatsAppResult = {
  sent: boolean;
  skipped: boolean;
  messageId?: string | null;
  error?: string | null;
};

/* ============================================================
   NORMALIZE INDIAN MOBILE NUMBER
============================================================ */

function normalizeIndianWhatsAppNumber(mobile: string) {
  const digits = mobile.replace(/\D/g, "");

  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

/* ============================================================
   COMMON TEMPLATE SENDER
============================================================ */

async function sendTemplate({
  mobile,
  templateName,
  bodyParameters = [],
  imageMediaId,
}: {
  mobile: string;
  templateName: string;
  bodyParameters?: string[];
  imageMediaId?: string;
}): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error(
      "WhatsApp Cloud API credentials are missing."
    );

    return {
      sent: false,
      skipped: true,
      messageId: null,
      error:
        "WhatsApp Cloud API credentials are not configured.",
    };
  }

  const components: any[] = [];

  /* ----------------------------------------------------------
     IMAGE HEADER
  ---------------------------------------------------------- */

  if (imageMediaId) {
    components.push({
      type: "header",
      parameters: [
        {
          type: "image",
          image: {
            id: imageMediaId,
          },
        },
      ],
    });
  }

  /* ----------------------------------------------------------
     BODY
  ---------------------------------------------------------- */

  if (bodyParameters.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParameters.map((text) => ({
        type: "text",
        text: String(text),
      })),
    });
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeIndianWhatsAppNumber(mobile),
    type: "template",

    template: {
      name: templateName,

      language: {
        code: WHATSAPP_TEMPLATE_LANGUAGE,
      },

      components,
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),

        cache: "no-store",
      }
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        result?.error?.message ||
        "WhatsApp Cloud API request failed.";

      console.error(
        "WhatsApp API error:",
        JSON.stringify(result, null, 2)
      );

      return {
        sent: false,
        skipped: false,
        messageId: null,
        error: errorMessage,
      };
    }

    const messageId =
      result?.messages?.[0]?.id || null;

    console.log(
      `WhatsApp message sent using template "${templateName}".`,
      messageId
    );

    return {
      sent: true,
      skipped: false,
      messageId,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "WhatsApp request failed.";

    console.error(
      "WhatsApp request exception:",
      error
    );

    return {
      sent: false,
      skipped: false,
      messageId: null,
      error: errorMessage,
    };
  }
}

/* ============================================================
   1. RESIDENT CONTRIBUTION SUBMITTED
============================================================

Template:
buh_contribution_verification

Variables:

{{1}} Name
{{2}} Amount
{{3}} Block-Flat
{{4}} UTR

============================================================ */

export async function sendContributionSubmittedWhatsApp({
  mobile,
  name,
  amount,
  block,
  flatNo,
  utr,
}: {
  mobile: string;
  name: string;
  amount: number;
  block: string;
  flatNo: string;
  utr: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_SUBMITTED_TEMPLATE ||
      "buh_contribution_verification",

    /*
     * Keep image header only if your approved
     * buh_contribution_verification template
     * actually contains an IMAGE header.
     */
    imageMediaId: CONTRIBUTION_IMAGE_MEDIA_ID,

    bodyParameters: [
      name,

      Number(amount).toLocaleString("en-IN"),

      `${block}-${flatNo}`,

      utr,
    ],
  });
}

/* ============================================================
   2. RESIDENT CONTRIBUTION VERIFIED
============================================================

Template:
buh_contribution_confirmed

Variables:

{{1}} Name
{{2}} Amount
{{3}} Block-Flat

============================================================ */

export async function sendContributionVerifiedWhatsApp({
  mobile,
  name,
  amount,
  block,
  flatNo,
}: {
  mobile: string;
  name: string;
  amount: number;
  block: string;
  flatNo: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_VERIFIED_TEMPLATE ||
      "buh_contribution_confirmed",

    bodyParameters: [
      name,

      Number(amount).toLocaleString("en-IN"),

      `${block}-${flatNo}`,
    ],
  });
}

/* ============================================================
   3. RESIDENT CONTRIBUTION REJECTED
============================================================

Template:
buh_contribution_rejected

Variables:

{{1}} Name
{{2}} Amount
{{3}} Block-Flat
{{4}} UTR

============================================================ */

export async function sendContributionRejectedWhatsApp({
  mobile,
  name,
  amount,
  block,
  flatNo,
  utr,
}: {
  mobile: string;
  name: string;
  amount: number;
  block: string;
  flatNo: string;
  utr: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_REJECTED_TEMPLATE ||
      "buh_contribution_rejected",

    bodyParameters: [
      name,

      Number(amount).toLocaleString("en-IN"),

      `${block}-${flatNo}`,

      utr,
    ],
  });
}

/* ============================================================
   4. COMMITTEE CONTRIBUTION CONFIRMED
============================================================

Template:
buh_committee_contribution_confirmed

CURRENTLY PENDING META APPROVAL.

Variables:

{{1}} Name
{{2}} Payment ID
{{3}} Amount
{{4}} Block-Flat
{{5}} Payment Mode

============================================================ */

export async function sendCommitteeContributionConfirmedWhatsApp({
  mobile,
  name,
  paymentId,
  amount,
  block,
  flatNo,
  paymentMode,
}: {
  mobile: string;
  name: string;
  paymentId: string;
  amount: number;
  block: string;
  flatNo: string;
  paymentMode: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_COMMITTEE_TEMPLATE ||
      "buh_committee_contribution_confirmed",

    bodyParameters: [
      name,

      paymentId,

      Number(amount).toLocaleString("en-IN"),

      `${block}-${flatNo}`,

      paymentMode,
    ],
  });
}

/* ============================================================
   5. EXTERNAL DONATION CONFIRMED
============================================================

Template:
buh_external_donation_confirmed

Variables:

{{1}} Contact person name
{{2}} Organisation / Donor
{{3}} Amount
{{4}} Payment Mode
{{5}} Payment ID / UTR

============================================================ */

export async function sendExternalDonationConfirmedWhatsApp({
  mobile,
  contactName,
  organisationName,
  amount,
  paymentMode,
  paymentId,
}: {
  mobile: string;
  contactName: string;
  organisationName: string;
  amount: number;
  paymentMode: string;
  paymentId: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_EXTERNAL_DONATION_TEMPLATE ||
      "buh_external_donation_confirmed",

    bodyParameters: [
      contactName,

      organisationName,

      Number(amount).toLocaleString("en-IN"),

      paymentMode,

      paymentId,
    ],
  });
}

/* ============================================================
   6. CULTURAL PROGRAM SUBMITTED
============================================================

Template:
buh_cultural_program_submitted

Variables:

{{1}} Participant name
{{2}} Registration number
{{3}} Participant name
{{4}} Performance title

============================================================ */

export async function sendCulturalProgramSubmittedWhatsApp({
  mobile,
  participantName,
  registrationNo,
  performanceTitle,
}: {
  mobile: string;
  participantName: string;
  registrationNo: string;
  performanceTitle: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_CULTURAL_SUBMITTED_TEMPLATE ||
      "buh_cultural_program_submitted",

    bodyParameters: [
      participantName,

      registrationNo,

      participantName,

      performanceTitle,
    ],
  });
}

/* ============================================================
   7. CULTURAL PROGRAM CONFIRMED
============================================================

Template:
buh_cultural_program_confirmed

Variables:

{{1}} Participant name
{{2}} Registration number
{{3}} Performance title
{{4}} Slot number

============================================================ */

export async function sendCulturalProgramConfirmedWhatsApp({
  mobile,
  participantName,
  registrationNo,
  performanceTitle,
  slotNumber,
}: {
  mobile: string;
  participantName: string;
  registrationNo: string;
  performanceTitle: string;
  slotNumber: number | string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_CULTURAL_CONFIRMED_TEMPLATE ||
      "buh_cultural_program_confirmed",

    bodyParameters: [
      participantName,

      registrationNo,

      performanceTitle,

      String(slotNumber),
    ],
  });
}

/* ============================================================
   8. SEVA SUBMITTED
============================================================

Template:
buh_seva_submitted

Variables:

{{1}} Name
{{2}} Seva ID
{{3}} Selected Seva details

============================================================ */

export async function sendSevaSubmittedWhatsApp({
  mobile,
  name,
  sevaId,
  sevaDetails,
}: {
  mobile: string;
  name: string;
  sevaId: string;
  sevaDetails: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_SEVA_SUBMITTED_TEMPLATE ||
      "buh_seva_submitted",

    bodyParameters: [
      name,

      sevaId,

      sevaDetails,
    ],
  });
}

/* ============================================================
   9. SEVA CONFIRMED
============================================================

Template:
buh_seva_confirmed

Variables:

{{1}} Name
{{2}} Seva ID
{{3}} Selected Seva details

============================================================ */

export async function sendSevaConfirmedWhatsApp({
  mobile,
  name,
  sevaId,
  sevaDetails,
}: {
  mobile: string;
  name: string;
  sevaId: string;
  sevaDetails: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_SEVA_CONFIRMED_TEMPLATE ||
      "buh_seva_confirmed",

    bodyParameters: [
      name,

      sevaId,

      sevaDetails,
    ],
  });
}