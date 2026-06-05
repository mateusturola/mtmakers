import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Consignado } from "@/types";

// Parser local (não importar de lib/sheets, que puxa googleapis pro client).
function parseValor(s: string): number {
  const cleaned = String(s)
    .replace(/r\$/i, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export interface ItemParsed {
  qtd: number;
  produto: string;
  valorUnit: number;
}

// Converte "2× Chaveiro @ R$ 5,00; 3× Medalha @ R$ 8,00" em itens.
export function parseItensConsignado(produtosQtd: string): ItemParsed[] {
  if (!produtosQtd) return [];
  return produtosQtd
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(\d+)\s*[×x]\s*(.+?)\s*@\s*(.+)$/i);
      if (m) {
        return { qtd: Number(m[1]) || 1, produto: m[2].trim(), valorUnit: parseValor(m[3]) };
      }
      return { qtd: 1, produto: s, valorUnit: 0 };
    });
}

async function loadLogo(): Promise<{ dataUrl: string; ratio: number } | null> {
  try {
    const res = await fetch("/logo-mt.png");
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
    return { dataUrl, ratio: 85 / 479 };
  } catch {
    return null;
  }
}

export async function gerarConsignadoPDF(c: Consignado) {
  const itens = parseItensConsignado(c.produtosQtd);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const left = 14;

  // Cabeçalho
  const logo = await loadLogo();
  if (logo) {
    const w = 44;
    doc.addImage(logo.dataUrl, "PNG", left, 12, w, w * logo.ratio);
  } else {
    doc.setFontSize(20).setFont("helvetica", "bold");
    doc.text("MT MAKERS", left, 20);
  }

  doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(20, 21, 26);
  doc.text("Comprovante de Consignado", W - left, 18, { align: "right" });
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(120, 120, 120);
  doc.text(`${c.id}`, W - left, 24, { align: "right" });

  // Dados do cliente
  const y = 38;
  doc.setDrawColor(230, 232, 238).line(left, y - 4, W - left, y - 4);
  doc.setFontSize(10).setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold").text("Cliente:", left, y);
  doc.setFont("helvetica", "normal").text(c.cliente || "—", left + 22, y);
  doc.setFont("helvetica", "bold").text("Data:", W - left - 40, y);
  doc.setFont("helvetica", "normal").text(formatDateBR(c.data) || "—", W - left, y, {
    align: "right",
  });

  // Tabela de produtos
  autoTable(doc, {
    startY: y + 8,
    head: [["Qtd", "Produto", "Valor un.", "Subtotal"]],
    body: itens.map((i) => [
      String(i.qtd),
      i.produto,
      formatBRL(i.valorUnit),
      formatBRL(i.qtd * i.valorUnit),
    ]),
    theme: "striped",
    headStyles: { fillColor: [61, 90, 254], textColor: 255, halign: "left" },
    columnStyles: {
      0: { halign: "center", cellWidth: 18 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32 },
    },
    styles: { fontSize: 10, cellPadding: 2.5 },
    margin: { left, right: left },
  });

  // Totais — bloco à direita, com destaque no total
  // @ts-expect-error lastAutoTable é adicionado pelo plugin
  let fy = (doc.lastAutoTable?.finalY ?? y + 20) + 8;
  const totalConsig = itens.reduce((a, i) => a + i.qtd * i.valorUnit, 0);
  const boxX = W - left - 90;
  const labelX = boxX + 4;
  const valueX = W - left - 4;

  const linha = (label: string, valor: string) => {
    doc.text(label, labelX, fy, { align: "left" });
    doc.text(valor, valueX, fy, { align: "right" });
    fy += 6.5;
  };

  // Caixa de destaque do total
  doc.setFillColor(238, 241, 255);
  doc.roundedRect(boxX, fy - 5.5, 90, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(26, 35, 126);
  linha("Valor consignado:", formatBRL(totalConsig || c.valorConsignado));
  fy += 2;

  if (c.valorDevolvido > 0) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(90, 90, 90);
    linha("Valor devolvido:", formatBRL(c.valorDevolvido));
    doc.setFont("helvetica", "bold").setTextColor(26, 35, 126);
    linha("Saldo:", formatBRL(c.saldo));
  }

  // Assinaturas
  fy = Math.max(fy + 24, 230);
  doc.setDrawColor(120, 120, 120);
  doc.line(left, fy, left + 70, fy);
  doc.line(W - left - 70, fy, W - left, fy);
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(90, 90, 90);
  doc.text("MT Makers", left, fy + 5);
  doc.text(c.cliente || "Cliente", W - left - 70, fy + 5);

  // Rodapé
  doc.setFontSize(8).setTextColor(150, 150, 150);
  doc.text("MT Makers · Impressão 3D personalizada", W / 2, 287, { align: "center" });

  doc.save(`consignado-${c.id}-${(c.cliente || "").replace(/\s+/g, "-")}.pdf`);
}
