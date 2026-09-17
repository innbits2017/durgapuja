"use client";

import { useEffect, useRef, useState } from "react";

type PieSlice = {
  value: number;
  color: string;
};

type AnimatedPieChartProps = {
  slices: PieSlice[];
  size?: number;
  strokeWidth?: number;
  center: React.ReactNode;
  ariaLabel: string;
};

export default function AnimatedPieChart({
  slices,
  size = 144,
  strokeWidth = 28,
  center,
  ariaLabel,
}: AnimatedPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = chartRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;

  return (
    <div
      ref={chartRef}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-90"
        role="img"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={50 - strokeWidth / 2}
          fill="none"
          stroke="#ead9c7"
          strokeWidth={strokeWidth}
        />

        {slices.map((slice, index) => {
          const percentage =
            total > 0 ? (slice.value / total) * 100 : 0;

          const currentOffset = offset;

          offset += percentage;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={50 - strokeWidth / 2}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              pathLength="100"
              strokeDasharray={`${isVisible ? percentage : 0} 100`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="butt"
              style={{
                transition: `stroke-dasharray ${
                  900 + index * 180
                }ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            />
          );
        })}
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full">
        <div className="flex h-[calc(100%-44px)] w-[calc(100%-44px)] items-center justify-center rounded-full bg-white text-center">
          {center}
        </div>
      </div>
    </div>
  );
}