import { memberSchema, type MemberFields } from "./validation";

export const maxImportBytes = 256 * 1024;
export const maxImportRows = 200;
export const memberImportHeader = "Nombre,Apellido,Teléfono,Correo";
export const memberImportHeaderWithPlan = `${memberImportHeader},Plan`;

export type MemberImportRow = {
  member: MemberFields;
  planName: string | null;
  line: number;
};

export class MemberImportError extends Error {}

function parseRows(text: string) {
  const rows: { cells: string[]; line: number }[] = [];
  let cells: string[] = [];
  let cell = "";
  let line = 1;
  let rowLine = 1;
  let quoted = false;
  let closedQuote = false;
  let atCellStart = true;

  function finishRow() {
    cells.push(cell);
    if (cells.length !== 1 || cells[0].trim()) {
      rows.push({ cells, line: rowLine });
      if (rows.length > maxImportRows + 1)
        throw new MemberImportError(
          `Máximo ${maxImportRows} socios por archivo.`,
        );
    }
    cells = [];
    cell = "";
    closedQuote = false;
    atCellStart = true;
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        cell += char;
        if (char === "\n") line++;
      }
      continue;
    }

    if (char === "," || char === "\r" || char === "\n") {
      if (char === ",") {
        cells.push(cell);
        cell = "";
        closedQuote = false;
        atCellStart = true;
      } else {
        finishRow();
        if (char === "\r" && text[i + 1] === "\n") i++;
        line++;
        rowLine = line;
      }
    } else if (char === '"' && atCellStart) {
      quoted = true;
      atCellStart = false;
    } else if (char === '"' || closedQuote) {
      throw new MemberImportError(`Fila ${rowLine}: formato CSV inválido.`);
    } else {
      cell += char;
      atCellStart = false;
    }
  }
  if (quoted)
    throw new MemberImportError(`Fila ${rowLine}: faltan comillas de cierre.`);
  if (cell || cells.length || closedQuote) finishRow();
  return rows;
}

/** Validates the whole CSV before any member is created. */
export function parseMemberImportCsv(text: string): MemberImportRow[] {
  if (Buffer.byteLength(text, "utf8") > maxImportBytes)
    throw new MemberImportError("El archivo supera los 256 KB permitidos.");

  const rows = parseRows(text.replace(/^\uFEFF/, ""));
  const header = rows[0]?.cells;
  const withPlan = header?.length === 5 && header[4] === "Plan";
  if (
    !header ||
    header.length !== (withPlan ? 5 : 4) ||
    header.slice(0, 4).join(",") !== memberImportHeader
  )
    throw new MemberImportError(
      `La primera fila debe ser: ${memberImportHeader} o ${memberImportHeaderWithPlan}`,
    );
  if (rows.length === 1)
    throw new MemberImportError("Agrega al menos un socio.");

  const emails = new Set<string>();
  return rows.slice(1).map(({ cells, line }) => {
    if (cells.length !== header.length)
      throw new MemberImportError(
        `Fila ${line}: se esperan ${withPlan ? "cinco" : "cuatro"} columnas.`,
      );
    const planName = withPlan ? cells[4].trim() : "";
    if (planName.length > 80)
      throw new MemberImportError(
        `Fila ${line}: el nombre del plan supera 80 caracteres.`,
      );
    const parsed = memberSchema.safeParse({
      firstName: cells[0],
      lastName: cells[1],
      phone: cells[2],
      email: cells[3].trim().toLowerCase(),
      planId: "",
      notes: "",
    });
    if (!parsed.success)
      throw new MemberImportError(
        `Fila ${line}: ${parsed.error.issues[0]?.message ?? "datos inválidos."}`,
      );
    const email = parsed.data.email;
    if (email) {
      if (emails.has(email))
        throw new MemberImportError(
          `Fila ${line}: correo repetido en el archivo.`,
        );
      emails.add(email);
    }
    return { member: parsed.data, planName: planName || null, line };
  });
}
