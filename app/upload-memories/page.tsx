"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type UploadType = "photo" | "video" | null;

export default function UploadMemoriesPage() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] =
    useState<UploadType>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [name, setName] = useState("");

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  function openPhotoPicker() {
    setUploadType("photo");
    setError("");
    setMessage("");
    photoInputRef.current?.click();
  }

  function openVideoPicker() {
    setUploadType("video");
    setError("");
    setMessage("");
    videoInputRef.current?.click();
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setMessage("");
  }

  async function uploadFile() {
    if (!file) {
      setError("Please select a photo or video.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      if (name.trim()) {
        formData.append(
          "uploadedBy",
          name.trim()
        );
      }

      const response = await fetch(
        "/api/gallery/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to upload your memory."
        );
      }

      setMessage(
        "Thank you! Your memory has been uploaded successfully and is waiting for admin approval. ❤️"
      );

      setFile(null);
      setUploadType(null);
      setName("");

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the file."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf2] text-[#292929]">

      {/* NAVBAR */}

      <div className="relative z-30 mx-auto -mt-2 mb-3 w-full max-w-7xl rounded-2xl border border-[#ead8bd]/70 bg-[#fffaf2]/95 shadow-[0_8px_30px_rgba(120,70,20,0.08)] backdrop-blur-sm max-[600px]:rounded-xl">
        <Navbar />
      </div>

      {/* PAGE */}

      <section className="relative overflow-hidden px-5 py-16 sm:py-24">

        <div className="absolute left-[-100px] top-20 h-72 w-72 rounded-full bg-[#b8892d]/10 blur-3xl" />

        <div className="absolute bottom-[-100px] right-[-80px] h-72 w-72 rounded-full bg-[#a70e18]/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">

          {/* HEADER */}

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
              Did you capture a beautiful moment
              during BUH Durga Puja? Share it with
              the community and let us celebrate
              those memories together.
            </p>

          </div>

          {/* UPLOAD CARD */}

          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-[#ead8bd] bg-white p-6 shadow-[0_20px_60px_rgba(120,70,20,0.08)] sm:p-8">

            <div className="grid gap-4 sm:grid-cols-2">

              {/* PHOTO */}

              <button
                type="button"
                onClick={openPhotoPicker}
                className="
                  group rounded-2xl
                  border border-[#ead8bd]
                  bg-[#fffaf2]
                  p-7 text-center
                  transition
                  hover:-translate-y-1
                  hover:border-[#d7b66a]
                  hover:shadow-lg
                "
              >

                <div className="
                  mx-auto flex h-14 w-14
                  items-center justify-center
                  rounded-2xl
                  bg-[#a70e18]
                  text-xl text-white
                  shadow-md
                ">
                  <i className="fa-solid fa-camera" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#761019]">
                  Upload Photo
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#766457]">
                  JPG, PNG or WEBP
                  <br />
                  Maximum 10 MB
                </p>

              </button>

              {/* VIDEO */}

              <button
                type="button"
                onClick={openVideoPicker}
                className="
                  group rounded-2xl
                  border border-[#ead8bd]
                  bg-[#fffaf2]
                  p-7 text-center
                  transition
                  hover:-translate-y-1
                  hover:border-[#d7b66a]
                  hover:shadow-lg
                "
              >

                <div className="
                  mx-auto flex h-14 w-14
                  items-center justify-center
                  rounded-2xl
                  bg-[#a70e18]
                  text-xl text-white
                  shadow-md
                ">
                  <i className="fa-solid fa-video" />
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#761019]">
                  Upload Video
                </h2>

                <p className="mt-2 text-xs leading-5 text-[#766457]">
                  MP4, MOV or WEBM
                  <br />
                  Maximum 200 MB
                </p>

              </button>

            </div>

            {/* HIDDEN INPUTS */}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* SELECTED FILE */}

            {file && (
              <div className="mt-6 rounded-2xl border border-[#ead8bd] bg-[#fffaf2] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] text-[#a70e18]">
                    <i
                      className={
                        uploadType === "video"
                          ? "fa-solid fa-video"
                          : "fa-solid fa-image"
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="truncate text-sm font-semibold text-[#444]">
                      {file.name}
                    </div>

                    <div className="mt-1 text-xs text-[#999]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);

                      if (photoInputRef.current) {
                        photoInputRef.current.value = "";
                      }

                      if (videoInputRef.current) {
                        videoInputRef.current.value = "";
                      }
                    }}
                    className="text-xs font-semibold text-[#a70e18]"
                  >
                    Remove
                  </button>

                </div>

              </div>
            )}

            {/* NAME */}

            <div className="mt-6">

              <label className="mb-2 block text-xs font-semibold text-[#555]">
                Your Name
                <span className="font-normal text-[#aaa]">
                  {" "}
                  (Optional)
                </span>
              </label>

              <input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
                className="
                  w-full rounded-xl
                  border border-[#e5d7c7]
                  bg-white px-4 py-3
                  text-sm outline-none
                  transition
                  focus:border-[#a70e18]
                  focus:ring-2
                  focus:ring-[#a70e18]/10
                "
              />

            </div>

            {/* MESSAGE */}

            {error && (
              <div className="mt-5 rounded-xl bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#a70e18]">
                <i className="fa-solid fa-circle-exclamation mr-2" />
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-xl bg-[#edf8f0] px-4 py-3 text-sm font-medium text-[#23753b]">
                <i className="fa-solid fa-circle-check mr-2" />
                {message}
              </div>
            )}

            {/* UPLOAD BUTTON */}

            <button
              type="button"
              onClick={uploadFile}
              disabled={!file || uploading}
              className="
                mt-6 w-full rounded-xl
                bg-[#a70e18]
                px-6 py-4
                text-sm font-bold
                text-white
                shadow-lg
                transition
                hover:bg-[#7d0b13]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >

              {uploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up mr-2" />
                  Upload Memory
                </>
              )}

            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-[#999]">
              All uploads are reviewed by the BUH
              Durga Puja Committee before appearing
              in the public gallery.
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