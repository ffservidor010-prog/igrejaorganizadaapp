import { describe, expect, it } from "vitest";
import { acessoAdministracao, dataDoCulto, mensagemEscala, relatorioDizimos } from "./administracao";
describe("Relatório mensal", () => {
  const membros = [{ id: "a", nome: "Ana" }, { id: "b", nome: "Bruno" }];
  it("soma mês escolhido e conta quem deu e quem está pendente", () => {
    const r = relatorioDizimos(membros, [{ id: "1", membro_id: "a", valor: 100, data: "2026-11-01" }, { id: "2", membro_id: "a", valor: 50, data: "2026-11-02" }, { id: "3", membro_id: "b", valor: 80, data: "2026-10-01" }], 2026, 11);
    expect(r.total).toBe(150); expect(r.deram).toBe(1); expect(r.pendentes).toBe(1); expect(r.pessoas[0]?.total).toBe(150); expect(r.pessoas[1]?.contribuiu).toBe(false);
  });
  it("não mistura membros homônimos e preserva lançamento antigo com nome único", () => {
    expect(relatorioDizimos(membros, [{ id: "1", nome: "Ana", valor: 30, data: "2026-11-01" }], 2026, 11).deram).toBe(1);
    expect(relatorioDizimos([{ id: "a", nome: "Ana" }, { id: "b", nome: "Ana" }], [{ id: "1", nome: "Ana", valor: 30, data: "2026-11-01" }], 2026, 11).deram).toBe(0);
  });
});
describe("Cultos e permissões", () => {
  it("culto fixo usa dia escolhido, não apenas quarta/domingo", () => expect(dataDoCulto({ tipo: "semanal", dia_semana: 5, data_unica: null }, "2026-11-02")).toBe("2026-11-06"));
  it("festividade usa data única", () => expect(dataDoCulto({ tipo: "unico", dia_semana: null, data_unica: "2026-12-15" }, "2026-11-02")).toBe("2026-12-15"));
  it("somente ADM gerencia cultos e finanças", () => { expect(acessoAdministracao(["pastor"]).cultos).toBe(false); expect(acessoAdministracao(["admin"]).cultos).toBe(true); expect(acessoAdministracao(["pastor"]).financeiro).toBe(false); });
  it("pastor marca oração; membro não tem acesso ainda", () => { expect(acessoAdministracao(["pastor"]).oracao).toBe(true); expect(acessoAdministracao(["membro"]).oracao).toBe(false); });
  it("compartilha todos os setores e pessoas da escala", () => { const msg = mensagemEscala("2026-11-06", "Libertação", [{ funcao: "Jovens", nome: "Ana" }, { funcao: "Diaconato", nome: "Bruno" }], "19:00"); expect(msg).toContain("Jovens: Ana"); expect(msg).toContain("Diaconato: Bruno"); expect(msg).toContain("06/11/2026 às 19:00"); });
});