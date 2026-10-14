import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const VALID_BLOCKS = ["P1", "P2", "Villa"];

const VALID_COMPETITIONS = [
  "Diya Decoration",
  "Thali Decoration",
  "Shankh Dhwani Competition",
  "Ululu Competition",
];

const VALID_GAMES = [
  "Item Mera, Control Tera?",
  "Meri Topi Tere Sar",
  "Balloon Challenge",
  "Blindfold Bindi Challenge",
  "Freeze Dance",
  "Musical Chairs",
];

const LADIES_ONLY_COMPETITIONS = ["Ululu Competition"];
const LADIES_ONLY_GAMES = ["Blindfold Bindi Challenge"];

function generateRegistrationNo(): string {
  const random = randomInt(100000, 1000000);
  return `EVT-2026-${random}`;
}

function generateFlats(start: number, end: number): string[] {
  const flats: string[] = [];

  for (let i = start; i <= end; i++) {
    flats.push(String(i).padStart(3, "0"));
  }

  return flats;
}

const VALID_FLATS: Record<string, string[]> = {
  P1: [
    ...generateFlats(1, 12),
    ...generateFlats(101, 112),
    ...generateFlats(201, 212),
    ...generateFlats(301, 312),
  ],
  P2: [
    ...generateFlats(1, 67),
    ...generateFlats(101, 167),
    ...generateFlats(201, 267),
    ...generateFlats(301, 367),
  ],
  Villa: ["001", "002", "003", "004"],
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      participantName,
      age,
      gender,
      block,
      flatNo,
      mobile,
      email,
      competition,
      games,
      notes,
    } = body;

    // PARTICIPANT NAME
    if (
      typeof participantName !== "string" ||
      !participantName.trim() ||
      participantName.trim().length > 100
    ) {
      return errorResponse("Please enter a valid participant name.");
    }

    const cleanName = participantName.trim();

    // AGE: OPTIONAL UNLESS A DECORATION COMPETITION IS SELECTED
    let numericAge: number | null = null;

    if (
      age !== undefined &&
      age !== null &&
      !(typeof age === "string" && age.trim() === "")
    ) {
      numericAge =
        typeof age === "number"
          ? age
          : typeof age === "string"
            ? Number(age)
            : NaN;

      if (
        !Number.isInteger(numericAge) ||
        numericAge < 1 ||
        numericAge > 100
      ) {
        return errorResponse(
          "Please enter a valid age between 1 and 100."
        );
      }
    }

    // GENDER
    const cleanGender =
      typeof gender === "string" && gender.trim()
        ? gender.trim()
        : null;

    if (
      cleanGender !== null &&
      !["Female", "Male", "Prefer not to say"].includes(cleanGender)
    ) {
      return errorResponse("Invalid gender selection.");
    }

    // BLOCK AND FLAT
    if (
      typeof block !== "string" ||
      !VALID_BLOCKS.includes(block)
    ) {
      return errorResponse("Please select a valid block.");
    }

    if (typeof flatNo !== "string" || !flatNo.trim()) {
      return errorResponse("Please select a valid flat number.");
    }

    const cleanFlatNo = flatNo.trim();

    if (!VALID_FLATS[block]?.includes(cleanFlatNo)) {
      return errorResponse(
        "The selected flat does not belong to the selected block."
      );
    }

    // MOBILE NUMBER
    if (typeof mobile !== "string") {
      return errorResponse(
        "Please enter a valid 10-digit mobile number."
      );
    }

    const cleanMobile = mobile.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return errorResponse(
        "Please enter a valid 10-digit mobile number."
      );
    }

    // EMAIL
    let cleanEmail: string | null = null;

    if (email !== undefined && email !== null) {
      if (typeof email !== "string") {
        return errorResponse("Invalid email address.");
      }

      cleanEmail = email.trim() || null;

      if (
        cleanEmail &&
        (cleanEmail.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      ) {
        return errorResponse("Please enter a valid email address.");
      }
    }

    // COMPETITION
    let cleanCompetition: string | null = null;

    if (competition !== undefined && competition !== null && competition !== "") {
      if (
        typeof competition !== "string" ||
        !VALID_COMPETITIONS.includes(competition)
      ) {
        return errorResponse("Please select a valid competition.");
      }

      cleanCompetition = competition;
    }

    // AGE IS REQUIRED FOR DECORATION COMPETITIONS
    if (
      ["Diya Decoration", "Thali Decoration"].includes(
        cleanCompetition ?? ""
      ) &&
      numericAge === null
    ) {
      return errorResponse(
        "Age is required for Diya Decoration and Thali Decoration."
      );
    }

    // DECORATION COMPETITION AGE LIMITS
    if (
      cleanCompetition === "Diya Decoration" &&
      (numericAge === null || numericAge < 5 || numericAge > 9)
    ) {
      return errorResponse(
        "Diya Decoration is for children aged 5 to 9 years."
      );
    }

    if (
      cleanCompetition === "Thali Decoration" &&
      (numericAge === null || numericAge < 10 || numericAge > 15)
    ) {
      return errorResponse(
        "Thali Decoration is for children aged 10 to 15 years."
      );
    }

    // GAMES
    if (games !== undefined && !Array.isArray(games)) {
      return errorResponse("Invalid games selection.");
    }

    const submittedGames: unknown[] = Array.isArray(games) ? games : [];

    if (submittedGames.length > VALID_GAMES.length) {
      return errorResponse("Invalid games selection.");
    }

    const cleanGames: string[] = [];

    for (const game of submittedGames) {
      if (
        typeof game !== "string" ||
        !VALID_GAMES.includes(game)
      ) {
        return errorResponse(
          "One or more selected games are invalid."
        );
      }

      if (cleanGames.includes(game)) {
        return errorResponse("Duplicate games are not allowed.");
      }

      cleanGames.push(game);
    }

    // AT LEAST ONE COMPETITION OR GAME IS REQUIRED
    if (!cleanCompetition && cleanGames.length === 0) {
      return errorResponse(
        "Please select a competition or at least one game."
      );
    }

    // LADIES-ONLY RESTRICTIONS
    const selectedLadiesOnlyCompetition =
      cleanCompetition !== null &&
      LADIES_ONLY_COMPETITIONS.includes(cleanCompetition);

    const selectedLadiesOnlyGame = cleanGames.some((game) =>
      LADIES_ONLY_GAMES.includes(game)
    );

    if (
      (selectedLadiesOnlyCompetition || selectedLadiesOnlyGame) &&
      cleanGender !== "Female"
    ) {
      return errorResponse(
        "Ululu Competition and Blindfold Bindi Challenge are for ladies only. Please select Female as the participant's gender."
      );
    }

    // NOTES
    if (
      notes !== undefined &&
      notes !== null &&
      typeof notes !== "string"
    ) {
      return errorResponse("Invalid additional notes.");
    }

    const cleanNotes =
      typeof notes === "string"
        ? notes.trim().slice(0, 2000) || null
        : null;

    // DATABASE INSERT
    let savedRegistration: {
      id: string;
      registration_no: string;
    } | null = null;

    let lastError: { code?: string; message?: string } | null = null;

    // Retry only when the generated registration number already exists.
    for (let attempt = 1; attempt <= 3; attempt++) {
      const registrationNo = generateRegistrationNo();

      const { data, error } = await supabaseAdmin
        .from("event_registrations")
        .insert({
          registration_no: registrationNo,
          participant_name: cleanName,
          age: numericAge,
          gender: cleanGender,
          block,
          flat_no: cleanFlatNo,
          mobile: cleanMobile,
          email: cleanEmail,
          competition: cleanCompetition,
          games: cleanGames,
          notes: cleanNotes,
          event_date: "2026-10-16",
          status: "pending",
        })
        .select("id, registration_no")
        .single();

      if (!error && data) {
        savedRegistration = data;
        break;
      }

      lastError = error;

      if (error?.code !== "23505") {
        break;
      }
    }

    if (!savedRegistration) {
      console.error("Event registration database error:", lastError);

      return errorResponse(
        "Unable to submit registration. Please try again.",
        500
      );
    }

    // SUCCESS RESPONSE
    return NextResponse.json(
      {
        success: true,
        id: savedRegistration.id,
        registrationNo: savedRegistration.registration_no,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Event registration API error:", error);

    return errorResponse(
      "Something went wrong. Please check your connection and try again.",
      500
    );
  }
}
