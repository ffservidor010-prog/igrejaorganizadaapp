import { describe, expect, it } from "vitest";
import { escalaMensagem, gerarTextoAta, monthRange, numeroPorExtenso, phoneToWa, waLink } from "./igreja";

describe("WhatsApp", () => {
  it("abre no número com DDD e código do Brasil", () => {
    expect(phoneToWa("(96) 99123-4567")).toBe("5596991234567");
    expect(phoneToWa("+55 96 99123-4567")).toBe("5596991234567");
  });
  it("monta a mensagem da escala exatamente como pedido", () => {
    expect(escalaMensagem("Ana Souza", "Bateria", "2026-11-01")).toBe(
      "Oi Ana! Tudo bem? Você está escalado(a) para Bateria no culto de 01/11/2026. Pode confirmar?",
    );
    expect(waLink("96991234567", "oi")).toBe("https://wa.me/5596991234567?text=oi");
  });
});

describe("Ata mensal", () => {
  it("escreve números por extenso", () => {
    expect(numeroPorExtenso(2026)).toBe("dois mil e vinte e seis");
    expect(numeroPorExtenso(31)).toBe("trinta e um");
  });
  it("inclui cultos, eventos, novos membros e assinaturas", () => {
    const t = gerarTextoAta({
      igreja: "Igreja Teste", mes: 10, ano: 2026, dataReuniao: "2026-10-30", horario: "19h", local: "Templo Sede",
      presidente: "Pr. João", secretario: "Maria", pauta: "", presentes: ["João", "Maria"], decisoes: "",
      escalas: [{ data: "2026-10-04", tipo_culto: "Domingo Noite", funcao: "Som", nome: "Ana", confirmado: true }],
      eventos: [{ titulo: "Santa Ceia", data: "2026-10-11", horario: "18h", local: "Templo", descricao: "" }],
      novosMembros: ["Carlos"],
    });
    expect(t).toContain("Aos trinta dias do mês de outubro do ano de dois mil e vinte e seis");
    expect(t).toContain("Som: Ana");
    expect(t).toContain("Santa Ceia");
    expect(t).toContain("Carlos");
    expect(t).toContain("Presidente");
    expect(t).toContain("Secretário(a)");
  });
  it("calcula o último dia do mês", () => {
    expect(monthRange(2026, 2).fim).toBe("2026-02-28");
  });
});

import { cpfValido, mascararCpf } from "./igreja";
describe("CPF", () => {
  it("aplica a máscara 000.000.000-00", () => { expect(mascararCpf("52998224725")).toBe("529.982.247-25"); });
  it("valida dígitos", () => { expect(cpfValido("529.982.247-25")).toBe(true); expect(cpfValido("111.111.111-11")).toBe(false); expect(cpfValido("529.982.247-24")).toBe(false); });
});
