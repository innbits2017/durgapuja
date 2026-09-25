"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const DURGA_IMAGE = "/images/durga-puja-collection.webp";

const events = [
  {
    day: "KALASH PUJA",
    shortDay: "Day 1 to Day 5",
    date: "11th to 15th OCTOBER 2026",
    image: "/images/kalash-puja.webp",
    icon: "fa-solid fa-hands-praying",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "Morning Puja",
      afternoon: "-",
      evening: "Evening Puja",
      night: "-",
    },
  },
  {
    day: "MAHA SHASHTI",
    shortDay: "Shashthi",
    date: "16 OCTOBER 2026",
    image: "/images/Maha-Shashti.webp",
    icon: "fa-solid fa-hands-praying",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "Puja Preparation",
      afternoon: "Maa Durga Welcome & Shashthi Puja",
      evening: "Carnival (Food Stall + Flea Market + Games)",
      night: "Dinner",
    },
  },
  {
    day: "MAHA SAPTAMI",
    shortDay: "Saptami",
    date: "17 OCTOBER 2026",
    image: "/images/maha-saptami.webp",
    icon: "fa-solid fa-fire-flame-curved",
    color: "bg-[#a70e18]",
    schedule: {
      morning: "Breakfast + Saptami Puja & Pushpanjali",
      afternoon: "Kids Drawing & Painting",
      evening: "Dandia Night",
      night: "Dinner",
    },
  },
  {
    day: "MAHA ASHTAMI",
    shortDay: "Ashtami",
    date: "18 OCTOBER 2026",
    image: "/images/maha-ashtami.webp",
    icon: "fa-solid fa-om",
    color: "bg-[#8f1019]",
    schedule: {
      morning: "Breakfast + Maha Ashtami Puja & Pushpanjali",
      afternoon: "Tambola",
      evening: "Cultural Programme",
      night: "Dinner",
    },
  },
  {
    day: "MAHA NAVAMI",
    shortDay: "Navami",
    date: "19 OCTOBER 2026",
    image: "/images/maha-navami.webp",
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
    image: "/images/buh-vijayadashami.webp",
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
    src: "/images/gallery/durgapuga10.webp",
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

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    let videoId = "";

    if (parsedUrl.hostname.includes("youtu.be")) {
      videoId = parsedUrl.pathname.replace("/", "").split("/")[0];
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v") || "";

      if (!videoId && parsedUrl.pathname.startsWith("/shorts/")) {
        videoId = parsedUrl.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }

      if (!videoId && parsedUrl.pathname.startsWith("/embed/")) {
        videoId = parsedUrl.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : "";
  } catch {
    return "";
  }
};

const videoGallery = [
  {
    thumbnail: "/images/durga-puja-2025.webp",
    title: "BUH Durga Puja 2025",
    description: "Moments from our Durga Puja celebrations",
    url: "https://youtu.be/Lky6t5c3lFQ?si=5WzFgXPe23A3k_Sv",
  },
  {
    thumbnail: "/images/gallery/durga-puja-dandia.webp",
    title: "Visarjan 2025",
    description: "A celebration of talent and culture",
    url: "https://youtube.com/shorts/nNjzyhhkPkE",
  },
  {
    thumbnail: "/images/durgapuja25.webp",
    title: "Visarjan 2025",
    description: "A celebration of talent and culture",
    url: "https://youtube.com/shorts/0m4UV7WoBP0?feature=share",
  },
    {
    thumbnail: "/images/visarjan-1.webp",
    title: "Visarjan 2025",
    description: "Devotion, music and togetherness",
    url: "https://youtube.com/shorts/3yRCgSsqW1Q?feature=share",
  },
  {
    thumbnail: "/images/durgapuja25.webp",
    title: "Visarjan 2025",
    description: "A celebration of talent and culture",
    url: "https://youtube.com/shorts/FEve9AbtJXc",
  }
];

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

const participationItems = [
  { title: "Offer Seva", description: "Choose a seva and be part of the Puja with devotion.", icon: "fa-solid fa-hands-praying", href: "/seva" },
  { title: "Join Cultural Program", description: "Share your talent and make the celebrations memorable.", icon: "fa-solid fa-masks-theater", href: "/cultural-program" },
  { title: "Offer Inventory Help", description: "Help the committee with items needed during the celebrations.", icon: "fa-solid fa-box-open", href: "/inventory-help" },
  { title: "Book a Stall", description: "Bring your food, product or brand to the community carnival.", icon: "fa-solid fa-store", href: "/book-stall" },
  { title: "Volunteer", description: "Lend your time and help us make the Puja run smoothly.", icon: "fa-solid fa-people-group", href: "/seva" },
  { title: "Make a Donation", description: "Support the celebration and help us create something special together.", icon: "fa-solid fa-heart", href: "/donate" },
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
                      title={
                        items[lightboxIndex]
                          .title
                      }
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-sm text-white/70">
                        <i className="fa-solid fa-circle-exclamation mb-2 text-2xl" />
                        <p>Video unavailable</p>
                      </div>
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
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [showContributionNotice, setShowContributionNotice] =
    useState(false);

  useEffect(() => {
    const targetDate = new Date(
      "2026-10-11T00:00:00"
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

        <Navbar />

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

              <p className="mt-5 text-xs font-semibold tracking-[0.25em] text-[#8a6c45]">
                OCTOBER 11 – 20, 2026
              </p>

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

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:justify-start">

                {/* <Link
                  href="/contribute"
                  className="rounded-full bg-[#a70e18] px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
                >
                  <i className="fa-solid fa-heart mr-2" />
                  CONTRIBUTE TO PUJA
                </Link> */}
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
            October 11, 2026
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
        className="relative overflow-hidden bg-[#f8f0e5] px-5 py-16 sm:py-20"
      >
        <div className="pointer-events-none absolute left-[-100px] top-20 h-72 w-72 rounded-full border border-[#c7a66b]/10" />
        <div className="pointer-events-none absolute bottom-20 right-[-120px] h-80 w-80 rounded-full border border-[#c7a66b]/10" />

        <div className="relative mx-auto max-w-6xl">
          {/* Section heading */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#d7b66a] bg-[#fffaf2] text-lg text-[#a70e18] shadow-sm">
              <i className="fa-solid fa-calendar-days" />
            </div>

            <p className="text-[10px] font-bold tracking-[0.35em] text-[#a77a2b]">
              PUJA & CELEBRATIONS
            </p>

            <h2 className="mt-3 text-4xl font-bold text-[#761019] sm:text-5xl">
              Events & Celebrations
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#766457]">
              Five days of devotion, music, dance, culture and community celebration.
            </p>
          </div>

          {/* Events timeline */}
          <div className="relative mt-12 sm:mt-14">
            {/* One continuous centre line */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-[#d7b66a]/55 md:block" />

            <div className="space-y-14 sm:space-y-16">
              {events.map((event, index) => {
                const imageOnLeft = index % 2 === 0;

                return (
                  <article
                    key={event.day}
                    className="relative grid items-center md:grid-cols-[minmax(0,1fr)_70px_minmax(0,1fr)] md:gap-x-8 lg:gap-x-10"
                  >
                    {/* Centre dot */}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-[5px] border-[#f8f0e5] bg-[#a70e18] shadow-[0_3px_12px_rgba(80,20,20,0.18)]">
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      </div>
                    </div>

                    {/* IMAGE */}
                    <div
                      className={
                        imageOnLeft
                          ? "md:col-start-1 md:row-start-1"
                          : "md:col-start-3 md:row-start-1"
                      }
                    >
                      <div className="overflow-hidden rounded-[1.35rem] border border-[#e4d3bc] bg-white shadow-sm">
                        <div className="relative aspect-[16/8] overflow-hidden">
                          <img
                            src={event.image}
                            alt={event.day}
                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-[#3b090d]/85 via-[#3b090d]/10 to-transparent" />

                          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5">
                            <div>
                              <p className="text-[9px] font-bold tracking-[0.2em] text-[#f0d27d]">
                                {event.date}
                              </p>

                              <p className="mt-1 text-xl font-bold text-white sm:text-2xl">
                                {event.day}
                              </p>
                            </div>

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.color} text-white shadow-lg`}
                            >
                              <i className={`${event.icon} text-sm`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div
                      className={
                        imageOnLeft
                          ? "md:col-start-3 md:row-start-1"
                          : "md:col-start-1 md:row-start-1"
                      }
                    >
                      <div className="rounded-[1.35rem] border border-[#e4d3bc] bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#a77a2b]">
                              {event.shortDay}
                            </p>

                            <h3 className="mt-1 text-xl font-bold text-[#761019] sm:text-2xl">
                              {event.day}
                            </h3>
                          </div>

                          <p className="shrink-0 text-[10px] font-semibold text-[#8a7667] sm:text-xs">
                            {event.date}
                          </p>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[#eadbc6] bg-[#fffaf2]">
                          {[
                            {
                              icon: "fa-sun",
                              label: "Morning",
                              value: event.schedule.morning,
                            },
                            {
                              icon: "fa-cloud-sun",
                              label: "Afternoon",
                              value: event.schedule.afternoon,
                            },
                            {
                              icon: "fa-music",
                              label: "Evening",
                              value: event.schedule.evening,
                            },
                            {
                              icon: "fa-moon",
                              label: "Night",
                              value: event.schedule.night,
                            },
                          ].map((slot, slotIndex) => (
                            <div
                              key={slot.label}
                              className={`grid grid-cols-[88px_1fr] gap-2 px-3 py-3 sm:grid-cols-[100px_1fr] sm:px-4 sm:py-3.5 ${
                                slotIndex !== 3
                                  ? "border-b border-[#eadbc6]"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.11em] text-[#a77a2b] sm:text-[10px]">
                                <i
                                  className={`fa-solid ${slot.icon} text-[#a70e18]`}
                                />
                                <span>{slot.label}</span>
                              </div>

                              <p className="text-xs font-semibold leading-5 text-[#392823] sm:text-sm">
                                {slot.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mobile connector between events */}
                    {index < events.length - 1 && (
                      <div className="col-span-full mx-auto mt-8 flex flex-col items-center md:hidden">
                        <div className="h-6 w-px bg-[#d7b66a]/55" />
                        <div className="h-2.5 w-2.5 rounded-full bg-[#a70e18] ring-4 ring-[#f8f0e5]" />
                        <div className="h-6 w-px bg-[#d7b66a]/55" />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-center">
            <i className="fa-solid fa-circle-info text-[11px] text-[#a77a2b]" />
            <p className="text-[10px] text-[#8a7667]">
              Timings are subject to change. Please check the website for the latest updates.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PARTICIPATE
      ====================================================== */}
      <section id="participate" className="relative overflow-hidden bg-[#fffaf2] px-5 py-24">
        <div className="pointer-events-none absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-[#b8892d]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-120px] right-[-100px] h-80 w-80 rounded-full bg-[#a70e18]/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7b66a] bg-[#fff8ec] text-xl text-[#a70e18] shadow-sm"><i className="fa-solid fa-people-group" /></div>
            <p className="text-xs font-bold tracking-[0.4em] text-[#a77a2b]">BE PART OF THE CELEBRATION</p>
            <h2 className="mt-4 text-4xl font-bold text-[#761019] sm:text-5xl">Participate With Us</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#766457]">Durga Puja becomes special when everyone brings something to it. Choose how you would like to participate and be part of our community celebration.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {participationItems.map((item) => {
              const isDonation = item.title === "Make a Donation";

              const cardContent = (
                <>
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[#a70e18]/5 transition group-hover:scale-125" />

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d7b66a] bg-[#fff8ec] text-lg text-[#a70e18] transition group-hover:bg-[#a70e18] group-hover:text-white">
                      <i className={item.icon} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-[#761019]">
                          {item.title}
                        </h3>

                        <i
                          className={`fa-solid ${
                            isDonation
                              ? "fa-heart"
                              : "fa-arrow-up-right-from-square"
                          } text-xs text-[#b8892d] opacity-0 transition group-hover:opacity-100`}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-6 text-[#766457]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#a70e18]">
                    {isDonation ? "CONTRIBUTE" : "PARTICIPATE"}
                    <i className="fa-solid fa-arrow-right transition group-hover:translate-x-1" />
                  </div>
                </>
              );

              return isDonation ? (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setShowContributionNotice(true)}
                  className="group relative w-full overflow-hidden rounded-3xl border border-[#e5d7c4] bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d7b66a] hover:shadow-xl"
                >
                  {cardContent}
                </button>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group relative overflow-hidden rounded-3xl border border-[#e5d7c4] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d7b66a] hover:shadow-xl"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          PLAY & DISCOVER
      ====================================================== */}
      <section className="bg-[#f8f0e5] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#7d0c15] shadow-2xl">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#e8c979]/15" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-[#e8c979]/10" />
            <div className="relative grid items-center gap-8 px-7 py-10 sm:px-12 sm:py-12 lg:grid-cols-[1fr_auto] lg:px-16">
              <div>
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8c979]/40 bg-white/5 text-[#e8c979]"><i className="fa-solid fa-gamepad" /></div><p className="text-xs font-bold tracking-[0.35em] text-[#e8c979]">PLAY & DISCOVER</p></div>
                <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">How well do you know Durga Puja?</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#f1ddc1]">Take our quick Durga Puja Quiz and test your knowledge of traditions, rituals and celebrations.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#f5e2c2]">5 QUESTIONS</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#f5e2c2]">2 MINUTES</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-[#f5e2c2]">INSTANT SCORE</span>
                </div>
              </div>
              <div className="lg:pl-8"><Link href="/games" className="inline-flex w-full items-center justify-center rounded-full bg-[#e2bd62] px-7 py-4 text-sm font-bold tracking-wide text-[#571016] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#f0cf7c] sm:w-auto">PLAY GAMES <i className="fa-solid fa-arrow-right ml-3" /></Link></div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          GALLERY
      ====================================================== */}

      <section
        id="gallery"
        className="bg-[#f8f0e5] px-5 py-5"
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
              Memories We Create Together
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

        <div className="absolute left-[8%] top-12 hidden text-7xl text-[#a70e18]/10 md:block">
          <i className="fa-solid fa-spa" />
        </div>

        <div className="absolute right-[8%] bottom-12 hidden text-7xl text-[#a70e18]/10 md:block">
          <i className="fa-solid fa-spa" />
        </div>

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

            

            <button
              type="button"
              onClick={() => setShowContributionNotice(true)}
              className="inline-flex items-center rounded-full bg-[#a70e18] px-8 py-4 text-sm font-bold tracking-wide text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#7d0b13]"
            >
              <i className="fa-solid fa-heart mr-3" />
              CONTRIBUTE TO PUJA
              <i className="fa-solid fa-arrow-right ml-3" />
            </button>

          </div>

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
                href="/seva"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-hand-holding-heart mr-1.5" />
                Offer Seva
              </Link>

              <Link
                href="/cultural-program"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-heart mr-1.5" />
                Inventory Help
              </Link>

                            <Link
                href="/cultural-program"
                className="transition hover:text-[#e5c16b]"
              >
                <i className="fa-solid fa-heart mr-1.5" />
                Cultural Program
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

            <p className="mt-2 text-[10px] text-[#756658]">
              Made with <i className="fa-solid fa-heart" /> by <a href="https://innbits.com">Innbits</a>
            </p>

          </div>

        </div>

      </footer>


      {/* =====================================================
          CONTRIBUTION NOTICE MODAL
      ====================================================== */}

      {showContributionNotice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setShowContributionNotice(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#e5cfaa] bg-[#fffaf2] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#fff4df] via-[#fffaf2] to-[#f8e8d2] px-6 pb-5 pt-7 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#a70e18] text-2xl text-white shadow-lg">
                <i className="fa-solid fa-heart" />
              </div>

              <h2 className="text-xl font-bold text-[#7f0b13]">
                Contribution Collection Will Open Soon
              </h2>
            </div>

            <div className="px-6 pb-6 pt-5 text-center">

              <p className="text-sm leading-6 text-[#6b5044]">
                Resident contribution collection will begin shortly. Your support means a lot to us.
              </p>

              <p className="mt-4 text-sm font-semibold text-[#7f0b13]">
                🙏 Thank you for your support and cooperation.
              </p>

              <button
                type="button"
                onClick={() => setShowContributionNotice(false)}
                className="mt-6 w-full rounded-full bg-[#a70e18] px-5 py-3 font-semibold text-white shadow-md transition hover:bg-[#7f0b13]"
              >
                Okay, Thank You
              </button>
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowContributionNotice(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#7f0b13] shadow-sm transition hover:bg-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}