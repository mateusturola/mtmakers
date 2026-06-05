// Gera o payload "PIX Copia e Cola" (BR Code / EMV) a partir da chave.

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Remove acentos e limita tamanho (exigência do padrão para nome/cidade).
function ascii(s: string, max: number): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

export interface PixInput {
  chave: string;
  nome?: string;
  cidade?: string;
  valor?: number;
  txid?: string;
}

export function montarPixPayload({
  chave,
  nome = "MT MAKERS",
  cidade = "SAO PAULO",
  valor,
  txid = "***",
}: PixInput): string {
  if (!chave) return "";

  const merchantAccount = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", chave.trim()));
  const valorStr = valor && valor > 0 ? tlv("54", valor.toFixed(2)) : "";
  const adicional = tlv("62", tlv("05", ascii(txid, 25) || "***"));

  let payload =
    tlv("00", "01") +
    tlv("01", "11") + // QR estático
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "986") +
    valorStr +
    tlv("58", "BR") +
    tlv("59", ascii(nome, 25) || "MT MAKERS") +
    tlv("60", ascii(cidade, 15) || "SAO PAULO") +
    adicional +
    "6304";

  payload += crc16(payload);
  return payload;
}
