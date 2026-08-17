# Camp photos

Photos shown on the landing page strip and at `/gallery`.

## Adding photos

**1. Put the image files in this folder** (`public/gallery/`).

Naming: lowercase, hyphens, describe the subject — `demo-day-pitch-01.jpg`,
`robotics-build-03.jpg`. No spaces, no `IMG_4821.JPG`.

**2. Resize before committing.** These files go into the git repo and ship with
every deploy, so a folder of 6 MB phone photos makes the whole site slower to
clone and build.

- Longest edge: **1600px**
- Target size: **under 300 KB** each
- Format: `.jpg` for photos, `.webp` if you can produce it

**3. Add an entry to [`lib/gallery.ts`](../../lib/gallery.ts).** A photo in this
folder does *not* appear on the site until it's listed there.

```ts
{
  src: "/gallery/demo-day-pitch-01.jpg",
  alt: "A camper presenting her AI app to the Demo Day jury",
  caption: "Demo Day — Cohort 1",
  cohort: 1,
  category: "demo-day",
  aspect: "landscape",
  featured: true,
},
```

| Field | Notes |
| --- | --- |
| `src` | Path from `/public` — always starts `/gallery/` |
| `alt` | **Required.** Describe what's happening for people using a screen reader. Not "camp photo" |
| `caption` | Optional, shown over the tile and under the photo in the lightbox |
| `cohort` | `1`, `2` or `3` — drives the cohort filter |
| `category` | `classes` · `demo-day` · `robotics` · `attractions` · `venue` |
| `aspect` | `landscape` (default) · `portrait` · `square` — match the actual photo or it will be cropped |
| `featured` | `true` puts it in the landing-page strip. Keep this to your best 6–8 |

**4. Commit and push.** Photos are static, so they only appear once the site
redeploys.

## Notes

- Order in the `GALLERY` array is the order shown. Best photos first.
- Filter chips only appear for categories and cohorts that actually have photos,
  so you can't end up with an empty filter.
- With no photos listed, the landing strip renders nothing at all and `/gallery`
  shows a "photos are on the way" message — the site never looks broken.
