import { describe, expect, it } from "vitest";
import { assignSchedule, birthdaysFromPeople, birthdaysInMonth, localDateKey, servicesOnDate } from "./church-planning";

describe("Aniversários automáticos", () => {
  it("inclui a pessoa no mês do nascimento, mesmo já cadastrada", () => {
    const list = birthdaysFromPeople([], [{ id: "1", nome: "Ana", telefone: "96", nascimento: "1990-03-12" }], []);
    expect(birthdaysInMonth(list, 3).map((p) => p.nome)).toEqual(["Ana"]);
    expect(birthdaysInMonth(list, 10)).toEqual([]);
  });
  it("reflete edição e exclusão sem deixar aniversário antigo", () => {
    const list = birthdaysFromPeople([], [{ id: "1", nome: "Ana", telefone: "", nascimento: "1990-04-12" }], []);
    expect(birthdaysInMonth(list, 3)).toEqual([]);
    expect(birthdaysInMonth(list, 4)).toHaveLength(1);
    expect(birthdaysFromPeople([], [], [])).toEqual([]);
  });
  it("inclui obreiros com nascimento e não duplica cadastro manual equivalente", () => {
    const person = { id: "1", nome: "Ana", telefone: "", nascimento: "1990-03-12" };
    expect(birthdaysFromPeople([{ id: "2", nome: "Ana", telefone: "", data: "1990-03-12" }], [person], [person])).toHaveLength(1);
    expect(birthdaysFromPeople([], [], [person])[0]?.origem).toBe("Obreiro");
  });
});

describe("Escalas mensais", () => {
  it("mantém responsáveis independentes por data, mês e culto", () => {
    let list = assignSchedule({}, "2026-10-28", "qua", "Porteiros", "Ana");
    list = assignSchedule(list, "2026-11-04", "qua", "Porteiros", "José");
    list = assignSchedule(list, "2026-11-01", "dom1", "Porteiros", "Ana");
    list = assignSchedule(list, "2026-11-01", "dom2", "Porteiros", "José");
    expect(list["2026-10-28:qua"]?.Porteiros).toBe("Ana");
    expect(list["2026-11-04:qua"]?.Porteiros).toBe("José");
    expect(list["2026-11-01:dom1"]?.Porteiros).toBe("Ana");
    expect(list["2026-11-01:dom2"]?.Porteiros).toBe("José");
  });
  it("mostra os cultos de acordo com o dia da semana e data local", () => {
    expect(servicesOnDate(new Date(2026, 9, 28))).toEqual(["qua"]);
    expect(servicesOnDate(new Date(2026, 10, 1))).toEqual(["dom1", "dom2"]);
    expect(servicesOnDate(new Date(2026, 9, 29))).toEqual([]);
    expect(localDateKey(new Date(2026, 9, 28))).toBe("2026-10-28");
  });
});