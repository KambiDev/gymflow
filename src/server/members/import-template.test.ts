import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseMemberImportCsv,
  MemberImportError,
  memberImportHeaderWithPlan,
} from "./import-csv";
import { memberImportTemplate } from "./import-template";

test("downloadable template uses the supported UTF-8 header and contains no member data", async () => {
  const response = memberImportTemplate();
  assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.equal(
    response.headers.get("Content-Disposition"),
    'attachment; filename="plantilla-socios.csv"',
  );
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
  assert.equal(text, `\uFEFF${memberImportHeaderWithPlan}\r\n`);
  assert.throws(() => parseMemberImportCsv(text), MemberImportError);
  assert.equal(
    parseMemberImportCsv(`${text}Ana,López,,,Mensual`)[0].planName,
    "Mensual",
  );
});
