/**
 * The WhatsApp glyph, in one place.
 *
 * Three surfaces draw it — the footer social row, the footer contact line and
 * the floating action button — and an SVG path duplicated three times is a path
 * that eventually disagrees with itself. `WHATSAPP_GLYPH_PATH` is exported
 * separately for callers that render their own <svg> wrapper.
 */

export const WHATSAPP_GLYPH_PATH =
  "M20.52 3.48A11.79 11.79 0 0012.05 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.67a11.84 11.84 0 005.64 1.44h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.14-3.38-8.44zM12.05 21.6h-.01a9.74 9.74 0 01-4.97-1.36l-.36-.21-3.79.99 1.01-3.69-.23-.38a9.75 9.75 0 01-1.51-5.2c0-5.39 4.39-9.78 9.79-9.78a9.74 9.74 0 016.92 2.87 9.71 9.71 0 012.87 6.91c0 5.4-4.39 9.85-9.72 9.85zm5.36-7.34c-.29-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.29-.76.96-.93 1.16-.17.2-.34.22-.63.07-.29-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5l-.56-.01a1.08 1.08 0 00-.78.37c-.27.29-1.03 1.01-1.03 2.46s1.05 2.85 1.2 3.05c.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.98-1.4.25-.69.25-1.27.17-1.4-.07-.12-.27-.2-.56-.34z";

/** Decorative by default — the surrounding link carries the accessible name. */
export default function WhatsAppIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d={WHATSAPP_GLYPH_PATH} />
    </svg>
  );
}
