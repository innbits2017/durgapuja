"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";

const events = [
  {
    day: "MAHA SHASHTI",
    shortDay: "Shashthi",
    date: "16 OCTOBER 2026",
    image: "/images/shashti-puja.webp",
    icon: "fa-solid fa-hands-praying",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "—",
      afternoon: "Maa Durga Welcome & Shashthi Puja",
      evening: "Kids Drawing + Family Tambola",
      night: "Dinner",
    },
  },
  {
    day: "MAHA SAPTAMI",
    shortDay: "Saptami",
    date: "17 OCTOBER 2026",
    image: "/images/saptami-puja.webp",
    icon: "fa-solid fa-fire-flame-curved",
    color: "bg-[#a70e18]",
    schedule: {
      morning: "Breakfast + Saptami Puja & Pushpanjali",
      afternoon: "Kids Carnival + Family Treasure Hunt",
      evening: "Dandia Night",
      night: "Dinner",
    },
  },
  {
    day: "MAHA ASHTAMI",
    shortDay: "Ashtami",
    date: "18 OCTOBER 2026",
    image: "/images/ashtami-puja.webp",
    icon: "fa-solid fa-om",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "Breakfast + Maha Ashtami Puja & Pushpanjali",
      afternoon: "Family Games + Kids Fun Zone",
      evening: "Cultural Programme",
      night: "Dinner",
    },
  },
  {
    day: "MAHA NAVAMI",
    shortDay: "Navami",
    date: "19 OCTOBER 2026",
    image: "/images/navami.webp",
    icon: "fa-solid fa-spa",
    color: "bg-[#a70e18]",
    schedule: {
      morning: "Breakfast + Navami Puja & Pushpanjali",
      afternoon: "Kanya Pujan + Community Lunch",
      evening: "Grand Cultural Programme",
      night: "Dinner",
    },
  },
  {
    day: "VIJAYA DASHAMI",
    shortDay: "Dashami",
    date: "20 OCTOBER 2026",
    image: "/images/dashami.webp",
    icon: "fa-solid fa-flag",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "Breakfast + Dashami Puja & Farewell Rituals",
      afternoon: "Bhasani / Visarjan",
      evening: "Community Lunch",
      night: "—",
    },
  },
];

const photoGallery = [
  {
    src: "/images/gallery/durgapuga15.webp",
    alt: "Maa Durga",
    title: "Maa Durga",
  },
  {
    src: "/images/gallery/durga-puja-dandia.webp",
    alt: "Maa Durga",
    title: "Maa Durga",
  },
  {
    src: "/images/gallery/puri-durgapuja2025.webp",
    alt: "Maa Durga",
    title: "Maa Durga",
  },
  {
    src: "/images/gallery/durgapuga14.webp",
    alt: "Saptami Puja",
    title: "Devotion",
  },
  {
    src: "/images/gallery/durgapuga2.webp",
    alt: "Ashtami Puja",
    title: "Celebration",
  },
  {
    src: "/images/gallery/durgapuga3.webp",
    alt: "Navami Celebration",
    title: "Togetherness",
  },
  {
    src: "/images/gallery/durgapuga4.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga5.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga6.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga9.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga10.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga11.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga12.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga13.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga27.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga28.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
  {
    src: "/images/gallery/durgapuga216.webp",
    alt: "Dashami Celebration",
    title: "Tradition",
  },
];

const videoGallery = [
  {
    thumbnail: "/images/durga-puja-collection.webp",
    title: "BUH Durga Puja Highlights",
    description: "Moments from our Durga Puja celebrations",
    url: "https://youtu.be/Lky6t5c3lFQ",
  },
  {
    thumbnail: "/images/saptami-puja.webp",
    title: "Saptami Celebration",
    description: "Devotion, music and togetherness",
    url: "https://youtube.com/shorts/0m4UV7WoBP0",
  },
  {
    thumbnail: "/images/ashtami-puja.webp",
    title: "Ashtami Cultural Evening",
    description: "A celebration of talent and culture",
    url: "https://youtube.com/shorts/3yRCgSsqW1Q",
  },
  {
    thumbnail: "/images/navami.webp",
    title: "Navami Celebration",
    description: "Beautiful moments from BUH",
    url: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID_4",
  },
  {
    thumbnail: "/images/dashami.webp",
    title: "Vijaya Dashami",
    description: "Farewell to Maa Durga",
    url: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID_5",
  },
];

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.replace("/", "").split("/")[0];
    } else if (parsed.hostname.includes("youtube.com")) {
      videoId =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/(?:embed|shorts)\/([^/?]+)/)?.[1] ||
        "";
    }

    if (!videoId) return "";

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  } catch {
    return "";
  }
}

const aboutItems = [
  {
    icon: "fa-solid fa-hands-praying",
    title: "Devotion",
    text:
      "Honouring Maa Durga with faith, prayers and tradition.",
  },
  {
    icon: "fa-solid fa-people-group",
    title: "Togetherness",
    text:
      "Bringing our entire BUH community together as one.",
  },
  {
    icon: "fa-solid fa-music",
    title: "Celebration",
    text:
      "Creating beautiful memories for every generation.",
  },
];

const supportTypes = [
  {
    title: "Businesses",
    icon: "fa-solid fa-store",
  },
  {
    title: "Builders",
    icon: "fa-solid fa-building",
  },
  {
    title: "Brands",
    icon: "fa-solid fa-tags",
  },
  {
    title: "Companies",
    icon: "fa-solid fa-building-columns",
  },
  {
    title: "Vendors",
    icon: "fa-solid fa-handshake",
  },
  {
    title: "Individuals",
    icon: "fa-solid fa-user",
  },
];

function Reveal({
  children,
  className = "",
  delay = 0,
  animation = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "up" | "left" | "right" | "scale" | "fade";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("reveal-visible");
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal reveal-${animation} ${className}`}
    >
      {children}
    </div>
  );
}

function GallerySlider({
  items,
  type,
}: {
  items: any[];
  type: "image" | "video";
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const [lightboxIndex, setLightboxIndex] =
    useState<number | null>(null);

  /* -----------------------------------------
     Responsive items per slide
  ------------------------------------------ */

  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (type === "image") {
        if (window.innerWidth >= 1024) {
          setItemsPerSlide(4);
        } else if (window.innerWidth >= 768) {
          setItemsPerSlide(2);
        } else {
          setItemsPerSlide(1);
        }
      } else {
        if (window.innerWidth >= 1024) {
          setItemsPerSlide(3);
        } else if (window.innerWidth >= 768) {
          setItemsPerSlide(2);
        } else {
          setItemsPerSlide(1);
        }
      }
    };

    updateItemsPerSlide();

    window.addEventListener(
      "resize",
      updateItemsPerSlide
    );

    return () =>
      window.removeEventListener(
        "resize",
        updateItemsPerSlide
      );
  }, [type]);

  /* -----------------------------------------
     Reset slider when layout changes
  ------------------------------------------ */

  useEffect(() => {
    setCurrentIndex(0);
  }, [itemsPerSlide]);

  const maxIndex = Math.max(
    0,
    items.length - itemsPerSlide
  );

  /* -----------------------------------------
     Next / Previous
  ------------------------------------------ */

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev >= maxIndex ? 0 : prev + 1
    );
  };

  const previousSlide = () => {
    setCurrentIndex((prev) =>
      prev <= 0 ? maxIndex : prev - 1
    );
  };

  /* -----------------------------------------
     Auto Slider
  ------------------------------------------ */

  useEffect(() => {
    if (isPaused || items.length <= itemsPerSlide) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev >= maxIndex ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [
    isPaused,
    maxIndex,
    items.length,
    itemsPerSlide,
  ]);

  /* -----------------------------------------
     Fullscreen
  ------------------------------------------ */

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsPaused(true);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setIsPaused(false);
  };

  const nextLightbox = () => {
    if (lightboxIndex === null) return;

    setLightboxIndex(
      lightboxIndex >= items.length - 1
        ? 0
        : lightboxIndex + 1
    );
  };

  const previousLightbox = () => {
    if (lightboxIndex === null) return;

    setLightboxIndex(
      lightboxIndex <= 0
        ? items.length - 1
        : lightboxIndex - 1
    );
  };

  /* -----------------------------------------
     ESC key
  ------------------------------------------ */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        nextLightbox();
      }

      if (event.key === "ArrowLeft") {
        previousLightbox();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [lightboxIndex]);

  return (
    <>
      {/* =================================================
          SLIDER
      ================================================== */}

      <div
        className="relative"
        onMouseEnter={() =>
          setIsPaused(true)
        }
        onMouseLeave={() =>
          setIsPaused(false)
        }
      >

        <div className="overflow-hidden">

          <div
            className="flex gap-4 transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${
                currentIndex *
                (100 / itemsPerSlide)
              }%)`,
            }}
          >

            {items.map((item, index) => (

              <div
                key={`${type}-${index}`}
                className={
                  type === "image"
                    ? "min-w-[calc(100%-0px)] md:min-w-[calc(50%-8px)] lg:min-w-[calc(25%-12px)]"
                    : "min-w-[calc(100%-0px)] md:min-w-[calc(50%-8px)] lg:min-w-[calc(33.333%-10.667px)]"
                }
              >

                {type === "image" ? (

                  /* =======================================
                     IMAGE
                  ======================================== */

                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(index)
                    }
                    className="group relative block w-full overflow-hidden rounded-2xl bg-[#eadcc9] text-left shadow-md"
                    aria-label={`View ${item.title} fullscreen`}
                  >

                    <div className="relative aspect-[4/3]">

                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      {/* Overlay */}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#3b090d]/80 via-transparent to-transparent" />

                      {/* Fullscreen icon */}

                      <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100">

                        <i className="fa-solid fa-expand" />

                      </div>

                      {/* Caption */}

                      <div className="absolute bottom-4 left-4 right-4">

                        <div className="flex items-center gap-2">

                          <i className="fa-solid fa-spa text-sm text-[#e8c979]" />

                          <p className="text-[9px] font-bold tracking-[0.15em] text-[#e8c979]">
                            BUH DURGA PUJA
                          </p>

                        </div>

                        <p className="mt-1 text-base font-bold text-white">
                          {item.title}
                        </p>

                      </div>

                    </div>

                  </button>

                ) : (

                  /* =======================================
                     VIDEO
                  ======================================== */

                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(index)
                    }
                    className="group block w-full text-left"
                  >

                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#241b17] shadow-md">

                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/50" />

                      {/* Play */}

                      <div className="absolute inset-0 flex items-center justify-center">

                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-[#a70e18]/90 text-white shadow-xl transition duration-300 group-hover:scale-110">

                          <i className="fa-solid fa-play ml-1 text-lg" />

                        </div>

                      </div>

                      {/* Video Label */}

                      <div className="absolute left-4 top-4">

                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[9px] font-bold tracking-[0.15em] text-white backdrop-blur-md">

                          <i className="fa-solid fa-video text-[#e8c979]" />

                          VIDEO

                        </span>

                      </div>

                    </div>

                    <div className="mt-3">

                      <h3 className="text-base font-bold text-[#761019]">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#766457]">
                        {item.description}
                      </p>

                    </div>

                  </button>

                )}

              </div>

            ))}

          </div>

        </div>


        {/* ===============================================
            SLIDER CONTROLS
        ================================================ */}

        <div className="mt-5 flex items-center justify-between">

          {/* Dots */}

          <div className="flex gap-1.5">

            {Array.from({
              length: maxIndex + 1,
            }).map((_, index) => (

              <button
                key={index}
                type="button"
                onClick={() =>
                  setCurrentIndex(index)
                }
                aria-label={`Go to slide ${
                  index + 1
                }`}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === index
                    ? "w-7 bg-[#a70e18]"
                    : "w-1.5 bg-[#d7b66a]"
                }`}
              />

            ))}

          </div>


          {/* Arrows */}

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={previousSlide}
              aria-label="Previous slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7b66a] bg-white text-sm text-[#a70e18] shadow-sm transition hover:bg-[#fff8ec]"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7b66a] bg-white text-sm text-[#a70e18] shadow-sm transition hover:bg-[#fff8ec]"
            >
              <i className="fa-solid fa-arrow-right" />
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          FULLSCREEN LIGHTBOX
      ================================================== */}

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
          onClick={closeLightbox}
        >

          {/* Close */}

          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close fullscreen"
            className="absolute right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur-md transition hover:bg-[#a70e18]"
          >
            <i className="fa-solid fa-xmark" />
          </button>


          {/* Previous */}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previousLightbox();
            }}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-[#a70e18] sm:left-8"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>


          {/* Next */}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              nextLightbox();
            }}
            aria-label="Next image"
            className="absolute right-4 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-[#a70e18] sm:right-8"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>


          {/* Content */}

          <div
            className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {type === "image" ? (

              <img
                src={items[lightboxIndex].src}
                alt={items[lightboxIndex].alt}
                className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              />

            ) : (

              <div className="w-[90vw] max-w-5xl">

                <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">

                  {getYouTubeEmbedUrl(
                    items[lightboxIndex].url
                  ) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(
                        items[lightboxIndex].url
                      )}
                      title={items[lightboxIndex].title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-white/70">
                      Unable to load this video.
                    </div>
                  )}

                </div>

              </div>

            )}


            {/* Caption */}

            <div className="mt-4 text-center">

              <h3 className="text-xl font-bold text-white">
                {items[lightboxIndex].title}
              </h3>

              {type === "video" &&
                items[lightboxIndex]
                  .description && (
                  <p className="mt-1 text-sm text-white/60">
                    {
                      items[lightboxIndex]
                        .description
                    }
                  </p>
                )}

              <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-[#e8c979]">
                {lightboxIndex + 1} /{" "}
                {items.length}
              </p>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(
      "2026-10-16T00:00:00"
    );

    const updateCountdown = () => {
      const now = new Date();

      const difference =
        targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        return;
      }

      setTimeLeft({
        days: Math.floor(
          difference / (1000 * 60 * 60 * 24)
        ),
        hours: Math.floor(
          (difference / (1000 * 60 * 60)) % 24
        ),
        minutes: Math.floor(
          (difference / (1000 * 60)) % 60
        ),
        seconds: Math.floor(
          (difference / 1000) % 60
        ),
      });
    };

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, []);


  const countdownItems = [
    {
      label: "Days",
      value: timeLeft.days,
      icon: "fa-regular fa-calendar-days",
    },
    {
      label: "Hours",
      value: timeLeft.hours,
      icon: "fa-regular fa-clock",
    },
    {
      label: "Minutes",
      value: timeLeft.minutes,
      icon: "fa-solid fa-hourglass-half",
    },
    {
      label: "Seconds",
      value: timeLeft.seconds,
      icon: "fa-solid fa-bolt",
    },
  ];

  return (
    <main className="page-load min-h-screen overflow-hidden bg-[#f8f1e7] font-sans text-[#241b17]">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_center,_#fff9ee_0%,_#f8ead8_45%,_#ecd2ad_100%)]">

        {/* Background Decorations */}

        <div className="absolute left-[-180px] top-[120px] h-[420px] w-[420px] rounded-full border border-[#c89a3d]/20" />

        <div className="absolute right-[-200px] top-[80px] h-[500px] w-[500px] rounded-full border border-[#c89a3d]/20" />

        <div className="absolute left-[8%] top-[25%] text-[70px] text-[#a70e18]/10">
          ॐ
        </div>

        <div className="absolute right-[8%] top-[30%] text-[70px] text-[#a70e18]/10">
          ॐ
        </div>

        {/* Navbar */}

        <header className="page-load-navbar relative z-30 mx-auto max-w-7xl px-5 py-5 lg:px-8">

          <div className="flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            >

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#b8892d] bg-[#fff8ed] text-xl text-[#a70e18] shadow-sm">
                <i className="fa-solid fa-om" />
              </div>

              <div>
                <p className="text-lg font-bold tracking-[0.15em] text-[#8f1019]">
                  BUH
                </p>

                <p className="text-[9px] font-semibold tracking-[0.25em] text-[#8a6c45]">
                  DURGA PUJA
                </p>
              </div>

            </Link>

            {/* Desktop Navigation */}

            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">

              <a
                href="#about"
                className="transition hover:text-[#a70e18]"
              >
                About
              </a>

              <a
                href="#events"
                className="transition hover:text-[#a70e18]"
              >
                Events
              </a>

              <a
                href="#gallery"
                className="transition hover:text-[#a70e18]"
              >
                Gallery
              </a>

              <a
                href="#seva"
                className="transition hover:text-[#a70e18]"
              >
                Offer Seva
              </a>

              <a
                href="#cultural-program"
                className="transition hover:text-[#a70e18]"
              >
                Cultural Program Registration
              </a>

              <a
                href="#cultural-program"
                className="transition hover:text-[#a70e18]"
              >
                Inventory Help
              </a>

              <Link
                href="/contribute"
                className="rounded-full bg-[#a70e18] px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-[#7f0b13]"
              >
                Contribute
              </Link>

            </nav>

            {/* Mobile Menu */}

            <button
              type="button"
              aria-label="Open menu"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b8892d] bg-white/70 text-[#8f1019] md:hidden"
            >
              <i
                className={
                  mobileMenuOpen
                    ? "fa-solid fa-xmark"
                    : "fa-solid fa-bars"
                }
              />
            </button>

          </div>

          {mobileMenuOpen && (
            <div className="mt-4 rounded-3xl border border-[#e3d1b7] bg-white/95 p-5 shadow-xl backdrop-blur-md md:hidden">

              <div className="flex flex-col gap-2">

                <a
                  href="#about"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[#5d3f34] hover:bg-[#faf3e8]"
                >
                  <i className="fa-solid fa-circle-info mr-3 text-[#a70e18]" />
                  About
                </a>

                <a
                  href="#events"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[#5d3f34] hover:bg-[#faf3e8]"
                >
                  <i className="fa-solid fa-calendar-days mr-3 text-[#a70e18]" />
                  Events
                </a>

                <a
                  href="#gallery"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-[#5d3f34] hover:bg-[#faf3e8]"
                >
                  <i className="fa-solid fa-images mr-3 text-[#a70e18]" />
                  Gallery
                </a>

                <Link
                  href="/contribute"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="mt-2 rounded-full bg-[#a70e18] px-5 py-3 text-center text-sm font-bold text-white"
                >
                  <i className="fa-solid fa-heart mr-2" />
                  CONTRIBUTE
                </Link>

              </div>

            </div>
          )}

        </header>

        {/* Hero Content */}

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-85px)] max-w-7xl items-center justify-center px-5 pb-20 pt-8">

          <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_1fr_1fr]">

            {/* Left */}

            <div className="page-load-left hidden text-right lg:block">

              <p className="mb-5 text-xs font-bold tracking-[0.4em] text-[#9b7432]">
                TOGETHER WE CELEBRATE
              </p>

              <h2 className="text-4xl font-bold leading-tight text-[#641016]">
                Our Faith
                <br />
                Our Culture
                <br />
                Our Community
              </h2>

              <div className="ml-auto mt-7 h-px w-28 bg-[#b8892d]" />

              <p className="ml-auto mt-6 max-w-xs text-sm leading-7 text-[#735f50]">
                A celebration of devotion,
                tradition, music, dance and
                togetherness.
              </p>

              <div className="mt-8 flex justify-end gap-3 text-[#a70e18]">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9bb7b] bg-white/60">
                  <i className="fa-solid fa-hands-praying" />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9bb7b] bg-white/60">
                  <i className="fa-solid fa-spa" />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9bb7b] bg-white/60">
                  <i className="fa-solid fa-people-group" />
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9bb7b] bg-white/60">
                  <i className="fa-solid fa-music" />
                </div>

              </div>

            </div>

            {/* Maa Durga */}

            <div className="page-load-durga relative flex justify-center">

              <div className="absolute top-[5%] h-[330px] w-[330px] rounded-full bg-[radial-gradient(circle,_rgba(190,135,38,0.3),_transparent_68%)] sm:h-[480px] sm:w-[480px]" />

              <div className="absolute top-[10%] h-[300px] w-[300px] rounded-full border border-[#b8892d]/30 sm:h-[440px] sm:w-[440px]" />

              <div className="absolute top-[16%] h-[250px] w-[250px] rounded-full border border-dashed border-[#b8892d]/20 sm:h-[380px] sm:w-[380px]" />

              <img
                src={DURGA_IMAGE}
                alt="Maa Durga"
                className="relative z-10 h-[350px] w-[350px] object-contain object-center drop-shadow-2xl sm:h-[500px] sm:w-[500px]"
              />

            </div>

            {/* Right */}

            <div className="page-load-right text-center lg:text-left">

              <p className="text-xs font-bold tracking-[0.5em] text-[#9b7432]">
                BUH PRESENTS
              </p>

              <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-[#8f1019] sm:text-6xl lg:text-7xl">
                DURGA
                <br />
                PUJA
                <br />
                <span className="text-[#b8892d]">
                  2026
                </span>
              </h1>

              <div className="my-6 flex items-center justify-center gap-3 lg:justify-start">

                <div className="h-px w-12 bg-[#b8892d]" />

                <i className="fa-solid fa-spa text-[#b8892d]" />

                <div className="h-px w-12 bg-[#b8892d]" />

              </div>

              <p className="text-2xl font-semibold text-[#5f171d]">
                Let’s Come Together
              </p>

              <p className="mt-2 text-sm leading-6 text-[#735f50]">
                To Welcome Maa Durga to BUH
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">

                <span className="rounded-full border border-[#d7b66a] bg-white/50 px-3 py-1.5 text-[10px] font-semibold text-[#7d531f]">
                  <i className="fa-solid fa-hands-praying mr-1.5" />
                  DEVOTION
                </span>

                <span className="rounded-full border border-[#d7b66a] bg-white/50 px-3 py-1.5 text-[10px] font-semibold text-[#7d531f]">
                  <i className="fa-solid fa-people-group mr-1.5" />
                  COMMUNITY
                </span>

                <span className="rounded-full border border-[#d7b66a] bg-white/50 px-3 py-1.5 text-[10px] font-semibold text-[#7d531f]">
                  <i className="fa-solid fa-music mr-1.5" />
                  CELEBRATION
                </span>

              </div>

              <p className="mt-5 text-xs font-semibold tracking-[0.25em] text-[#8a6c45]">
                OCTOBER 16 – 20, 2026
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">

                <Link
                  href="/contribute"
                  className="rounded-full bg-[#a70e18] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
                >
                  <i className="fa-solid fa-heart mr-2" />
                  CONTRIBUTE TO PUJA
                </Link>
                {/* 
                <Link
                  href="/donate"
                  className="rounded-full border border-[#a70e18] bg-white/60 px-7 py-3.5 text-sm font-bold tracking-wide text-[#8f1019] transition hover:bg-white"
                >
                  <i className="fa-solid fa-hands-holding-circle mr-2" />
                  SUPPORT US
                </Link> */}

              </div>

            </div>

          </div>

        </div>

        {/* Scroll */}

        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-center">

          <p className="text-[9px] font-bold tracking-[0.4em] text-[#927044]">
            SCROLL TO EXPLORE
          </p>

          <i className="fa-solid fa-chevron-down mt-2 animate-bounce text-[#a70e18]" />

        </div>

      </section>

      {/* =====================================================
          ABOUT
      ====================================================== */}

      <Reveal animation="up">
        <section
          id="about"
          className="relative bg-[#fffaf2] px-5 py-24"
        >

          <div className="absolute left-0 top-0 text-[150px] leading-none text-[#a70e18]/[0.025]">
            ॐ
          </div>

          <div className="absolute bottom-0 right-0 text-[150px] leading-none text-[#b8892d]/[0.04]">
            ॐ
          </div>

          <div className="relative mx-auto max-w-5xl text-center">

            <p className="text-xs font-bold tracking-[0.35em] text-[#a77a2b]">
              WELCOME TO BUH DURGA PUJA
            </p>

            <h2 className="mt-4 text-4xl font-bold text-[#761019] sm:text-5xl">
              A Celebration That Brings Us Together
            </h2>

            <div className="mx-auto my-7 flex items-center justify-center gap-3">

              <div className="h-px w-20 bg-[#c49a45]" />

              <i className="fa-solid fa-spa text-[#b8892d]" />

              <div className="h-px w-20 bg-[#c49a45]" />

            </div>

            <p className="mx-auto max-w-3xl text-base leading-8 text-[#705d50]">
              Durga Puja at BUH is more than a celebration.
              It is a time when families, neighbours and
              friends come together to celebrate faith,
              culture and the spirit of our community.
            </p>

            <div className="mt-14 grid gap-6 md:grid-cols-3">

              {aboutItems.map((item) => (

                <div
                  key={item.title}
                  className="group rounded-3xl border border-[#e7d7c3] bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d7b66a] bg-[#fff8ec] text-2xl text-[#a70e18] shadow-sm transition group-hover:bg-[#a70e18] group-hover:text-white">

                    <i className={item.icon} />

                  </div>

                  <h3 className="mt-5 text-2xl font-bold text-[#761019]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#766457]">
                    {item.text}
                  </p>

                </div>

              ))}

            </div>

          </div>

        </section>
      </Reveal>

      {/* =====================================================
          COUNTDOWN
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#7d0c15] px-5 py-20 text-white">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(201,155,61,0.2),_transparent_60%)]" />

        <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full border border-[#e8c979]/10" />

        <div className="absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full border border-[#e8c979]/10" />

        <div className="relative mx-auto max-w-5xl text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e8c979]/40 bg-white/5">

            <i className="fa-solid fa-calendar-days text-xl text-[#e8c979]" />

          </div>

          <p className="mt-5 text-xs font-bold tracking-[0.4em] text-[#e8c979]">
            THE WAIT IS ALMOST OVER
          </p>

          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
            Maa Durga is Coming
          </h2>

          <p className="mt-3 text-sm text-[#f3dfbd]">
            October 16, 2026
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">

            {countdownItems.map((item) => (

              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:p-7"
              >

                <i
                  className={`${item.icon} mb-3 text-[#e8c979]`}
                />

                <p className="text-3xl font-bold sm:text-5xl">
                  {String(item.value).padStart(2, "0")}
                </p>

                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[#e8c979] sm:text-xs">
                  {item.label}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          EVENTS
      ====================================================== */}

      <section
        id="events"
        className="relative bg-[#f8f0e5] px-5 py-24"
      >

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fffaf2] text-xl text-[#a70e18]">

              <i className="fa-solid fa-calendar-days" />

            </div>

            <p className="text-xs font-bold tracking-[0.4em] text-[#a77a2b]">
              PUJA & CELEBRATIONS
            </p>

            <h2 className="mt-4 text-4xl font-bold text-[#761019] sm:text-5xl">
              Events & Celebrations
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#766457]">
              Five days of devotion, music, dance, culture
              and community celebration.
            </p>

          </div>

          <div className="relative mt-16">

            {/* Timeline */}

            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[#c7a66b]/40 md:block" />

            <div className="space-y-12">

              {events.map((event, index) => (

                <div
                  key={event.day}
                  className="relative grid gap-8 md:grid-cols-2 md:gap-14"
                >

                  <div
                    className={`rounded-[2rem] border border-[#e4d3bc] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      index % 2 === 1
                        ? "md:col-start-2"
                        : "md:col-start-1"
                    }`}
                  >

                    {/* Event Image */}

                    <div className="group relative mb-6 overflow-hidden rounded-2xl">

                      <img
                        src={event.image}
                        alt={event.day}
                        className="h-52 w-full object-cover object-top transition duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#3b090d]/75 via-transparent to-transparent" />

                      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-[#761019] shadow-lg">

                        <i className="fa-regular fa-calendar" />

                        {event.date}

                      </div>

                    </div>

                    {/* Event Heading */}

                    <div className="flex items-center gap-4">

                      <div
                        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${event.color} text-xl text-white shadow-lg`}
                      >

                        <div className="absolute inset-1 rounded-xl border border-white/20" />

                        <i className={`${event.icon} relative z-10`} />

                      </div>

                      <div>

                        <p className="text-2xl font-bold text-[#761019]">
                          {event.day}
                        </p>

                      </div>

                    </div>

                  {/* Day Schedule */}

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">

                    {/* Morning */}
                    <div className="rounded-2xl border border-[#eadbc6] bg-[#fffaf2] p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a70e18] shadow-sm">
                          <i className="fa-solid fa-sun" />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77a2b]">
                            Morning
                          </p>

                          <p className="mt-1 text-sm font-bold leading-6 text-[#392823]">
                            {event.schedule.morning}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* Afternoon */}
                    <div className="rounded-2xl border border-[#eadbc6] bg-[#fffaf2] p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a70e18] shadow-sm">
                          <i className="fa-solid fa-cloud-sun" />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77a2b]">
                            Afternoon
                          </p>

                          <p className="mt-1 text-sm font-bold leading-6 text-[#392823]">
                            {event.schedule.afternoon}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* Evening */}
                    <div className="rounded-2xl border border-[#eadbc6] bg-[#fffaf2] p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a70e18] shadow-sm">
                          <i className="fa-solid fa-music" />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77a2b]">
                            Evening
                          </p>

                          <p className="mt-1 text-sm font-bold leading-6 text-[#392823]">
                            {event.schedule.evening}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* Night */}
                    <div className="rounded-2xl border border-[#eadbc6] bg-[#fffaf2] p-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a70e18] shadow-sm">
                          <i className="fa-solid fa-moon" />
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a77a2b]">
                            Night
                          </p>

                          <p className="mt-1 text-sm font-bold leading-6 text-[#392823]">
                            {event.schedule.night}
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>

                  </div>

                  {/* Timeline Marker */}

                  <div className="absolute left-1/2 top-10 hidden -translate-x-1/2 md:block">

                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#f8f0e5] bg-[#a70e18] shadow-lg">

                      <div className="h-1.5 w-1.5 rounded-full bg-white" />

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          <div className="mt-14 flex items-center justify-center gap-3 text-center">

            <i className="fa-solid fa-circle-info text-[#a77a2b]" />

            <p className="text-xs text-[#8a7667]">
              Timings are subject to change. Please
              check the website for the latest updates.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          CELEBRATION HIGHLIGHT
      ====================================================== */}

      <section className="bg-[#fffaf2] px-5 py-24">

        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-[#8f1019] shadow-2xl lg:grid-cols-2">

          <div className="flex items-center p-10 sm:p-14">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e8c979]/40 text-[#e8c979]">

                  <i className="fa-solid fa-star" />

                </div>

                <p className="text-xs font-bold tracking-[0.35em] text-[#e8c979]">
                  CELEBRATE • PARTICIPATE • ENJOY
                </p>

              </div>

              <h2 className="mt-5 text-4xl font-bold text-white sm:text-5xl">
                Something Special
                <br />
                Every Evening
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-7 text-[#f2ddc0]">
                From traditional rituals and Pushpanjali
                to Dandiya nights and cultural performances,
                there is something for everyone at BUH Durga Puja.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center">

                  <i className="fa-solid fa-hands-praying text-2xl text-[#e8c979]" />

                  <p className="mt-2 text-xs font-semibold">
                    Puja
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center">

                  <i className="fa-solid fa-drum text-2xl text-[#e8c979]" />

                  <p className="mt-2 text-xs font-semibold">
                    Dandiya
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center">

                  <i className="fa-solid fa-masks-theater text-2xl text-[#e8c979]" />

                  <p className="mt-2 text-xs font-semibold">
                    Culture
                  </p>

                </div>

              </div>

            </div>

          </div>

          <div className="relative min-h-[420px] overflow-hidden">

            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=85"
              alt="Cultural celebration"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-[#6d0911]/45" />

            <div className="absolute inset-0 flex items-center justify-center">

              <div className="flex h-32 w-32 items-center justify-center rounded-full border border-[#e8c979]/60 bg-[#7d0c15]/60 backdrop-blur-sm">

                <i className="fa-solid fa-music text-5xl text-[#e8c979]" />

              </div>

            </div>

            <div className="absolute bottom-6 left-6 right-6">

              <div className="rounded-2xl border border-white/20 bg-black/25 p-5 backdrop-blur-md">

                <div className="flex items-center gap-2">

                  <i className="fa-solid fa-sparkles text-[#e8c979]" />

                  <p className="text-xs font-bold tracking-[0.3em] text-[#e8c979]">
                    CELEBRATION HIGHLIGHTS
                  </p>

                </div>

                <p className="mt-2 text-xl font-bold text-white">
                  Dance • Music • Culture • Togetherness
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          GALLERY
      ====================================================== */}

      <section
        id="gallery"
        className="bg-[#f8f0e5] px-5 py-24"
      >

        <div className="mx-auto max-w-6xl">

          {/* Heading */}

          <div className="text-center">

            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fffaf2] text-xl text-[#a70e18]">

              <i className="fa-solid fa-images" />

            </div>

            <p className="text-xs font-bold tracking-[0.4em] text-[#a77a2b]">
              MEMORIES
            </p>

            <h2 className="mt-4 text-4xl font-bold text-[#761019] sm:text-5xl">
              Moments of Joy
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#766457]">
              A glimpse of the memories we create together.
            </p>

          </div>


          {/* =================================================
              PHOTO GALLERY
          ================================================== */}

          <div className="mt-14">

            <div className="mb-6 flex items-end justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a70e18] text-white shadow-sm">

                    <i className="fa-solid fa-camera" />

                  </div>

                  <div>

                    <p className="text-xs font-bold tracking-[0.25em] text-[#a77a2b]">
                      PHOTO GALLERY
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-[#761019]">
                      Memories in Pictures
                    </h3>

                  </div>

                </div>

              </div>

            </div>


            <GallerySlider
              items={photoGallery}
              type="image"
            />

          </div>


          {/* =================================================
              VIDEO GALLERY
          ================================================== */}

          <div className="mt-20">

            <div className="mb-6 flex items-end justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a70e18] text-white shadow-sm">

                    <i className="fa-solid fa-video" />

                  </div>

                  <div>

                    <p className="text-xs font-bold tracking-[0.25em] text-[#a77a2b]">
                      VIDEO GALLERY
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-[#761019]">
                      Relive the Moments
                    </h3>

                  </div>

                </div>

              </div>

            </div>


            <GallerySlider
              items={videoGallery}
              type="video"
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          CONTRIBUTION
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#fffaf2] px-5 py-24">

        <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-[#b8892d]/10 blur-3xl" />

        <div className="absolute bottom-[-120px] right-[-80px] h-72 w-72 rounded-full bg-[#a70e18]/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d7b66a] bg-[#fff8ec] text-2xl text-[#a70e18] shadow-sm">

            <i className="fa-solid fa-heart" />

          </div>

          <p className="mt-6 text-xs font-bold tracking-[0.35em] text-[#a77a2b]">
            EVERY CONTRIBUTION MATTERS
          </p>

          <h2 className="mt-4 text-4xl font-bold text-[#761019] sm:text-5xl">
            Make Our Celebration Grand
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#766457]">
            Whether big or small, every contribution becomes
            a part of our collective celebration and helps us
            create a memorable Durga Puja for the entire BUH community.
          </p>

          <div className="mt-9">

            <Link
              href="/contribute"
              className="inline-flex items-center rounded-full bg-[#a70e18] px-8 py-4 text-sm font-bold tracking-wide text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
            >
              <i className="fa-solid fa-heart mr-3" />
              CONTRIBUTE TO PUJA
              <i className="fa-solid fa-arrow-right ml-3" />
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          EXTERNAL SUPPORT
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#7d0c15] px-5 py-24 text-white">

        <div className="absolute right-[-150px] top-[-100px] h-96 w-96 rounded-full border border-[#e8c979]/10" />

        <div className="absolute bottom-[-150px] left-[-100px] h-80 w-80 rounded-full border border-[#e8c979]/10" />

        <div className="mx-auto max-w-6xl">

          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8c979]/40">

                  <i className="fa-solid fa-handshake text-[#e8c979]" />

                </div>

                <p className="text-xs font-bold tracking-[0.35em] text-[#e8c979]">
                  JOIN THE CELEBRATION
                </p>

              </div>

              <h2 className="mt-5 text-4xl font-bold sm:text-5xl">
                Be a Part of Our Celebration
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#f1ddc1]">
                Shops, builders, brands, companies, vendors
                and individuals can support BUH Durga Puja
                and become a part of this community celebration.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">

                {supportTypes.map((item) => (

                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
                  >

                    <i
                      className={`${item.icon} text-lg text-[#e8c979]`}
                    />

                    <p className="mt-2 text-xs font-semibold">
                      {item.title}
                    </p>

                  </div>

                ))}

              </div>

            </div>

            <div className="text-left lg:text-right">

              <div className="mb-7 inline-flex h-24 w-24 items-center justify-center rounded-full border border-[#e8c979]/30 bg-white/5">

                <i className="fa-solid fa-hands-holding-circle text-4xl text-[#e8c979]" />

              </div>

              <div>

                <Link
                  href="/contribute"
                  className="inline-flex items-center rounded-full bg-[#e2bd62] px-8 py-4 text-sm font-bold text-[#571016] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#f0cf7c]"
                >
                  <i className="fa-solid fa-heart mr-3" />
                  CONTRIBUTE
                  <i className="fa-solid fa-arrow-right ml-3" />
                </Link>

              </div>

              <p className="mt-4 text-xs text-[#e8d4b8]">
                Every contribution helps make our celebration special.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          COMMUNITY MESSAGE
      ====================================================== */}

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_center,_#fffaf0,_#ecd7b7)] px-5 py-28 text-center">

        <div className="absolute left-[8%] top-12 hidden text-7xl text-[#a70e18]/10 md:block">
          <i className="fa-solid fa-spa" />
        </div>

        <div className="absolute right-[8%] bottom-12 hidden text-7xl text-[#a70e18]/10 md:block">
          <i className="fa-solid fa-spa" />
        </div>

        <div className="relative mx-auto max-w-4xl">

          <i className="fa-solid fa-quote-left text-4xl text-[#b8892d]/50" />

          <h2 className="mt-6 text-4xl font-bold leading-tight text-[#761019] sm:text-5xl">
            When a community comes together,
            <br className="hidden sm:block" />
            every celebration becomes special.
          </h2>

          <div className="mx-auto mt-8 flex items-center justify-center gap-3">

            <div className="h-px w-16 bg-[#b8892d]" />

            <i className="fa-solid fa-spa text-[#a70e18]" />

            <div className="h-px w-16 bg-[#b8892d]" />

          </div>

          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-[#8a6c45]">
            BUH DURGA PUJA COMMITTEE
          </p>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="bg-[#241b17] px-5 py-12 text-[#eadbc4]">

        <div className="mx-auto max-w-6xl">

          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">

            <div className="text-center md:text-left">

              <div className="flex items-center justify-center gap-3 md:justify-start">

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e5c16b]/40 text-[#e5c16b]">

                  <i className="fa-solid fa-om" />

                </div>

                <div>

                  <p className="text-xl font-bold text-[#e5c16b]">
                    DURGA PUJA 2026
                  </p>

                  <p className="mt-1 text-[9px] tracking-[0.25em] text-[#a9957c]">
                    BUH COMMUNITY
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium">

              <a
                href="#about"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-circle-info mr-1.5" />
                About
              </a>

              <a
                href="#events"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-calendar-days mr-1.5" />
                Events
              </a>

              <a
                href="#gallery"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-images mr-1.5" />
                Gallery
              </a>

              <Link
                href="/contribute"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-heart mr-1.5" />
                Contribute
              </Link>

              <Link
                href="/contribute"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-hand-holding-heart mr-1.5" />
                Contribute
              </Link>

            </div>

          </div>

          <div className="my-9 h-px bg-[#e5c16b]/20" />

          <div className="text-center">

            <div className="flex items-center justify-center gap-3 text-[#e5c16b]">

              <i className="fa-solid fa-spa" />

              <div className="h-px w-12 bg-[#e5c16b]/30" />

              <i className="fa-solid fa-om text-xl" />

              <div className="h-px w-12 bg-[#e5c16b]/30" />

              <i className="fa-solid fa-spa" />

            </div>

            <p className="mt-6 text-xl font-bold tracking-[0.25em] text-[#e5c16b]">
              JAI MAA DURGA
            </p>

            <p className="mt-3 text-[10px] tracking-[0.25em] text-[#9c8b76]">
              A STRONGER COMMUNITY TOGETHER
            </p>

            <div className="mt-7 flex justify-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5c16b]/20 text-[#e5c16b]">
                <i className="fa-solid fa-heart" />
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5c16b]/20 text-[#e5c16b]">
                <i className="fa-solid fa-people-group" />
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5c16b]/20 text-[#e5c16b]">
                <i className="fa-solid fa-spa" />
              </div>

            </div>

            <p className="mt-8 text-[10px] text-[#756658]">
              © 2026 BUH Durga Puja Committee.
              All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}