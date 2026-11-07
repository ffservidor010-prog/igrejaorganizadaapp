import { jsPDF } from "jspdf";

/** Gera o PDF da carta (A4) com logo da igreja no topo, se houver. */
export function cartaPdf(texto: string, logoUrl?: string | null): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, "JPEG", 85, 10, 40, 40);
      y = 56;
    } catch { /* logo inválida */ }
  }
  doc.setFont("times", "normal");
  doc.setFontSize(12);
  for (const linha of texto.split("\n")) {
    if (!linha.trim()) { y += 6; continue; }
    const titulo = linha === linha.toUpperCase() && linha.length > 3 && y < 80;
    doc.setFont("times", titulo ? "bold" : "normal");
    doc.setFontSize(titulo ? 14 : 12);
    const partes = doc.splitTextToSize(linha, 170) as string[];
    if (y + partes.length * 6 > 285) { doc.addPage(); y = 20; }
    for (const p of partes) { doc.text(p, 20, y, { align: titulo ? "center" : "left", maxWidth: 170 }); y += 6; }
  }
  return doc.output("blob");
}
