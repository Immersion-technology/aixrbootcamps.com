/**
 * Renders a JSON-LD structured-data block. Pass any schema.org object as `data`.
 * Safe by construction: JSON.stringify can't emit a `</script>` breakout because
 * `<` is escaped to `<`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
