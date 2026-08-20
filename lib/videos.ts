/**
 * Single source of truth for the YouTube video gallery.
 *
 * Deliberately a hand-maintained manifest rather than a YouTube Data API call:
 * the channel is small and curated, an API key would be one more secret to
 * provision and rotate, and the quota/outage failure mode of a live fetch is a
 * blank section on the highest-traffic part of the site. Adding a video is a
 * two-line edit here.
 *
 * To add one: open the video on YouTube, take the ID out of the URL, and append
 * an entry below.
 *   https://youtube.com/shorts/xTcZXIDtKeQ  → id: "xTcZXIDtKeQ"
 *   https://youtu.be/xTcZXIDtKeQ            → id: "xTcZXIDtKeQ"
 *   https://youtube.com/watch?v=xTcZXIDtKeQ → id: "xTcZXIDtKeQ"
 */

export type VideoCategory = "highlights" | "demo-day" | "classroom" | "robotics";

export interface VideoItem {
  /** The 11-character YouTube ID — NOT the full URL. */
  id: string;
  /**
   * Title. REQUIRED, not optional — it is the card label, the iframe's
   * accessible name and the play button's aria-label all at once. An optional
   * title is a title nobody writes, and video is exactly where a screen-reader
   * user has nothing else to go on.
   */
  title: string;
  category: VideoCategory;
  /**
   * Shape of the source video. Shorts are "portrait" (9:16); anything filmed
   * normally is "landscape" (16:9). Getting this wrong is what produces the
   * black bars this gallery exists to avoid, so set it explicitly for Shorts.
   */
  orientation?: "portrait" | "landscape";
  /**
   * The one video shown large at the top. Exactly one entry should set it; if
   * none do, the first entry is used.
   *
   * Prefer a LANDSCAPE video here — a 9:16 clip blown up to hero width is an
   * absurdly tall block sitting directly under the page hero. VideoGallery caps
   * the height defensively, but the layout is better if you pick a wide one.
   */
  featured?: boolean;
  /**
   * Escape hatch: a path to your own thumbnail committed under /public/videos,
   * e.g. "/videos/xTcZXIDtKeQ.jpg". Leave it unset in the normal case —
   * YouTube's own thumbnail is used, and thumbnailCandidates() below already
   * picks the right one for portrait vs landscape. Only reach for this when a
   * particular video's auto-generated frame is genuinely bad (a blurred frame
   * mid-motion, or a title card that says nothing).
   */
  thumbnail?: string;
}

/**
 * Display order = array order. Best first.
 *
 * While this array is empty the landing-page section renders nothing at all,
 * so the site can never show an empty video shelf.
 */
export const VIDEOS: VideoItem[] = [
  {
    id: "xTcZXIDtKeQ",
    title: "Cohort 3 — 24 August to 4 September at Leisure Mall, Adeniran Ogunsanya",
    category: "highlights",
    orientation: "portrait",
    featured: true,
  },
  {
    id: "hEIwMblaN5Q",
    title: "Educational, fun and experimental — inside Cohort 3",
    category: "highlights",
    orientation: "portrait",
  },
  {
    id: "talZ0gKmyj0",
    title: "Get your child registered for Cohort 3",
    category: "highlights",
    orientation: "portrait",
  },
  {
    id: "V2Fa3IzqJXo",
    title: "Inside the AIXR bootcamp",
    category: "highlights",
    orientation: "portrait",
  },
];

const ASPECT: Record<NonNullable<VideoItem["orientation"]>, string> = {
  portrait: "9 / 16",
  landscape: "16 / 9",
};

/** CSS aspect-ratio for a tile. Fixes the box before any image loads, so CLS is zero. */
export function aspectRatioOf(video: VideoItem): string {
  return ASPECT[video.orientation ?? "landscape"];
}

export const isPortrait = (video: VideoItem): boolean => video.orientation === "portrait";

export const hasVideos = (): boolean => VIDEOS.length > 0;

/** The large card at the top of the section. */
export function featuredVideo(): VideoItem | null {
  return VIDEOS.find((v) => v.featured) ?? VIDEOS[0] ?? null;
}

/** Everything else, in order. Empty when there is only one video. */
export function gridVideos(limit = 11): VideoItem[] {
  const hero = featuredVideo();
  return VIDEOS.filter((v) => v !== hero).slice(0, limit);
}

/**
 * Thumbnail URLs to try, best first.
 *
 * YouTube's naming is inconsistent and undocumented in the places it matters:
 *   maxresdefault  best quality, but 404s for a lot of videos including Shorts
 *   oardefault     "original aspect ratio" — the vertical frame for a Short
 *   hqdefault      always generated, but 4:3, so a Short comes back pillarboxed
 *
 * Hence a candidate list rather than one URL: the facade walks it on error and
 * only ever lands on hqdefault as a last resort.
 */
export function thumbnailCandidates(video: VideoItem): string[] {
  if (video.thumbnail) return [video.thumbnail];
  const base = `https://i.ytimg.com/vi/${video.id}`;
  return isPortrait(video)
    ? [`${base}/oardefault.jpg`, `${base}/hqdefault.jpg`]
    : [`${base}/maxresdefault.jpg`, `${base}/hqdefault.jpg`];
}

/**
 * Privacy-preserving embed. youtube-nocookie sets no tracking cookies until the
 * viewer actually presses play, and the iframe is only ever mounted after a
 * deliberate click anyway.
 */
export function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

/** Public watch URL, for the "see the whole channel" style links. */
export const CHANNEL_URL = "https://www.youtube.com/@AixrBootcamp";
