import { google } from "googleapis";
import { readFileSync } from "fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// Caminho para um arquivo .json da service account (forma mais simples).
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
// Ou o conteúdo do JSON: cru (uma linha) ou em base64.
const RAW_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

export function isSheetsConfigured(): boolean {
  return Boolean(SPREADSHEET_ID && (KEY_FILE || RAW_JSON));
}

// Aceita JSON cru, base64 ou caminho de arquivo. Normaliza o \n da private_key.
function loadCredentials(): Record<string, unknown> {
  let text = "";
  if (KEY_FILE) {
    text = readFileSync(KEY_FILE, "utf8");
  } else if (RAW_JSON) {
    const trimmed = RAW_JSON.trim();
    // Se não começa com "{", assume base64.
    text = trimmed.startsWith("{")
      ? trimmed
      : Buffer.from(trimmed, "base64").toString("utf8");
  }
  const creds = JSON.parse(text) as Record<string, unknown>;
  if (typeof creds.private_key === "string") {
    // Corrige quebras de linha escapadas (\n -> newline real).
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }
  return creds;
}

function getAuth() {
  if (!isSheetsConfigured()) {
    throw new Error(
      "Google Sheets não configurado: defina GOOGLE_SHEETS_ID e " +
        "GOOGLE_SERVICE_ACCOUNT_KEY_FILE (caminho do .json) ou " +
        "GOOGLE_SERVICE_ACCOUNT_JSON no .env.local"
    );
  }
  return new google.auth.GoogleAuth({
    credentials: loadCredentials(),
    scopes: SCOPES,
  });
}

async function getClient() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

export async function readSheet(range: string): Promise<string[][]> {
  const sheets = await getClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return (response.data.values as string[][]) || [];
}

export async function appendRow(range: string, values: unknown[][]) {
  const sheets = await getClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

export async function updateRow(range: string, values: unknown[][]) {
  const sheets = await getClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

// Limpa o conteúdo de uma linha (usado para "exclusão" lógica).
export async function clearRange(range: string) {
  const sheets = await getClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
}

// ===== Helpers de normalização (planilha em locale pt-BR) =====

// Converte "1.100,80" ou "R$ 1.100,80" -> 1100.8
export function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  let s = String(value).trim();
  s = s.replace(/r\$/i, "").replace(/\s/g, "").replace(/%/g, "");
  if (s === "" || s === "-") return 0;
  // Remove separador de milhar "." e troca decimal "," por "."
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

// Gera o próximo ID sequencial no formato PREFIXO-001 a partir de uma lista de IDs existentes.
export function nextId(prefix: string, existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    const m = String(id).match(new RegExp(`${prefix}-(\\d+)`, "i"));
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

// Data atual em DD/MM/YYYY (para gravar na planilha).
export function hojeBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}
