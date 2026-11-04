import { csvDownload } from "@/server/csv";
import { memberImportHeaderWithPlan } from "./import-csv";

export function memberImportTemplate() {
  async function* rows() {
    yield `\uFEFF${memberImportHeaderWithPlan}\r\n`;
  }

  return csvDownload(rows(), "plantilla-socios.csv");
}
