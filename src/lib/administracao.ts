import { dataBR, monthRange } from "./igreja";

export const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
export function dataDoCulto(c: { tipo: string; dia_semana: number | null; data_unica: string | null }, base: string) {
  if (c.tipo === "unico") return c.data_unica ?? base;
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + ((c.dia_semana ?? d.getDay()) - d.getDay() + 7) % 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
type Pessoa = { id: string; nome: string };
type Dizimo = { id: string; nome?: string; membro_id?: string | null; valor: number; data: string };
export function relatorioDizimos(membros: Pessoa[], rows: Dizimo[], ano: number, mes: number) {
  const { ini, fim } = monthRange(ano, mes);
  const mensal = rows.filter(r => r.data >= ini && r.data <= fim);
  const normal = (s: string) => s.trim().toLocaleLowerCase("pt-BR");
  const pessoas = membros.map(m => {
    const unico = membros.filter(p => normal(p.nome) === normal(m.nome)).length === 1;
    const itens = mensal.filter(r => r.membro_id ? r.membro_id === m.id : unico && normal(r.nome ?? "") === normal(m.nome));
    return { ...m, itens, total: itens.reduce((s, r) => s + Number(r.valor), 0), contribuiu: itens.length > 0 };
  });
  const deram = pessoas.filter(p => p.contribuiu).length;
  return { pessoas, deram, pendentes: pessoas.length - deram, total: mensal.reduce((s, r) => s + Number(r.valor), 0) };
}
export function mensagemEscala(data: string, culto: string, itens: { funcao: string; nome: string }[], horario = "") {
  return `Escala — ${culto}\n${dataBR(data)}${horario ? ` às ${horario}` : ""}\n\n${itens.map(i => `${i.funcao}: ${i.nome}`).join("\n")}\n\nPor favor, confirmem sua participação. Deus abençoe!`;
}
export function acessoAdministracao(roles: string[]) {
  const admin = roles.includes("admin");
  return { cultos: admin, visitantes: admin || roles.includes("pastor"), setores: admin || roles.includes("pastor"), oracao: admin || roles.includes("pastor"), financeiro: admin };
}