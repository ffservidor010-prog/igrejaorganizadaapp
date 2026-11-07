// Regras puras do Igreja Organizada (sem acesso a banco).

export const APP_NAME = "Igreja Organizada";
export const CARGOS = ["membro", "lider", "pastor", "admin"] as const;
export type Cargo = (typeof CARGOS)[number];
export const CARGO_LABEL: Record<string, string> = { membro: "Membro", lider: "Líder", pastor: "Pastor", admin: "Admin" };
export const TIPOS_CULTO = ["Domingo Manhã", "Domingo Noite", "Quarta", "Ensaio"];
export const FUNCOES = ["Louvor", "Bateria", "Teclado", "Violão", "Baixo", "Som", "Mídia", "Recepção", "Diaconia", "Infantil"];
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Converte telefone com DDD para o formato do WhatsApp (55 + DDD + número). */
export function phoneToWa(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d;
}

export function waLink(phone: string, msg?: string) {
  const n = phoneToWa(phone);
  return `https://wa.me/${n}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
}

export function dataBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function escalaMensagem(nome: string, funcao: string, dataIso: string) {
  const primeiro = nome.trim().split(/\s+/)[0] ?? nome;
  return `Oi ${primeiro}! Tudo bem? Você está escalado(a) para ${funcao} no culto de ${dataBR(dataIso)}. Pode confirmar?`;
}

const UNID = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

export function numeroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  if (n < 20) return UNID[n]!;
  if (n < 100) return DEZ[Math.floor(n / 10)]! + (n % 10 ? ` e ${UNID[n % 10]}` : "");
  if (n === 100) return "cem";
  if (n < 1000) {
    const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    return C[Math.floor(n / 100)]! + (n % 100 ? ` e ${numeroPorExtenso(n % 100)}` : "");
  }
  const mil = Math.floor(n / 1000);
  const resto = n % 1000;
  const m = mil === 1 ? "mil" : `${numeroPorExtenso(mil)} mil`;
  if (!resto) return m;
  return `${m}${resto < 100 || resto % 100 === 0 ? " e " : " "}${numeroPorExtenso(resto)}`;
}

export function dataPorExtenso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dia = d === 1 ? "primeiro dia" : `${numeroPorExtenso(d!)} dias`;
  return `Aos ${dia} do mês de ${MESES[m! - 1]} do ano de ${numeroPorExtenso(y!)}`;
}

export type AtaEscala = { data: string; tipo_culto: string; funcao: string; nome: string; confirmado: boolean };
export type AtaEvento = { titulo: string; data: string; horario: string; local: string; descricao: string };
export type AtaInput = {
  igreja: string; mes: number; ano: number; dataReuniao: string; horario: string; local: string;
  presidente: string; secretario: string; pauta: string; presentes: string[]; decisoes: string;
  escalas: AtaEscala[]; eventos: AtaEvento[]; novosMembros: string[];
};

export function cultosDoMes(escalas: AtaEscala[]) {
  const map = new Map<string, AtaEscala[]>();
  for (const e of [...escalas].sort((a, b) => a.data.localeCompare(b.data) || a.tipo_culto.localeCompare(b.tipo_culto))) {
    const k = `${e.data}|${e.tipo_culto}`;
    map.set(k, [...(map.get(k) ?? []), e]);
  }
  return [...map.entries()].map(([k, itens]) => ({ data: k.split("|")[0]!, tipo: k.split("|")[1]!, itens }));
}

export function gerarTextoAta(a: AtaInput) {
  const mesNome = MESES[a.mes - 1]!;
  const cultos = cultosDoMes(a.escalas);
  const L: string[] = [];
  L.push(a.igreja.toUpperCase());
  L.push(`ATA DA REUNIÃO ORDINÁRIA MENSAL REFERENTE AO MÊS DE ${mesNome.toUpperCase()} DE ${a.ano}`);
  L.push("");
  L.push(`${dataPorExtenso(a.dataReuniao)}, às ${a.horario || "____"} horas, nas dependências de ${a.local || "____"}, reuniram-se os membros da ${a.igreja}, em reunião ordinária mensal, sob a presidência do(a) Sr(a). ${a.presidente || "____"}, sendo secretariada pelo(a) Sr(a). ${a.secretario || "____"}. Havendo número legal, o(a) Senhor(a) Presidente declarou aberta a sessão, invocando a bênção de Deus, e passou à seguinte ordem do dia.`);
  L.push("");
  L.push("PAUTA:");
  L.push(a.pauta.trim() || "1. Leitura e aprovação da ata anterior; 2. Relatório dos cultos e escalas do mês; 3. Relatório de eventos; 4. Recepção de novos membros; 5. Assuntos gerais.");
  L.push("");
  L.push(`I – RELATÓRIO DOS CULTOS: No mês de ${mesNome} de ${a.ano} foram realizados ${cultos.length} (${numeroPorExtenso(cultos.length)}) culto(s) com escala registrada, conforme segue:`);
  if (!cultos.length) L.push("Não houve escalas registradas no período.");
  for (const c of cultos) {
    L.push(`• ${dataBR(c.data)} – ${c.tipo}: ${c.itens.map((i) => `${i.funcao}: ${i.nome}${i.confirmado ? "" : " (não confirmado)"}`).join("; ")}.`);
  }
  L.push("");
  L.push("II – EVENTOS E FESTIVIDADES:");
  if (!a.eventos.length) L.push("Não houve eventos registrados no período.");
  for (const e of a.eventos) L.push(`• ${e.titulo}, em ${dataBR(e.data)}${e.horario ? `, às ${e.horario}` : ""}${e.local ? `, em ${e.local}` : ""}${e.descricao ? ` – ${e.descricao}` : ""}.`);
  L.push("");
  L.push("III – NOVOS MEMBROS:");
  L.push(a.novosMembros.length ? `Foram recebidos e registrados no rol de membros: ${a.novosMembros.join(", ")}.` : "Não houve recepção de novos membros no período.");
  L.push("");
  L.push("IV – DECISÕES:");
  L.push(a.decisoes.trim() || "Não houve deliberações adicionais.");
  L.push("");
  L.push("V – LISTA DE PRESENTES:");
  L.push(a.presentes.length ? a.presentes.join(", ") + "." : "____");
  L.push("");
  L.push(`Nada mais havendo a tratar, o(a) Senhor(a) Presidente agradeceu a presença de todos e declarou encerrada a reunião, e eu, ${a.secretario || "____"}, Secretário(a), lavrei a presente ata que, após lida e achada conforme, será assinada por mim e pelo(a) Presidente.`);
  L.push("");
  L.push(`${a.local || "____"}, ${dataBR(a.dataReuniao)}.`);
  L.push("");
  L.push("");
  L.push("_______________________________________");
  L.push(`${a.presidente || ""}`);
  L.push("Presidente");
  L.push("");
  L.push("");
  L.push("_______________________________________");
  L.push(`${a.secretario || ""}`);
  L.push("Secretário(a)");
  return L.join("\n");
}

export function monthRange(ano: number, mes: number) {
  const ini = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const last = new Date(ano, mes, 0).getDate();
  const fim = `${ano}-${String(mes).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { ini, fim };
}

export const TIPOS_CARTA = [
  { id: "mudanca", label: "Carta de Mudança" },
  { id: "recomendacao", label: "Carta de Recomendação" },
] as const;
export type TipoCarta = (typeof TIPOS_CARTA)[number]["id"];
export const CARTA_LABEL: Record<string, string> = { mudanca: "Carta de Mudança", recomendacao: "Carta de Recomendação" };

/** Preenche os campos [entre colchetes] do modelo. Rótulos sem valor (ex.: "Motivo:" vazio) são removidos; nunca sobra "—". */
export function preencherModeloCarta(modelo: string, dados: Record<string, string>) {
  const norm = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k.toLowerCase(), v ?? ""]));
  return modelo
    .split("\n")
    .map((l) => l.replace(/\[([^\]]+)\]/g, (_, c: string) => norm[c.trim().toLowerCase()] ?? ""))
    .map((l) => l.replace(/\s+([,.;:])/g, "$1"))
    .filter((l) => {
      const t = l.trim();
      if (!t) return true;
      if (/^[A-Za-zÀ-ÿ() ]+:\s*[,.]?\s*$/.test(t)) return false;
      if (/^À Igreja\s*,?\s*(em\s*)?[,.]?\s*$/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function mascararCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function cpfValido(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dig = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return dig(9) === Number(d[9]) && dig(10) === Number(d[10]);
}
