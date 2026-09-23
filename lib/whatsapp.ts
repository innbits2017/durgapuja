// lib/whatsapp.ts

const GRAPH_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v26.0";

const TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

/*
 * WhatsApp-hosted image Media ID.
 *
 * This is the Media ID you successfully tested:
 * 1590506885817187
 */
const IMAGE_MEDIA_ID =
  process.env.WHATSAPP_TEMPLATE_IMAGE_MEDIA_ID ||
  process.env.WHATSAPP_CONTRIBUTION_IMAGE_MEDIA_ID ||
  "1590506885817187";

/* =========================================================
   PHONE NUMBER
========================================================= */

function normalizeIndianWhatsAppNumber(mobile: string) {
  const digits = String(mobile || "").replace(/\D/g, "");

  // Already in 91XXXXXXXXXX format
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }

  // Indian 10-digit number
  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

/* =========================================================
   GENERIC TEMPLATE SENDER
========================================================= */

type SendTemplateOptions = {
  mobile: string;
  templateName: string;
  bodyParameters: string[];
  imageMediaId?: string;
};

/**
 * Sends a WhatsApp template having:
 *
 * HEADER:
 *   IMAGE
 *
 * BODY:
 *   Positional text parameters
 *
 * All current BUH Durga Puja templates use an IMAGE header.
 */
async function sendTemplate({
  mobile,
  templateName,
  bodyParameters,
  imageMediaId = IMAGE_MEDIA_ID,
}: SendTemplateOptions) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  /* -------------------------------------------------------
     Credentials
  ------------------------------------------------------- */

  if (!token || !phoneNumberId) {
    return {
      sent: false,
      skipped: true,
      messageId: null,
      error:
        "WhatsApp Cloud API credentials are not configured.",
    };
  }

  /* -------------------------------------------------------
     Recipient
  ------------------------------------------------------- */

  const recipient =
    normalizeIndianWhatsAppNumber(mobile);

  if (!recipient || recipient.length !== 12) {
    return {
      sent: false,
      skipped: true,
      messageId: null,
      error: "Invalid WhatsApp mobile number.",
    };
  }

  /* -------------------------------------------------------
     Template
  ------------------------------------------------------- */

  if (!templateName) {
    return {
      sent: false,
      skipped: true,
      messageId: null,
      error: "WhatsApp template name is missing.",
    };
  }

  /* -------------------------------------------------------
     Image
  ------------------------------------------------------- */

  if (!imageMediaId) {
    return {
      sent: false,
      skipped: true,
      messageId: null,
      error:
        "WhatsApp template image Media ID is not configured.",
    };
  }

  /* -------------------------------------------------------
     Payload
  ------------------------------------------------------- */

  const payload = {
    messaging_product: "whatsapp",

    to: recipient,

    type: "template",

    template: {
      name: templateName,

      language: {
        code: TEMPLATE_LANGUAGE,
      },

      components: [
        /* ================================================
           IMAGE HEADER
        ================================================= */

        {
          type: "header",

          parameters: [
            {
              type: "image",

              image: {
                id: imageMediaId,
              },
            },
          ],
        },

        /* ================================================
           BODY
        ================================================= */

        {
          type: "body",

          parameters: bodyParameters.map(
            (value) => ({
              type: "text",
              text: String(value ?? ""),
            })
          ),
        },
      ],
    },
  };

  console.log(
    "WhatsApp template request:",
    {
      templateName,
      recipient,
      language: TEMPLATE_LANGUAGE,
      bodyParameterCount:
        bodyParameters.length,
      hasImageHeader: true,
    }
  );

  /* -------------------------------------------------------
     API REQUEST
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  if (!response.ok) {
    const message =
      result?.error?.message ||
      "WhatsApp Cloud API request failed.";

    console.error(
      "WhatsApp API error:",
      result
    );

    throw new Error(message);
  }

  /* -------------------------------------------------------
     SUCCESS
  ------------------------------------------------------- */

  const messageId =
    result?.messages?.[0]?.id || null;

  const messageStatus =
    result?.messages?.[0]?.message_status ||
    null;

  console.log(
    "WhatsApp message accepted:",
    {
      templateName,
      recipient,
      messageId,
      messageStatus,
    }
  );

  return {
    sent: true,
    skipped: false,
    messageId,
    error: null,
  };
}

/* =========================================================
   CONTRIBUTION - SUBMITTED / UNDER REVIEW

   Template:
   buh_contribution_verification

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Amount
   {{3}} Block-Flat
   {{4}} UTR
========================================================= */

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

    bodyParameters: [
      name,
      String(amount),
      `${block}-${flatNo}`,
      utr,
    ],
  });
}

/* =========================================================
   CONTRIBUTION - VERIFIED

   Template:
   buh_contribution_confirmed

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Amount
   {{3}} Block-Flat

   receiptUrl is retained only for compatibility
   with existing admin code.
========================================================= */

export async function sendContributionVerifiedWhatsApp({
  mobile,
  name,
  amount,
  block,
  flatNo,
  receiptUrl: _receiptUrl,
}: {
  mobile: string;
  name: string;
  amount: number;
  block: string;
  flatNo: string;
  receiptUrl?: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_VERIFIED_TEMPLATE ||
      "buh_contribution_confirmed",

    bodyParameters: [
      name,
      String(amount),
      `${block}-${flatNo}`,
    ],
  });
}

/* =========================================================
   CONTRIBUTION - REJECTED

   Template:
   buh_contribution_rejected

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Amount
   {{3}} Block-Flat
   {{4}} UTR
========================================================= */

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
      String(amount),
      `${block}-${flatNo}`,
      utr || "N/A",
    ],
  });
}

/* =========================================================
   COMMITTEE CONTRIBUTION - CONFIRMED

   Template:
   buh_committee_contribution_confirmed

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Payment ID
   {{3}} Amount
   {{4}} Block-Flat
   {{5}} Payment Mode
========================================================= */

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
  paymentMode: "Cash" | "UPI" | string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_COMMITTEE_TEMPLATE ||
      "buh_committee_contribution_confirmed",

    bodyParameters: [
      name,
      paymentId,
      String(amount),
      `${block}-${flatNo}`,
      paymentMode,
    ],
  });
}

/* =========================================================
   EXTERNAL DONATION - CONFIRMED

   Template:
   buh_external_donation_confirmed

   IMAGE HEADER

   BODY:
   {{1}} Contact Person
   {{2}} Organization / Donor
   {{3}} Amount
   {{4}} Payment Mode
   {{5}} Payment ID / UTR
========================================================= */

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
      donorName,
      String(amount),
      paymentMode,
      paymentId,
    ],
  });
}

/* =========================================================
   INVENTORY HELP - VERIFIED

   Template:
   inventoryhelp

   IMAGE HEADER

   BODY:
   {{1}} Member Name
   {{2}} Inventory Item
   {{3}} Quantity
   {{4}} Unit
   {{5}} Block
   {{6}} Flat Number
========================================================= */

export async function sendInventoryHelpVerifiedWhatsApp({
  mobile,
  name,
  itemName,
  quantity,
  unit,
  block,
  flatNo,
}: {
  mobile: string;
  name: string;
  itemName: string;
  quantity: number | string;
  unit: string;
  block: string;
  flatNo: string;
}) {
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_INVENTORY_HELP_TEMPLATE ||
      "inventoryhelp",

    bodyParameters: [
      name,
      itemName,
      String(quantity),
      unit,
      block,
      flatNo,
    ],
  });
}

/* =========================================================
   CULTURAL PROGRAM - SUBMITTED

   Template:
   buh_cultural_program_submitted

   IMAGE HEADER

   BODY:
   {{1}} Participant Name
   {{2}} Registration Number
   {{3}} Participant Name
   {{4}} Performance Title
========================================================= */

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

/* =========================================================
   CULTURAL PROGRAM - CONFIRMED

   Template:
   buh_cultural_program_confirmed

   IMAGE HEADER

   BODY:
   {{1}} Participant Name
   {{2}} Registration Number
   {{3}} Performance Title
   {{4}} Slot Number
========================================================= */

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

/* =========================================================
   SEVA - SUBMITTED

   Template:
   buh_seva_submitted

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Seva ID
   {{3}} Selected Seva Details
========================================================= */

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
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_SEVA_SUBMITTED_TEMPLATE ||
      "buh_seva_submitted",

    bodyParameters: [
      name,
      sevaNo,
      sevaDetails,
    ],
  });
}

/* =========================================================
   SEVA - CONFIRMED

   Template:
   buh_seva_confirmed

   IMAGE HEADER

   BODY:
   {{1}} Name
   {{2}} Seva ID
   {{3}} Selected Seva Details
========================================================= */

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
  return sendTemplate({
    mobile,

    templateName:
      process.env.WHATSAPP_SEVA_CONFIRMED_TEMPLATE ||
      "buh_seva_confirmed",

    bodyParameters: [
      name,
      sevaNo,
      sevaDetails,
    ],
  });
}