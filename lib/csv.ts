import Papa from "papaparse";

/** Turn an array of flat row objects into a downloadable CSV NextResponse. */
export function csvResponse(rows: Record<string, unknown>[], filenamePrefix: string): Response {
  const csv = Papa.unparse(rows);
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
