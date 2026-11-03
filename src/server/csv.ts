/** Quotes text and neutralizes spreadsheet formulas without modifying stored data. */
export function csvText(value: string) {
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** Stream UTF-8 CSV instead of buffering potentially large exports in memory. */
export function csvDownload(rows: AsyncGenerator<string>, filename: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await rows.next();
        if (chunk.done) controller.close();
        else controller.enqueue(encoder.encode(chunk.value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await rows.return(undefined);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
