export type Birthday = { id: string; nome: string; data: string; telefone: string; origem?: "Membro" | "Obreiro" };
type Person = { id: string; nome: string; telefone: string; nascimento?: string };
export type Schedule = Record<string, Record<string, string>>;

export function birthdaysFromPeople(manual: Birthday[], members: Person[], workers: Person[]): Birthday[] {
  const people: Birthday[] = [
    ...members.filter((p) => p.nascimento).map((p) => ({ id: `membro:${p.id}`, nome: p.nome, telefone: p.telefone, data: p.nascimento ?? "", origem: "Membro" as const })),
    ...workers.filter((p) => p.nascimento).map((p) => ({ id: `obreiro:${p.id}`, nome: p.nome, telefone: p.telefone, data: p.nascimento ?? "", origem: "Obreiro" as const })),
    ...manual,
  ];
  const seen = new Set<string>();
  return people.filter((p) => {
    const key = `${p.nome.trim().toLocaleLowerCase("pt-BR")}:${p.data.slice(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function birthdaysInMonth(list: Birthday[], month: number) {
  return list.filter((p) => Number(p.data.split("-")[1]) === month)
    .sort((a, b) => Number(a.data.split("-")[2]) - Number(b.data.split("-")[2]));
}

export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function assignSchedule(list: Schedule, date: string, service: string, team: string, person: string): Schedule {
  const key = `${date}:${service}`;
  return { ...list, [key]: { ...list[key], [team]: person } };
}

export function servicesOnDate(date: Date) {
  return ({ 2: ["ter"], 3: ["qua"], 5: ["sex"], 0: ["dom1", "dom2"] } as Record<number, string[]>)[date.getDay()] ?? [];
}