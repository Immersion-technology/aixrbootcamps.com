"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { whatsappUrl } from "@/lib/contact";
import { trackMeta } from "@/lib/meta-pixel";

/**
 * Floating WhatsApp button.
 *
 * WhatsApp is where this business actually closes: parents ask about drop-off,
 * payment plans and age fit in chat, not through a contact form. This puts that
 * channel one thumb-tap away from every public page.
 *
 * Mounted once from app/(public)/layout.tsx.
 */

/** Reveal distance on the landing page, in px. Roughly one phone screen. */
const SCROLL_REVEAL_PX = 400;

/**
 * The opening line, tailored to where the parent is standing.
 *
 * This is lead attribution for free — the first line of the chat tells you
 * whether they came from the register flow or a course page, with no tracking,
 * no cookies and nothing to maintain.
 */
function greetingFor(pathname: string): string {
  if (pathname.startsWith("/register")) {
    return "Hi! I'm registering for the AIXR bootcamp and I have a question.";
  }
  if (pathname.startsWith("/courses")) {
    return "Hi! I'd like to know more about the AIXR bootcamp courses.";
  }
  if (pathname.startsWith("/gallery") || pathname.startsWith("/teachers")) {
    return "Hi! I've been looking at the AIXR bootcamp and I have a question.";
  }
  return "Hi! I'd like to ask about the AIXR summer bootcamp.";
}

export default function WhatsAppFab() {
  const pathname = usePathname();

  // On the landing page the hero carries its own CTAs, so a button floating over
  // it competes with them on a small screen. Everywhere else there is no such
  // conflict and hiding the fastest contact route would just cost leads.
  const gateOnScroll = pathname === "/";
  const [visible, setVisible] = useState(!gateOnScroll);

  // /register carries its own mobile action bar (fixed bottom-0 inset-x-0 z-40,
  // hidden from lg up). Sitting at the default offset the button lands right on
  // top of the Back / step controls, so it is lifted clear of the bar below lg
  // and drops back to the normal position once the bar is gone.
  const clearsStickyBar = pathname === "/register";

  useEffect(() => {
    if (!gateOnScroll) {
      setVisible(true);
      return;
    }

    let frame = 0;
    const read = () => {
      frame = 0;
      setVisible(window.scrollY > SCROLL_REVEAL_PX);
    };
    const onScroll = () => {
      // rAF-throttled: scroll fires far more often than we need to flip a boolean.
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };

    read(); // account for a restored scroll position on back-navigation
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [gateOnScroll]);

  return (
    <a
      href={whatsappUrl(greetingFor(pathname))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      onClick={() => trackMeta("Contact", { content_name: pathname })}
      className={[
        // z-50 clears the register page's z-40 action bar, while still sitting
        // BELOW the lightbox at z-[100] so it can never float over an open video.
        "fixed right-4 sm:right-5 z-50 group",
        clearsStickyBar
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]",
        "inline-flex items-center gap-2.5 h-14 pl-[15px] pr-[15px] sm:pr-5",
        "rounded-full bg-[#25D366] text-white",
        "shadow-[0_10px_30px_-8px_rgba(37,211,102,.65)]",
        "ring-1 ring-black/[.06]",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        "hover:brightness-105 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/45",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none",
      ].join(" ")}
    >
      <WhatsAppIcon size={26} className="shrink-0" />
      {/* Hidden on mobile, where a full pill would crowd the thumb zone. */}
      <span className="hidden sm:inline font-bubble text-[15px] leading-none pt-[2px] whitespace-nowrap">
        Chat with us
      </span>
    </a>
  );
}
