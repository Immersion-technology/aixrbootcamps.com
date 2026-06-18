"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";

export interface ChromaItem {
  /** Optional photo. When absent the card renders a gradient + initials portrait. */
  image?: string | null;
  title: string;
  /** Short description paragraph shown under the name. */
  subtitle: string;
  /** Small footer meta on the left (e.g. "3 classes"). */
  meta?: string;
  /** Footer action label on the right (e.g. "View classes"). */
  actionLabel?: string;
  location?: string;
  /** Initials shown on the gradient fallback when there is no photo. */
  initials?: string;
  borderColor?: string;
  gradient?: string;
  /** Internal path (e.g. "/teachers/123") routes via Next; full URLs open a new tab. */
  url?: string;
}

export interface ChromaGridProps {
  items?: ChromaItem[];
  className?: string;
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

type SetterFn = (v: number | string) => void;

const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = "",
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = "power3.out",
}) => {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const setX = useRef<SetterFn | null>(null);
  const setY = useRef<SetterFn | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  const data = items ?? [];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, "--x", "px") as SetterFn;
    setY.current = gsap.quickSetter(el, "--y", "px") as SetterFn;
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x: number, y: number) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true,
    });
  };

  const handleMove = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  };

  const handleCardClick = (url?: string) => {
    if (!url) return;
    if (url.startsWith("/")) {
      router.push(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleCardMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const c = e.currentTarget as HTMLElement;
    const rect = c.getBoundingClientRect();
    c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative w-full h-full flex flex-wrap justify-center items-start gap-3 ${className}`}
      style={
        {
          "--r": `${radius}px`,
          "--x": "50%",
          "--y": "50%",
        } as React.CSSProperties
      }
    >
      {data.map((c, i) => (
        <article
          key={i}
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          className="group relative flex flex-col w-[300px] max-w-full rounded-[20px] overflow-hidden border border-black/[.06] bg-white shadow-[0_18px_40px_-24px_rgba(15,15,15,.22)] transition duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(15,15,15,.3)]"
          style={
            {
              "--card-border": c.borderColor || "#3a86ff",
              "--spotlight-color": `${c.borderColor || "#3a86ff"}24`,
            } as React.CSSProperties
          }
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 z-30 h-1"
            style={{ background: "var(--card-border)" }}
          />
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-20 opacity-0 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)",
            }}
          />
          <div className="relative z-10 p-[10px] box-border">
            {c.image ? (
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="w-full h-[200px] object-cover rounded-[14px]"
              />
            ) : (
              <div
                className="grid h-[200px] w-full place-items-center rounded-[14px]"
                style={{ background: c.gradient || "var(--card-border)" }}
              >
                <span className="font-bubble text-[clamp(38px,5vw,58px)] leading-none text-white drop-shadow-[0_2px_14px_rgba(0,0,0,.4)]">
                  {c.initials || c.title.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="relative z-10 flex flex-col gap-2 px-4 pb-4 pt-2 font-sans">
            <h3 className="m-0 font-bubble text-[1.45rem] leading-[1.05] tracking-tight text-[#0B1220] line-clamp-2 min-h-[2.1em]">
              {c.title}
            </h3>
            <p className="m-0 text-[0.82rem] leading-snug text-neutral-600 line-clamp-3 min-h-[4em]">
              {c.subtitle}
            </p>
            <footer className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-[0.8rem] font-medium text-neutral-500">{c.meta}</span>
              {c.actionLabel && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold text-white shadow-sm transition group-hover:brightness-110"
                  style={{ background: "var(--card-border)" }}
                >
                  {c.actionLabel}
                  <span aria-hidden className="text-[1rem] leading-none">
                    {"->"}
                  </span>
                </span>
              )}
            </footer>
          </div>
        </article>
      ))}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          backdropFilter: "grayscale(1)",
          WebkitBackdropFilter: "grayscale(1)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
        }}
      />
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms] z-40"
        style={{
          backdropFilter: "grayscale(1)",
          WebkitBackdropFilter: "grayscale(1)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          opacity: 1,
        }}
      />
    </div>
  );
};

export default ChromaGrid;
