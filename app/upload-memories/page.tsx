
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type UploadType = "photo" | "video";

type SelectedFile = {
  id: string;
  file: File;
  type: UploadType;
};

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export default function UploadMemoriesPage() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function openPicker(type: UploadType) {
    setError("");
    setMessage("");

    if (type === "photo") {
      photoInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    type: UploadType
  ) {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) return;

    setError("");
    setMessage("");

    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const allowedTypes =
        type === "photo" ? PHOTO_TYPES : VIDEO_TYPES;

      const maxSize =
        type === "photo" ? MAX_PHOTO_SIZE : MAX_VIDEO_SIZE;

      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file format.`);
        continue;
      }

      if (file.size > maxSize) {
        errors.push(
          `${file.name}: Maximum size is ${
            type === "photo" ? "10 MB" : "200 MB"
          }.`
        );
        continue;
      }

      if (file.size === 0) {
        errors.push(`${file.name}: The file is empty.`);
        continue;
      }

      validFiles.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        type,
      });
    }

    setFiles((previous) => {
      const combined = [...previous];

      for (const item of validFiles) {
        const alreadyAdded = combined.some(
          (existing) =>
            existing.file.name === item.file.name &&
            existing.file.size === item.file.size &&
            existing.file.lastModified ===
              item.file.lastModified
        );

        if (!alreadyAdded) combined.push(item);
      }

      return combined;
    });

    if (errors.length) {
      setError(errors.slice(0, 5).join("\n") +
        (errors.length > 5
          ? `\nAnd ${errors.length - 5} more invalid files.`
          : ""));
    }

    // Allow selecting the same files again later.
    event.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((previous) =>
      previous.filter((item) => item.id !== id)
    );
    setMessage("");
  }

  async function uploadFiles() {
    if (!files.length) {
      setError("Please select at least one photo or video.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");
    setMessage("");

    let successCount = 0;
    const failedFiles: string[] = [];

    try {
      for (let index = 0; index < files.length; index++) {
        const item = files[index];
        const formData = new FormData();

        // Existing API expects a single "file".
        formData.append("file", item.file);

        if (name.trim()) {
          formData.append("uploadedBy", name.trim());
        }

        try {
          const response = await fetch("/api/gallery/upload", {
            method: "POST",
            body: formData,
          });

          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              result.error || "Upload failed."
            );
          }

          successCount++;
        } catch (uploadError) {
          failedFiles.push(
            `${item.file.name}: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Upload failed."
            }`
          );
        }

        setUploadProgress(
          Math.round(((index + 1) / files.length) * 100)
        );
      }

      if (failedFiles.length === 0) {
        setMessage(
          `Thank you! All ${successCount} ${
            successCount === 1 ? "file has" : "files have"
          } been uploaded successfully and ${
            successCount === 1 ? "is" : "are"
          } waiting for admin approval. ❤️`
        );

        setFiles([]);
        setName("");
      } else {
        setError(
          `${successCount} of ${files.length} files uploaded successfully.\n` +
            failedFiles.join("\n")
        );

        // Keep only failed files so they can be retried.
        const failedNames = new Set(
          failedFiles.map((item) => item.split(": ")[0])
        );

        setFiles((previous) =>
          previous.filter((item) =>
            failedNames.has(item.file.name)
          )
        );
      }
    } finally {
      setUploading(false);
    }
  }

  const photoCount = files.filter(
    (item) => item.type === "photo"
  ).length;

  const videoCount = files.filter(
    (item) => item.type === "video"
  ).length;

  const totalSize = files.reduce(
    (total, item) => total + item.file.size,
    0
  );

  return (
    <main className="min-h-screen bg-[#fffaf2] text-[#292929]">
      <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
        <Navbar />
      </div>

      <section className="relative overflow-hidden px-5 py-16 sm:py-24">
        <div className="absolute left-[-100px] top-20 h-72 w-72 rounded-full bg-[#b8892d]/10 blur-3xl" />
        <div className="absolute bottom-[-100px] right-[-80px] h-72 w-72 rounded-full bg-[#a70e18]/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d7b66a] bg-[#fff8ec] text-2xl text-[#a70e18] shadow-sm">
              <i className="fa-solid fa-images" />
            </div>

            <p className="mt-6 text-xs font-bold tracking-[0.35em] text-[#a77a2b]">
              SHARE YOUR MEMORIES
            </p>

            <h1 className="mt-3 text-4xl font-bold text-[#761019] sm:text-5xl">
              Upload Your Memories
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#766457]">
              Captured beautiful moments during BUH Durga Puja?
              Share multiple photos and videos together with
              the community.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[#ead8bd] bg-white p-6 shadow-[0_20px_60px_rgba(120,70,20,0.08)] sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openPicker("photo")}
                disabled={uploading}
                className="group rounded-2xl border border-[#ead8bd] bg-[#fffaf2] p-7 text-center transition hover:-translate-y-1 hover:border-[#d7b66a] hover:shadow-lg disabled:opacity-50"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a70e18] text-xl text-white shadow-md">
                  <i className="fa-solid fa-camera" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#761019]">
                  Add Photos
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#766457]">
                  JPG, PNG or WEBP
                  <br />
                  Maximum 10 MB per photo
                  <br />
                  Select multiple photos
                </p>
              </button>

              <button
                type="button"
                onClick={() => openPicker("video")}
                disabled={uploading}
                className="group rounded-2xl border border-[#ead8bd] bg-[#fffaf2] p-7 text-center transition hover:-translate-y-1 hover:border-[#d7b66a] hover:shadow-lg disabled:opacity-50"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a70e18] text-xl text-white shadow-md">
                  <i className="fa-solid fa-video" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#761019]">
                  Add Videos
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#766457]">
                  MP4, MOV or WEBM
                  <br />
                  Maximum 200 MB per video
                  <br />
                  Select multiple videos
                </p>
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(event) =>
                handleFileChange(event, "photo")
              }
            />

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(event) =>
                handleFileChange(event, "video")
              }
            />

            {files.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[#ead8bd] bg-[#fffaf2] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#761019]">
                      Selected Files ({files.length})
                    </h3>
                    <p className="mt-1 text-xs text-[#766457]">
                      {photoCount} photos · {videoCount} videos ·{" "}
                      {(totalSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setFiles([])}
                      className="text-xs font-semibold text-[#a70e18] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-[#eee1d0] bg-white p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] text-[#a70e18]">
                        <i
                          className={
                            item.type === "video"
                              ? "fa-solid fa-video"
                              : "fa-solid fa-image"
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#444]">
                          {item.file.name}
                        </p>
                        <p className="mt-1 text-xs text-[#999]">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          {" · "}
                          {item.type === "photo" ? "Photo" : "Video"}
                        </p>
                      </div>

                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          aria-label={`Remove ${item.file.name}`}
                          className="shrink-0 px-2 py-1 text-xs font-semibold text-[#a70e18] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-[#766457]">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#ead8bd]">
                      <div
                        className="h-full rounded-full bg-[#a70e18] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="uploader-name"
                className="mb-2 block text-xs font-semibold text-[#555]"
              >
                Your Name{" "}
                <span className="font-normal text-[#aaa]">
                  (Optional)
                </span>
              </label>

              <input
                id="uploader-name"
                value={name}
                disabled={uploading}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-[#e5d7c7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a70e18] focus:ring-2 focus:ring-[#a70e18]/10 disabled:bg-gray-100"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 whitespace-pre-line rounded-xl bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#a70e18]"
              >
                <i className="fa-solid fa-circle-exclamation mr-2" />
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mt-5 rounded-xl bg-[#edf8f0] px-4 py-3 text-sm font-medium text-[#23753b]"
              >
                <i className="fa-solid fa-circle-check mr-2" />
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={uploadFiles}
              disabled={!files.length || uploading}
              className="mt-6 w-full rounded-xl bg-[#a70e18] px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#7d0b13] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Uploading {uploadProgress}%...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up mr-2" />
                  Upload {files.length > 0 ? `${files.length} Files` : "Memories"}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#999]">
              All uploads are reviewed by the BUH Durga Puja
              Committee before appearing in the public gallery.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm font-semibold text-[#a70e18] hover:underline"
            >
              <i className="fa-solid fa-arrow-left mr-2" />
              Back to BUH Durga Puja
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
