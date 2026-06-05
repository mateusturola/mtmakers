import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { formatBRL, formatDateBR } from "@/lib/format";
import { parseItens } from "@/lib/itens";
import { montarPixPayload } from "@/lib/pix";
import type { Config } from "@/lib/config";

export interface PedidoPDFData {
  id: string;
  cliente: string;
  produto: string;
  data?: string;
  dataEntrega?: string;
  qtd: number;
  precoUnit: number;
  total: number;
  entradaPaga: number;
  restante: number;
  formaPgto?: string;
  status?: string;
  enderecoEntrega?: string;
  observacoes?: string;
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

export async function gerarPedidoPDF(p: PedidoPDFData, cfg: Config) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const left = 14;

  // Cabeçalho
  const logo = await loadLogo();
  if (logo) {
    doc.addImage(logo.dataUrl, "PNG", left, 12, 44, 44 * logo.ratio);
  } else {
    doc.setFontSize(20).setFont("helvetica", "bold").text("MT MAKERS", left, 20);
  }
  doc.setFontSize(14).setFont("helvetica", "bold").setTextColor(20, 21, 26);
  doc.text("Pedido", W - left, 18, { align: "right" });
  doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(120, 120, 120);
  doc.text(p.id, W - left, 24, { align: "right" });

  // Cliente / datas
  let y = 38;
  doc.setDrawColor(230, 232, 238).line(left, y - 4, W - left, y - 4);
  doc.setFontSize(10).setTextColor(60, 60, 60);
  doc.setFont("helvetica", "bold").text("Cliente:", left, y);
  doc.setFont("helvetica", "normal").text(p.cliente || "—", left + 22, y);
  doc.setFont("helvetica", "bold").text("Data:", W - left - 42, y);
  doc.setFont("helvetica", "normal").text(formatDateBR(p.data || "") || "—", W - left, y, {
    align: "right",
  });
  if (p.dataEntrega) {
    y += 6;
    doc.setFont("helvetica", "bold").text("Entrega:", left, y);
    doc.setFont("helvetica", "normal").text(formatDateBR(p.dataEntrega), left + 22, y);
  }
  if (p.status) {
    doc.setFont("helvetica", "bold").text("Status:", W - left - 42, y);
    doc.setFont("helvetica", "normal").text(p.status, W - left, y, { align: "right" });
  }

  // Tabela de produtos (1 ou vários)
  const itens = parseItens(p.produto);
  const temLista = itens.length > 1 || (itens[0]?.valorUnit ?? 0) > 0;
  const body = temLista
    ? itens.map((i) => [
        i.produto,
        String(i.qtd),
        formatBRL(i.valorUnit),
        formatBRL(i.qtd * i.valorUnit),
      ])
    : [[p.produto, String(p.qtd), formatBRL(p.precoUnit), formatBRL(p.total)]];

  autoTable(doc, {
    startY: y + 8,
    head: [["Produto", "Qtd", "Preço un.", "Total"]],
    body,
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
  const linha = (label: string, valor: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 11 : 10);
    doc.setTextColor(bold ? 26 : 90, bold ? 35 : 90, bold ? 126 : 90);
    doc.text(label, boxX + 4, fy, { align: "left" });
    doc.text(valor, W - left - 4, fy, { align: "right" });
    fy += bold ? 7 : 6;
  };
  if (p.entradaPaga > 0) linha("Entrada paga:", formatBRL(p.entradaPaga));
  if (p.formaPgto) linha("Forma de pagamento:", p.formaPgto);
  doc.setFillColor(238, 241, 255);
  doc.roundedRect(boxX, fy - 5.5, 90, 11, 2, 2, "F");
  linha("Restante a pagar:", formatBRL(p.restante > 0 ? p.restante : p.total), true);
  fy += 4;

  // Observações
  const obs = [cfg.obsPedido, p.observacoes].filter(Boolean).join("\n");
  if (obs.trim()) {
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
  }

  // PIX
  if (cfg.chavePix) {
    fy += 4;
    const valorPix = p.restante > 0 ? p.restante : p.total;
    const payload = montarPixPayload({
      chave: cfg.chavePix,
      nome: cfg.recebedorNome,
      cidade: cfg.recebedorCidade,
      valor: valorPix,
    });
    const qr = await QRCode.toDataURL(payload, { margin: 1, width: 260 });

    const boxY = fy;
    doc.setFillColor(248, 249, 255);
    doc.roundedRect(left, boxY, W - 2 * left, 42, 3, 3, "F");
    const qrSize = 34;
    doc.addImage(qr, "PNG", left + 4, boxY + 4, qrSize, qrSize);

    const tx = left + qrSize + 12;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(26, 35, 126);
    doc.text("Pagamento via PIX", tx, boxY + 9);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(70, 70, 70);
    doc.text(`Valor: ${formatBRL(valorPix)}`, tx, boxY + 16);
    doc.text(`Chave: ${cfg.chavePix}`, tx, boxY + 22);
    doc.text(`Recebedor: ${cfg.recebedorNome}`, tx, boxY + 28);
    doc.setFontSize(7).setTextColor(130, 130, 130);
    const copia = doc.splitTextToSize(payload, W - tx - left - 2);
    doc.text(copia.slice(0, 2), tx, boxY + 34);
    fy = boxY + 46;
  }

  // Rodapé
  doc.setFontSize(8).setTextColor(150, 150, 150);
  doc.text("MT Makers · Impressão 3D personalizada", W / 2, 287, { align: "center" });

  doc.save(`pedido-${p.id}-${(p.cliente || "").replace(/\s+/g, "-")}.pdf`);
}
