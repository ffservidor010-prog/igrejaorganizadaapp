import { jsPDF } from "jspdf";

export function ataPdf(texto: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 25;
  const width = 210 - margin * 2;
  let y = margin;
  doc.setFont("times", "normal");
  const lines = texto.split("\n");
  lines.forEach((line, i) => {
    const titulo = i < 2;
    doc.setFont("times", titulo ? "bold" : "normal");
    doc.setFontSize(titulo ? 13 : 12);
    const wrapped = line ? doc.splitTextToSize(line, width) : [""];
    for (const w of wrapped) {
      if (y > 297 - margin) { doc.addPage(); y = margin; }
      if (titulo || /^_{5,}|^Presidente$|^Secretário/.test(line)) doc.text(w, 105, y, { align: "center" });
      else doc.text(w, margin, y, { align: "justify", maxWidth: width });
      y += 6.5;
    }
  });
  return doc.output("blob");
}

export function ataDoc(texto: string): Blob {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = texto.split("\n").map((l, i) => {
    const center = i < 2 || /^_{5,}|^Presidente$|^Secretário/.test(l);
    return `<p style="margin:0 0 6pt;text-align:${center ? "center" : "justify"};${i < 2 ? "font-weight:bold;" : ""}">${esc(l) || "&nbsp;"}</p>`;
  }).join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page{size:A4;margin:2.5cm}body{font-family:'Times New Roman';font-size:12pt;line-height:1.5}</style></head><body>${body}</body></html>`;
  return new Blob(["\ufeff", html], { type: "application/msword" });
}

export function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Compartilha o PDF (no celular abre WhatsApp/E-mail com o arquivo). Retorna false se não suportado. */
export async function compartilharPdf(blob: Blob, nome: string, titulo: string) {
  const file = new File([blob], nome, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: titulo, text: titulo }); return true; } catch { return true; }
  }
  return false;
}
