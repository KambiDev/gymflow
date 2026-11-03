import assert from "node:assert/strict";
import { test } from "node:test";

import {
  maxImportBytes,
  maxImportRows,
  MemberImportError,
  parseMemberImportCsv,
} from "./import-csv";

const header = "Nombre,Apellido,Teléfono,Correo";

test("parses quoted CSV, CRLF, BOM and optional contact fields", () => {
  const rows = parseMemberImportCsv(
    `\uFEFF${header}\r\n"Ana, María","López ""G""",,ANA@Ejemplo.com\r\nBeto,Ruiz,,\r\n`,
  );
  assert.deepEqual(rows, [
    {
      firstName: "Ana, María",
      lastName: 'López "G"',
      phone: null,
      email: "ana@ejemplo.com",
      planId: null,
      notes: null,
    },
    {
      firstName: "Beto",
      lastName: "Ruiz",
      phone: null,
      email: null,
      planId: null,
      notes: null,
    },
  ]);
});

test("rejects missing or malformed headers, invalid rows and duplicate emails", () => {
  const invalid = [
    "",
    `${header}\n`,
    "Nombre,Apellido,Correo,Teléfono\nAna,López,,",
    `${header}\nAna,López,extra,ana@example.com,extra`,
    `${header}\nA,López,,`,
    `${header}\nAna,López,,bad-email`,
    `${header}\nAna,López,,ANA@example.com\nBeto,Ruiz,,ana@example.com`,
    `${header}\n"Ana,López,,`,
    `${header}\nAna,Lo"pez,,`,
    `${header}\n"Ana"extra,López,,`,
    `${header}\nAna,López,,\n${"Beto,Ruiz,,\n".repeat(maxImportRows)}`,
    `${header}\nAna,López,,${"x".repeat(maxImportBytes)}`,
  ];
  for (const csv of invalid)
    assert.throws(() => parseMemberImportCsv(csv), MemberImportError);
});
