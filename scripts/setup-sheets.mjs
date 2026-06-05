// ===== Setup automático da planilha MT Makers =====
// Cria as abas e cabeçalhos necessários numa planilha (nova ou existente).
//
// Uso:
//   node --env-file=.env.local scripts/setup-sheets.mjs
//
// Pré-requisitos no .env.local:
//   GOOGLE_SHEETS_ID=<id da planilha>
//   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./service-account.json  (ou GOOGLE_SERVICE_ACCOUNT_JSON)
// E a planilha precisa estar compartilhada com o client_email da conta de serviço (Editor).

import { google } from "googleapis";
import { readFileSync } from "node:fs";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// Estrutura: cabeçalhos na linha 3, dados a partir da linha 4.
const TABS = {
  Clientes: ["#", "ID Cliente", "Nome", "WhatsApp", "Tipo", "Cidade", "Cadastrado em", "Observações"],
  Produtos: [
    "#", "ID", "Data", "Peça", "Categoria", "Peso (g)", "Tempo (min)", "Qtd", "Pçs/placa",
    "Custo/pç", "50% padrão", "60%", "70%", "80%", "c/ desc. 10%", "c/ nota +6%", "Margem (%)", "Total venda",
  ],
  Pedidos: [
    "#", "ID Pedido", "ID Cliente", "Data", "Cliente", "Produto", "Endereço entrega", "Qtd",
    "Preço unit. (R$)", "Total (R$)", "Entrada paga", "Restante", "Forma pgto", "Data entrega", "Status", "Observações",
  ],
  Orcamentos: [
    "#", "ID Orçamento", "ID Cliente", "Data", "Cliente", "Produtos", "Endereço entrega",
    "Qtd", "Total (R$)", "Entrada paga", "Restante", "Forma pgto", "Validade", "Status", "Observações",
  ],
  Consignado: [
    "ID Consignado", "ID Cliente", "Cliente", "Data", "Produtos/Qtd", "Valor consignado",
    "Valor devolvido", "Saldo", "Status", "Observações",
  ],
  Retiradas: ["ID Retirada", "Data", "Descrição", "Valor", "Forma pgto", "Observações"],
  Entradas: ["#", "Data", "ID Produto", "Produto", "Qtd", "Preço Unit. (R$)", "Total", "Status"],
  Adicionais: [
    "ID", "Nome", "Custo embalagem (R$)", "Rendimento", "Unidade", "Custo/peça (R$)", "Observação",
  ],
  Config: [
    "Filamento (R$/kg)", "Energia (R$/kWh)", "Potência (W)", "Custo impressora (R$)",
    "Vida útil (h)", "Valor hora (R$/h)", "Manuseio (min)", "Markup padrão (%)", "Meta mensal (R$)",
    "Chave PIX", "Recebedor (nome)", "Recebedor (cidade)", "Observações do pedido",
  ],
};

// Valores padrão da aba Config (linha 4), na mesma ordem dos cabeçalhos.
const CONFIG_DEFAULTS = [
  125, 1.53, 120, 2500, 2000, 30, 5, 50, 10000,
  "", "MT Makers", "SAO PAULO", "",
];

function loadCredentials() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let text = "";
  if (keyFile) text = readFileSync(keyFile, "utf8");
  else if (rawJson) {
    const t = rawJson.trim();
    text = t.startsWith("{") ? t : Buffer.from(t, "base64").toString("utf8");
  } else {
    throw new Error("Defina GOOGLE_SERVICE_ACCOUNT_KEY_FILE ou GOOGLE_SERVICE_ACCOUNT_JSON");
  }
  const creds = JSON.parse(text);
  if (typeof creds.private_key === "string")
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  return creds;
}

async function main() {
  if (!SPREADSHEET_ID) throw new Error("Defina GOOGLE_SHEETS_ID no .env.local");

  const auth = new google.auth.GoogleAuth({
    credentials: loadCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existentes = new Set(meta.data.sheets.map((s) => s.properties.title));

  // 1. Cria as abas que faltam.
  const novas = Object.keys(TABS).filter((t) => !existentes.has(t));
  if (novas.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: novas.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    console.log("Abas criadas:", novas.join(", "));
  } else {
    console.log("Todas as abas já existiam.");
  }

  // 2. Escreve banner (linha 1) e cabeçalhos (linha 3) em cada aba.
  for (const [title, headers] of Object.entries(TABS)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [[`MT Makers — ${title}`]] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!A3`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log(`Cabeçalhos OK: ${title} (${headers.length} colunas)`);
  }

  // Semeia os valores padrão na aba Config (linha 4), só se estiver vazia.
  const cfgRow = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Config!A4:I4",
  });
  if (!cfgRow.data.values || !cfgRow.data.values[0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Config!A4",
      valueInputOption: "RAW",
      requestBody: { values: [CONFIG_DEFAULTS] },
    });
    console.log("Config: valores padrão preenchidos.");
  } else {
    console.log("Config: já tinha valores (mantidos).");
  }

  console.log("\n✅ Planilha pronta! Pode usar o app.");
}

main().catch((e) => {
  console.error("\n❌ Erro:", e.message);
  process.exit(1);
});
