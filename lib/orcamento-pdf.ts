import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { formatBRL, formatDateBR } from "@/lib/format";
import { parseItens } from "@/lib/itens";
import { montarPixPayload } from "@/lib/pix";
import { ORCAMENTO_OBS_PADRAO } from "@/lib/constants";
import type { Config } from "@/lib/config";
import type { Orcamento } from "@/types";

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

export async function gerarOrcamentoPDF(o: Orcamento, cfg: Config) {
  const itens = parseItens(o.produtos);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const left = 14;

  const logo = await loadLogo();
  if (logo) {
    doc.addImage(logo.dataUrl, "PNG", left, 12, 44, 44 * logo.ratio);
  } else {
    doc.setFontSize(20).setFont("helvetica", "bold").text("MT MAKERS", left, 20);
  }
  doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(20, 21, 26);
  doc.text("Orçamento", W - left, 18, { align: "right" });
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(120, 120, 120);
  doc.text(o.id, W - left, 24, { align: "right" });

  const y = 38;
  doc.setDrawColor(230, 232, 238).line(left, y - 4, W - left, y - 4);
  doc.setFontSize(10).setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold").text("Cliente:", left, y);
  doc.setFont("helvetica", "normal").text(o.cliente || "—", left + 22, y);
  doc.setFont("helvetica", "bold").text("Data:", W - left - 44, y);
  doc.setFont("helvetica", "normal").text(formatDateBR(o.data) || "—", W - left, y, {
    align: "right",
  });
  doc.setFont("helvetica", "bold").setTextColor(180, 40, 40).text("Válido até:", left, y + 6);
  doc
    .setFont("helvetica", "normal")
    .setTextColor(180, 40, 40)
    .text(formatDateBR(o.validade) || "—", left + 24, y + 6);

  autoTable(doc, {
    startY: y + 11,
    head: [["Produto", "Qtd", "Valor un.", "Subtotal"]],
    body:
      itens.length > 0
        ? itens.map((i) => [
            i.produto,
            String(i.qtd),
            formatBRL(i.valorUnit),
            formatBRL(i.qtd * i.valorUnit),
          ])
        : [[o.produtos || "—", String(o.qtd), "", formatBRL(o.total)]],
    theme: "striped",
    headStyles: { fillColor: [61, 90, 254], textColor: 255 },
    columnStyles: {
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32 },
    },
    styles: { fontSize: 10, cellPadding: 2.5 },
    margin: { left, right: left },
  });

  // @ts-expect-error lastAutoTable do plugin
  let fy = (doc.lastAutoTable?.finalY ?? y + 20) + 8;
  const boxX = W - left - 90;
  doc.setFillColor(238, 241, 255);
  doc.roundedRect(boxX, fy - 5.5, 90, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(26, 35, 126);
  doc.text("Total do orçamento:", boxX + 4, fy, { align: "left" });
  doc.text(formatBRL(o.total), W - left - 4, fy, { align: "right" });
  fy += 10;

  // Observações (validade + prazo + extras)
  const obs = [ORCAMENTO_OBS_PADRAO, o.observacoes].filter(Boolean).join("\n");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(20, 21, 26);
  doc.text("Observações", left, fy);
  fy += 5;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80, 80, 80);
  obs
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => {
      const linhas = doc.splitTextToSize(`•  ${l}`, W - 2 * left);
      doc.text(linhas, left, fy);
      fy += linhas.length * 4.5;
    });

  // PIX (opcional) — para pagar a entrada e aprovar
  if (cfg.chavePix) {
    fy += 4;
    const valorPix = o.entradaPaga > 0 ? o.entradaPaga : o.total;
    const payload = montarPixPayload({
      chave: cfg.chavePix,
      nome: cfg.recebedorNome,
      cidade: cfg.recebedorCidade,
      valor: valorPix,
    });
    const qr = await QRCode.toDataURL(payload, { margin: 1, width: 260 });
    const boxY = fy;
    doc.setFillColor(248, 249, 255).roundedRect(left, boxY, W - 2 * left, 42, 3, 3, "F");
    doc.addImage(qr, "PNG", left + 4, boxY + 4, 34, 34);
    const tx = left + 34 + 12;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(26, 35, 126);
    doc.text("Pagamento via PIX", tx, boxY + 9);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(70, 70, 70);
    doc.text(`Valor: ${formatBRL(valorPix)}`, tx, boxY + 16);
    doc.text(`Chave: ${cfg.chavePix}`, tx, boxY + 22);
    doc.text(`Recebedor: ${cfg.recebedorNome}`, tx, boxY + 28);
  }

  doc.setFontSize(8).setTextColor(150, 150, 150);
  doc.text("MT Makers · Impressão 3D personalizada", W / 2, 287, { align: "center" });

  doc.save(`orcamento-${o.id}-${(o.cliente || "").replace(/\s+/g, "-")}.pdf`);
}
