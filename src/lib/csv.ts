import { COLUMN_MAPPING } from "@/constants/baseball";

export function normalizeColumnName(name: string) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(numeric) ? numeric : 0;
}

export function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

export function parseCsvText(text: string) {
  const normalizedText = String(text)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < normalizedText.length; i += 1) {
    const ch = normalizedText[i];
    const next = normalizedText[i + 1];
    if (ch === '"') {
      current += ch;
      if (inQuotes && next === '"') {
        current += next;
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);

  const meaningfulLines = lines.filter((line) => line.trim() !== "");
  if (meaningfulLines.length === 0) return [];

  const headers = parseCsvLine(meaningfulLines[0]).map((header) => header.trim());

  return meaningfulLines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

export function normalizePlayerRows(rows: Record<string, unknown>[]) {
  return rows.map((row, index) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row || {})) {
      const mappedKey = COLUMN_MAPPING[normalizeColumnName(key) as keyof typeof COLUMN_MAPPING] || key;
      normalized[mappedKey] = value;
    }
    if (!normalized.Name || String(normalized.Name).trim() === "") {
      normalized.Name = `Player ${index + 1}`;
    }
    normalized.TeamName = normalized.TeamName ? String(normalized.TeamName).trim() : "";
    normalized.playerKey = `${normalized.Name}__${normalized.TeamName || "NA"}__${index}`;
    return normalized;
  });
}