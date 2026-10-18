
"use client";

import { useCallback, useEffect, useState } from "react";

type MediaItem = {
  id: string;
  participant_name: string;
  slot_number: number;
  media_type: "audio" | "video";
  file_name: string;
  storage_path?: string;
  created_at: string;
  playbackUrl: string;
  downloadUrl: string;
};

type ApiMediaItem = Record<string, unknown>;

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function getString(
  item: ApiMediaItem,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value) return value;
  }
  return fallback;
}

function normalizeMedia(item: ApiMediaItem): MediaItem {
  const fileName = getString(item, ["file_name", "fileName"], "Media file");

  const mediaTypeValue = getString(
    item,
    ["media_type", "mediaType"],
    /\.(mp3|wav|aac|m4a|ogg)$/i.test(fileName) ? "audio" : "video"
  );

  return {
    id: getString(item, ["id"]),
    participant_name: getString(item, [
      "participant_name",
      "participantName",
    ]),
    slot_number: Number(item.slot_number ?? item.slotNumber ?? 0),
    media_type: mediaTypeValue === "audio" ? "audio" : "video",
    file_name: fileName,
    storage_path: getString(item, ["storage_path", "storagePath"]),
    created_at: getString(item, ["created_at", "createdAt"]),
    playbackUrl: getString(item, [
      "playbackUrl",
      "playback_url",
      "playUrl",
      "play_url",
      "signedUrl",
      "signed_url",
      "url",
    ]),
    downloadUrl: getString(item, [
      "downloadUrl",
      "download_url",
    ]),
  };
}

export default function CulturalMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [participantName, setParticipantName] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/cultural-media", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load submissions.");
      }

      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result.items)
          ? result.items
          : [];

      const normalized = rows.map((item: ApiMediaItem) =>
        normalizeMedia(item)
      );

      normalized.sort(
        (a: MediaItem, b: MediaItem) =>
          a.slot_number - b.slot_number ||
          b.created_at.localeCompare(a.created_at)
      );

      setItems(normalized);

      // Refresh the selected item's signed URLs too.
      setSelected((current) =>
        current
          ? normalized.find((item: MediaItem) => item.id === current.id) ?? null
          : null
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load submissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!participantName.trim()) {
      setError("Enter the participant or group name.");
      return;
    }

    if (!Number.isInteger(Number(slotNumber)) || Number(slotNumber) < 1) {
      setError("Enter a valid slot number.");
      return;
    }

    if (!file) {
      setError("Select a song or video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The maximum file size is 200 MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("participantName", participantName.trim());
      formData.append("slotNumber", slotNumber);
      formData.append("file", file);

      const response = await fetch("/api/admin/cultural-media", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed.");
      }

      setParticipantName("");
      setSlotNumber("");
      setFile(null);

      const fileInput = document.getElementById(
        "cultural-media-file"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      setSuccess("File uploaded successfully.");
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to upload the file."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const item = items.find((entry) => entry.id === id);

    if (
      !window.confirm(
        `Delete "${item?.file_name ?? "this file"}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/cultural-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete the file.");
      }

      setItems((current) => current.filter((entry) => entry.id !== id));

      if (selected?.id === id) setSelected(null);

      setSuccess("File deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete the file."
      );
    }
  }

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.participant_name.toLowerCase().includes(query) ||
      item.file_name.toLowerCase().includes(query) ||
      String(item.slot_number).includes(query);

    const matchesType =
      typeFilter === "all" || item.media_type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <main className="min-h-screen bg-[#fcf8f1] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#a70e18]">
              BUH Durga Puja
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#560100] sm:text-3xl">
              Cultural Media
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage songs and videos submitted for cultural performances.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-lg border border-[#ead9c7] bg-white px-4 py-2.5 text-sm font-semibold text-[#a70e18] hover:bg-[#fcf8f1]"
          >
            Back to Admin
          </a>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            {success}
          </div>
        )}

        {/* Admin upload form */}
        <section className="mb-7 rounded-2xl border border-[#ead9c7] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[#560100]">
            Upload Song or Video
          </h2>

          <form
            onSubmit={handleUpload}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="participant-name"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Participant / Group Name *
              </label>
              <input
                id="participant-name"
                required
                maxLength={150}
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter participant name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#a70e18]"
              />
            </div>

            <div>
              <label
                htmlFor="slot-number"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Slot Number *
              </label>
              <input
                id="slot-number"
                type="number"
                min={1}
                step={1}
                required
                value={slotNumber}
                onChange={(e) => setSlotNumber(e.target.value)}
                placeholder="Enter slot number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#a70e18]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="cultural-media-file"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Song / Video File *
              </label>
              <input
                id="cultural-media-file"
                type="file"
                required
                accept=".mp3,.wav,.aac,.m4a,.ogg,.mp4,.mov,.webm,audio/*,video/mp4,video/quicktime,video/webm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                MP3, WAV, AAC, M4A, OGG, MP4, MOV or WEBM. Maximum 200 MB.
              </p>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-[#a70e18] px-5 py-3 text-sm font-semibold text-white hover:bg-[#850b13] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </form>
        </section>

        {/* Compact submission list */}
        <section className="rounded-2xl border border-[#ead9c7] bg-white p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#560100]">
                Submitted Files
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {filteredItems.length} of {items.length} files
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadItems()}
              disabled={loading}
              className="rounded-lg border border-[#ead9c7] px-3 py-2 text-sm font-semibold text-[#a70e18] hover:bg-[#fcf8f1] disabled:opacity-60"
            >
              <i className="fa-solid fa-rotate-right mr-2" />
              Refresh
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search participant, file or slot..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#a70e18]"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a70e18]"
            >
              <option value="all">All files</option>
              <option value="audio">Songs / Audio</option>
              <option value="video">Videos</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading submissions...
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
              No files found.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-[#ead9c7] p-3 transition hover:bg-[#fcf8f1] sm:gap-4 sm:p-4"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    aria-label={`Preview ${item.file_name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f8e9e9] text-[#a70e18]"
                  >
                    <i
                      className={`fa-solid ${
                        item.media_type === "video"
                          ? "fa-circle-play"
                          : "fa-music"
                      } text-lg`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-semibold text-gray-900">
                      {item.participant_name || "Unnamed participant"}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-600">
                      Slot {item.slot_number} · {item.file_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.media_type === "video" ? "Video" : "Audio"}
                      {item.created_at &&
                        ` · ${new Date(item.created_at).toLocaleString()}`}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="shrink-0 rounded-lg border border-[#ead9c7] px-3 py-2 text-sm font-semibold text-[#a70e18] hover:bg-white"
                  >
                    <span className="hidden sm:inline">View</span>
                    <i className="fa-solid fa-chevron-right sm:ml-2" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id)}
                    aria-label={`Delete ${item.file_name}`}
                    className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <i className="fa-regular fa-trash-can" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Popup player */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5"
          onClick={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Cultural media preview"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[#560100]">
                  {selected.participant_name || "Unnamed participant"}
                </h2>
                <p className="mt-1 break-words text-sm text-gray-600">
                  Slot {selected.slot_number} · {selected.file_name}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {selected.media_type === "video" ? "Video" : "Audio"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close preview"
                className="shrink-0 rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                &times;
              </button>
            </div>

            <div className="mt-5">
              {!selected.playbackUrl ? (
                <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                  The playback URL is missing. Refresh the list and check
                  the signed URL fields returned by the admin API.
                </p>
              ) : selected.media_type === "video" ? (
                <video
                  key={selected.id}
                  src={selected.playbackUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[55vh] w-full rounded-lg bg-black"
                />
              ) : (
                <audio
                  key={selected.id}
                  src={selected.playbackUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {selected.downloadUrl ? (
                <a
                  href={selected.downloadUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#292929] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  <i className="fa-solid fa-download" />
                  Download Original File
                </a>
              ) : selected.playbackUrl ? (
                <a
                  href={selected.playbackUrl}
                  download={selected.file_name}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#292929] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  <i className="fa-solid fa-download" />
                  Download File
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => void handleDelete(selected.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <i className="fa-regular fa-trash-can" />
                Delete
              </button>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
