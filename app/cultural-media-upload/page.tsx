
"use client";

import { useState } from "react";

export default function CulturalMediaUploadPage() {
  const [participantName, setParticipantName] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!file) {
      setError("Please select your song or video.");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError("The maximum file size is 200 MB.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("participantName", participantName.trim());
      formData.append("slotNumber", slotNumber);
      formData.append("file", file);

      // Honeypot field for basic bot filtering.
      formData.append("website", "");

      const response = await fetch("/api/cultural-media/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setMessage(
        "Your file has been submitted successfully. Thank you!"
      );
      setParticipantName("");
      setSlotNumber("");
      setFile(null);

      const fileInput = document.getElementById(
        "media-file"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the file. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fcf8f1] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#ead9c7] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#a70e18]">
          BUH Durga Puja
        </p>

        <h1 className="mt-2 text-2xl font-bold text-[#560100] sm:text-3xl">
          Cultural Program Media Upload
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Upload the song or video for your cultural performance.
          Please enter your registered participant name and correct
          slot number.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="participant-name"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Participant / Group Name *
            </label>

            <input
              id="participant-name"
              type="text"
              required
              maxLength={150}
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter participant or group name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#a70e18]"
            />
          </div>

          <div>
            <label
              htmlFor="slot-number"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Performance Slot Number *
            </label>

            <input
              id="slot-number"
              type="number"
              required
              min={1}
              step={1}
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              placeholder="Enter your slot number"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#a70e18]"
            />
          </div>

          <div>
            <label
              htmlFor="media-file"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Song or Video File *
            </label>

            <input
              id="media-file"
              type="file"
              required
              accept=".mp3,.wav,.aac,.m4a,.ogg,.mp4,.mov,.webm,audio/*,video/mp4,video/quicktime,video/webm"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm"
            />

            <p className="mt-2 text-xs text-gray-500">
              Supported formats: MP3, WAV, AAC, M4A, OGG, MP4,
              MOV and WEBM. Maximum size: 200 MB.
            </p>

            {file && (
              <p className="mt-2 break-words text-sm text-gray-700">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Hidden honeypot field for basic bot filtering */}
          <div
            aria-hidden="true"
            className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
          >
            <label htmlFor="website">Leave this field empty</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              onChange={() => {}}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#a70e18] px-5 py-3 font-semibold text-white transition hover:bg-[#850b13] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Submit Performance File"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">
          Please ensure you upload the correct file for your
          performance slot.
        </p>
      </div>
    </main>
  );
}
