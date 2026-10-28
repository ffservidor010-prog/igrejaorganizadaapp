import { useEffect, useState, type ReactNode } from "react";
import {
  Home, Users, UserCog, CalendarDays, Cake, Megaphone, PartyPopper, LogOut, Plus, Pencil, Trash2, Phone, Save, MessageCircle, MapPin, Clock, X, Search, ChevronLeft, ChevronRight, Copy, HandCoins, Gift,
} from "lucide-react";
import icon from "@/assets/church-icon.png";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { entriesInMonth, sumValues, totalsByPerson, type Entrada } from "@/lib/church-planning";
import { assignSchedule, birthdaysFromPeople, birthdaysInMonth, localDateKey, servicesOnDate } from "@/lib/church-planning";

/* ---------- storage ---------- */
function useStored<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* cheio */ } }, [key, v]);
  return [v, setV] as const;
}
const uid = () => Math.random().toString(36).slice(2, 10);

type User = { id: string; nome: string; email: string; senha: string; telefone: string; cargo: string };
type Obreiro = { id: string; nome: string; cargo: string; telefone: string; foto?: string; nascimento?: string };
type Aniv = { id: string; nome: string; data: string; telefone: string };
type Aviso = { id: string; texto: string; data: string };
type Evento = { id: string; nome: string; tipo: string; data: string; hora: string; local: string };
type Membro = { id: string; nome: string; telefone: string; nascimento: string; endereco: string; status: "Ativo" | "Inativo"; obs: string; foto?: string };
type Escala = Record<string, Record<string, string>>;

const CULTOS = [
  { id: "ter", dia: "Terça", hora: "09h às 11h", nome: "Consagração" },
  { id: "qua", dia: "Quarta", hora: "19h", nome: "Culto de Ensino" },
  { id: "sex", dia: "Sexta", hora: "19h", nome: "Culto de Libertação" },
  { id: "dom1", dia: "Domingo", hora: "09h", nome: "EBD" },
  { id: "dom2", dia: "Domingo", hora: "18h", nome: "Culto de Louvor e Adoração" },
];
const EQUIPES = ["Porteiros", "Mídia", "Tocadores / Louvor", "Mesa / Som"];
const TIPOS = ["Festividade", "Congresso", "Aniversário da Igreja", "Batismo", "Santa Ceia", "Outro"];
const fmtData = (d: string) => (d ? d.split("-").reverse().join("/") : "");

/* ---------- ui bits ---------- */
const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
function Btn({ children, variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "success" }) {
  const v = {
    primary: "bg-hero text-primary-foreground shadow-soft",
    ghost: "bg-secondary text-secondary-foreground",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success text-success-foreground shadow-soft",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${v} ${className}`}>{children}</button>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>;
}
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-card p-4 shadow-soft ${className}`}>{children}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Header({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-primary">{title}</h2>{action}</div>;
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

/* ---------- auth ---------- */
function Auth({ onLogin }: { onLogin: (u: User) => void }) {
  const [users, setUsers] = useStored<User[]>("io_users", []);
  const [mode, setMode] = useState<"login" | "cadastro">("login");
  const [f, setF] = useState({ nome: "", email: "", senha: "", telefone: "", cargo: "Membro" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const email = f.email.trim().toLowerCase();
    if (mode === "login") {
      const u = users.find((x) => x.email === email && x.senha === f.senha);
      if (!u) return setErr("Email ou senha incorretos.");
      onLogin(u);
    } else {
      if (!f.nome || !email || f.senha.length < 4) return setErr("Preencha nome, email e senha (mín. 4 caracteres).");
      if (users.some((x) => x.email === email)) return setErr("Este email já está cadastrado.");
      const u = { ...f, email, id: uid() };
      setUsers([...users, u]); onLogin(u);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-hero px-5 py-10">
      <img src={icon} alt="Igreja" width={96} height={96} className="mb-4 h-24 w-24 rounded-3xl shadow-soft" />
      <h1 className="text-2xl font-bold text-primary-foreground">Igreja Oiapoque</h1>
      <p className="mb-6 text-sm text-primary-foreground/80">Administração interna</p>
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-lg font-bold">{mode === "login" ? "Entrar" : "Criar Conta"}</h2>
        {mode === "cadastro" && <Field label="Nome"><input className={inputCls} value={f.nome} onChange={set("nome")} /></Field>}
        <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={set("email")} /></Field>
        <Field label="Senha"><input type="password" className={inputCls} value={f.senha} onChange={set("senha")} /></Field>
        {mode === "cadastro" && (
          <>
            <Field label="Telefone"><input type="tel" className={inputCls} value={f.telefone} onChange={set("telefone")} /></Field>
            <Field label="Cargo">
              <select className={inputCls} value={f.cargo} onChange={set("cargo")}>
                <option>Pastor</option><option>Obreiro</option><option>Membro</option>
              </select>
            </Field>
          </>
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Btn type="submit" className="w-full">{mode === "login" ? "Entrar" : "Criar Conta"}</Btn>
        <button type="button" onClick={() => { setMode(mode === "login" ? "cadastro" : "login"); setErr(""); }} className="w-full text-sm font-semibold text-primary">
          {mode === "login" ? "Não tem conta? Criar Conta" : "Já tenho conta. Entrar"}
        </button>
      </form>
    </div>
  );
}

/* ---------- abas ---------- */
function Inicio({ user }: { user: User }) {
  return (
    <div>
      <Card className="mb-5 bg-hero text-primary-foreground">
        <p className="text-sm opacity-80">Bem-vindo,</p>
        <p className="text-2xl font-bold">{user.nome}</p>
        <p className="mt-1 text-xs opacity-80">{user.cargo}</p>
      </Card>
      <Header title="Cultos da Semana" />
      <div className="space-y-3">
        {CULTOS.map((c) => (
          <Card key={c.id} className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <span className="text-[10px] font-bold uppercase">{c.dia.slice(0, 3)}</span>
              <span className="text-xs font-bold">{c.hora.split(" ")[0]}</span>
            </div>
            <div>
              <p className="font-bold">{c.nome}</p>
              <p className="text-sm text-muted-foreground">{c.dia} · {c.hora}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function resizeImage(file: File): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = 200, c = document.createElement("canvas"); c.width = s; c.height = s;
        const ctx = c.getContext("2d")!; const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}

function Obreiros({ list, setList }: { list: Obreiro[]; setList: (l: Obreiro[]) => void }) {
  const [edit, setEdit] = useState<Obreiro | null>(null);
  const save = () => {
    if (!edit?.nome) return;
    setList(list.some((o) => o.id === edit.id) ? list.map((o) => (o.id === edit.id ? edit : o)) : [...list, edit]);
    setEdit(null);
  };
  return (
    <div>
      <Header title="Obreiros" action={<Btn onClick={() => setEdit({ id: uid(), nome: "", cargo: "Obreiro", telefone: "", nascimento: "" })}><Plus className="h-4 w-4" />Novo</Btn>} />
      <div className="space-y-3">
        {list.length === 0 && <Empty text="Nenhum obreiro cadastrado." />}
        {list.map((o) => (
          <Card key={o.id} className="flex items-center gap-3">
            {o.foto ? <img src={o.foto} alt={o.nome} className="h-14 w-14 rounded-full object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">{o.nome[0]}</div>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{o.nome}</p>
              <p className="text-sm text-primary">{o.cargo}</p>
              {o.telefone && <a href={`tel:${o.telefone}`} className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{o.telefone}</a>}
            </div>
            <button onClick={() => setEdit(o)} aria-label="Editar" className="rounded-lg bg-secondary p-2 text-secondary-foreground"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => confirm(`Excluir ${o.nome}?`) && setList(list.filter((x) => x.id !== o.id))} aria-label="Excluir" className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </Card>
        ))}
      </div>
      {edit && (
        <Modal title={list.some((o) => o.id === edit.id) ? "Editar obreiro" : "Novo obreiro"} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {edit.foto ? <img src={edit.foto} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-secondary" />}
              <label className="cursor-pointer text-sm font-semibold text-primary">Escolher foto
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setEdit({ ...edit, foto: await resizeImage(f) }); }} />
              </label>
            </div>
            <Field label="Nome"><input className={inputCls} value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Field>
            <Field label="Nascimento"><input type="date" className={inputCls} value={edit.nascimento ?? ""} onChange={(e) => setEdit({ ...edit, nascimento: e.target.value })} /></Field>
            <Field label="Cargo"><input className={inputCls} value={edit.cargo} onChange={(e) => setEdit({ ...edit, cargo: e.target.value })} placeholder="Diácono, Presbítero..." /></Field>
            <Field label="Telefone"><input type="tel" className={inputCls} value={edit.telefone} onChange={(e) => setEdit({ ...edit, telefone: e.target.value })} /></Field>
            <Btn className="w-full" onClick={save}><Save className="h-4 w-4" />Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Membros({ list, setList }: { list: Membro[]; setList: (l: Membro[]) => void }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "Ativo" | "Inativo">("todos");
  const [edit, setEdit] = useState<Membro | null>(null);
  const q = busca.trim().toLowerCase();
  const visiveis = list
    .filter((m) => filtro === "todos" || m.status === filtro)
    .filter((m) => !q || m.nome.toLowerCase().includes(q) || m.telefone.includes(q))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const ativos = list.filter((m) => m.status === "Ativo").length;
  const salvar = () => {
    if (!edit?.nome.trim()) return;
    const m: Membro = { ...edit, nome: edit.nome.trim() };
    setList(list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]);
    setEdit(null);
  };
  return (
    <div>
      <Header title="Membros" action={<Btn onClick={() => setEdit({ id: uid(), nome: "", telefone: "", nascimento: "", endereco: "", status: "Ativo", obs: "" })}><Plus className="h-4 w-4" />Novo</Btn>} />
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Buscar por nome ou telefone..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["todos", "Ativo", "Inativo"] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${filtro === f ? "bg-hero text-primary-foreground shadow-soft" : "bg-secondary text-secondary-foreground"}`}>
              {f === "todos" ? "Todos" : f === "Ativo" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-muted-foreground">{list.length} membro(s) · {ativos} ativo(s)</p>
      </div>
      <div className="space-y-3">
        {visiveis.length === 0 && <Empty text={list.length === 0 ? "Nenhum membro cadastrado." : "Nenhum membro encontrado."} />}
        {visiveis.map((m) => (
          <Card key={m.id} className="flex items-center gap-3">
            {m.foto ? <img src={m.foto} alt={m.nome} className="h-14 w-14 rounded-full object-cover" />
              : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">{m.nome[0]}</div>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{m.nome}</p>
              {m.telefone ? <a href={`tel:${m.telefone}`} className="flex items-center gap-1 text-xs text-primary"><Phone className="h-3 w-3" />{m.telefone}</a>
                : <p className="text-xs text-muted-foreground">Sem telefone</p>}
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {m.nascimento && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Cake className="h-3 w-3" />{fmtData(m.nascimento)}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.status === "Ativo" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}>{m.status}</span>
              </p>
            </div>
            {m.telefone && <a href={`https://wa.me/55${m.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${m.nome}!`)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp de ${m.nome}`} className="rounded-lg bg-success/10 p-2 text-success"><MessageCircle className="h-4 w-4" /></a>}
            <button onClick={() => setEdit(m)} aria-label="Editar" className="rounded-lg bg-secondary p-2 text-secondary-foreground"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => confirm(`Excluir ${m.nome}?`) && setList(list.filter((x) => x.id !== m.id))} aria-label="Excluir" className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </Card>
        ))}
      </div>
      {edit && (
        <Modal title={list.some((m) => m.id === edit.id) ? "Editar membro" : "Novo membro"} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {edit.foto ? <img src={edit.foto} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-secondary" />}
              <label className="cursor-pointer text-sm font-semibold text-primary">Escolher foto
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setEdit({ ...edit, foto: await resizeImage(f) }); }} />
              </label>
            </div>
            <Field label="Nome"><input className={inputCls} value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Field>
            <Field label="Telefone"><input type="tel" className={inputCls} value={edit.telefone} onChange={(e) => setEdit({ ...edit, telefone: e.target.value })} placeholder="(96) 9..." /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nascimento"><input type="date" className={inputCls} value={edit.nascimento} onChange={(e) => setEdit({ ...edit, nascimento: e.target.value })} /></Field>
              <Field label="Situação">
                <select className={inputCls} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as Membro["status"] })}>
                  <option>Ativo</option><option>Inativo</option>
                </select>
              </Field>
            </div>
            <Field label="Endereço"><input className={inputCls} value={edit.endereco} onChange={(e) => setEdit({ ...edit, endereco: e.target.value })} placeholder="Rua, nº, bairro" /></Field>
            <Field label="Observação"><textarea className={`${inputCls} min-h-20`} value={edit.obs} onChange={(e) => setEdit({ ...edit, obs: e.target.value })} placeholder="Ministério, anotações..." /></Field>
            <Btn className="w-full" disabled={!edit.nome.trim()} onClick={salvar}><Save className="h-4 w-4" />Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Escalas({ obreiros }: { obreiros: Obreiro[] }) {
  const [legacy] = useStored<Escala>("io_escala", {});
  const [saved, setSaved] = useStored<Escala>("io_escalas_datas", {});
  const [draft, setDraft] = useState<Escala>(saved);
  const [selected, setSelected] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [ok, setOk] = useState(false);
  const dateKey = localDateKey(selected);
  const cultos = CULTOS.filter((c) => servicesOnDate(selected).includes(c.id));
  const marked = Object.entries(draft).filter(([, teams]) => Object.values(teams).some(Boolean))
    .map(([key]) => new Date(`${key.split(":")[0]}T12:00:00`));
  const change = (c: string, eq: string, v: string) => {
    setOk(false); setDraft((current) => assignSchedule(current, dateKey, c, eq, v));
  };
  return (
    <div>
      <Header title="Escalas do mês" action={<Btn variant={ok ? "success" : "primary"} onClick={() => { setSaved(draft); setOk(true); }}><Save className="h-4 w-4" />{ok ? "Salvo!" : "Salvar"}</Btn>} />
      <Calendar mode="single" locale={ptBR} selected={selected} month={month}
        onMonthChange={(next) => { setMonth(next); setSelected(new Date(next.getFullYear(), next.getMonth(), 1)); }}
        onSelect={(date) => { if (date) { setSelected(date); setMonth(date); } }}
        className="mb-4 w-full rounded-lg border bg-card [--cell-size:2.5rem]"
        modifiers={{ escalado: marked }} modifiersClassNames={{ escalado: "border-b-2 border-success" }} />
      <p className="mb-3 text-xs font-semibold text-success">{marked.filter((d) => d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()).map(localDateKey).filter((d, i, all) => all.indexOf(d) === i).length} dia(s) com escala no mês</p>
      <h3 className="mb-3 font-bold capitalize">{selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</h3>
      {cultos.length === 0 && <Empty text="Nenhum culto previsto para este dia." />}
      <div className="space-y-4">
        {cultos.map((c) => (
          <Card key={`${dateKey}:${c.id}`}>
            <p className="font-bold">{c.nome}</p>
            <p className="mb-3 text-sm text-primary">{c.hora}</p>
            {Object.values(legacy[c.id] ?? {}).some(Boolean) && <Btn variant="ghost" className="mb-3" onClick={() => { setOk(false); setDraft((current) => ({ ...current, [`${dateKey}:${c.id}`]: { ...legacy[c.id] } })); }}><Copy className="h-4 w-4" />Copiar escala antiga</Btn>}
            <div className="grid gap-2">
              {EQUIPES.map((eq) => (
                <Field key={eq} label={eq}>
                  <select aria-label={eq} className={inputCls} value={draft[`${dateKey}:${c.id}`]?.[eq] ?? ""} onChange={(e) => change(c.id, eq, e.target.value)}>
                    <option value="">— escolher —</option>
                    {draft[`${dateKey}:${c.id}`]?.[eq] && !obreiros.some((o) => o.nome === draft[`${dateKey}:${c.id}`]?.[eq]) && <option>{draft[`${dateKey}:${c.id}`]?.[eq]}</option>}
                    {obreiros.map((o) => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Aniversariantes({ membros, obreiros }: { membros: Membro[]; obreiros: Obreiro[] }) {
  const [list, setList] = useStored<Aniv[]>("io_aniv", []);
  const [novo, setNovo] = useState<Aniv | null>(null);
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const dia = now.getDate();
  const combined = birthdaysFromPeople(list, membros, obreiros);
  const md = (d: string) => { const p = d.split("-").map(Number); return { m: p[1] ?? 0, dd: p[2] ?? 0 }; };
  const doMes = birthdaysInMonth(combined, mes);
  const hoje = birthdaysInMonth(combined, now.getMonth() + 1).filter((a) => md(a.data).dd === dia);
  return (
    <div>
      <Header title="Aniversariantes" action={<Btn onClick={() => setNovo({ id: uid(), nome: "", data: "", telefone: "" })}><Plus className="h-4 w-4" />Novo</Btn>} />
      {hoje.map((a) => (
        <Card key={a.id} className="mb-3 border-gold bg-hero text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-wide">🎉 Aniversário hoje!</p>
          <p className="text-xl font-bold">{a.nome}</p>
          {a.telefone && <a href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Feliz aniversário, ${a.nome}! Deus te abençoe!`)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"><MessageCircle className="h-4 w-4" />Dar parabéns</a>}
        </Card>
      ))}
      <div className="mb-4 flex items-center gap-2">
        <Btn variant="ghost" className="shrink-0 px-2" aria-label="Mês anterior" onClick={() => setMes(mes === 1 ? 12 : mes - 1)}><ChevronLeft className="h-5 w-5" /></Btn>
        <select aria-label="Mês dos aniversários" className={`${inputCls} capitalize`} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2026, i, 1).toLocaleDateString("pt-BR", { month: "long" })}</option>)}
        </select>
        <Btn variant="ghost" className="shrink-0 px-2" aria-label="Próximo mês" onClick={() => setMes(mes === 12 ? 1 : mes + 1)}><ChevronRight className="h-5 w-5" /></Btn>
      </div>
      <div className="space-y-2">
        {doMes.length === 0 && <Empty text="Nenhum aniversariante neste mês." />}
        {doMes.map((a) => (
          <Card key={a.id} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary font-bold text-secondary-foreground">{String(md(a.data).dd).padStart(2, "0")}</div>
            <div className="flex-1">
              <p className="font-bold">{a.nome}</p>
              <p className="text-xs text-muted-foreground">{fmtData(a.data)} {a.telefone && `· ${a.telefone}`}</p>
              {a.origem && <span className="text-xs text-primary">{a.origem}</span>}
            </div>
            {!a.origem && <Btn variant="danger" className="px-2" onClick={() => confirm(`Excluir ${a.nome}?`) && setList(list.filter((x) => x.id !== a.id))} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Btn>}
          </Card>
        ))}
      </div>
      {combined.length > doMes.length && <p className="mt-4 text-center text-xs text-muted-foreground">{combined.length - doMes.length} aniversariante(s) em outros meses.</p>}
      {novo && (
        <Modal title="Novo aniversariante" onClose={() => setNovo(null)}>
          <div className="space-y-3">
            <Field label="Nome"><input className={inputCls} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></Field>
            <Field label="Data de nascimento"><input type="date" className={inputCls} value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} /></Field>
            <Field label="Telefone"><input type="tel" className={inputCls} value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} /></Field>
            <Btn className="w-full" disabled={!novo.nome || !novo.data} onClick={() => { setList([...list, novo]); setNovo(null); }}><Save className="h-4 w-4" />Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Avisos() {
  const [list, setList] = useStored<Aviso[]>("io_avisos", []);
  const [texto, setTexto] = useState("");
  const enviar = () => {
    if (!texto.trim()) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
    setList([{ id: uid(), texto, data: new Date().toISOString() }, ...list]);
    setTexto("");
  };
  return (
    <div>
      <Header title="Transmissão / Avisos" />
      <Card className="mb-5 space-y-3">
        <textarea className={`${inputCls} min-h-28`} placeholder="Escreva o aviso para o grupo..." value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Btn variant="success" className="w-full py-4 text-base" onClick={enviar} disabled={!texto.trim()}><MessageCircle className="h-5 w-5" />Enviar Aviso no WhatsApp</Btn>
        <p className="text-xs text-muted-foreground">O WhatsApp abrirá para você escolher o grupo.</p>
      </Card>
      <p className="mb-2 text-sm font-semibold text-muted-foreground">Avisos enviados</p>
      <div className="space-y-2">
        {list.length === 0 && <Empty text="Nenhum aviso enviado ainda." />}
        {list.map((a) => (
          <Card key={a.id}>
            <div className="flex justify-between gap-2">
              <p className="text-xs font-semibold text-primary">{new Date(a.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              <button onClick={() => setList(list.filter((x) => x.id !== a.id))} aria-label="Excluir" className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{a.texto}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Eventos() {
  const [list, setList] = useStored<Evento[]>("io_eventos", []);
  const [novo, setNovo] = useState<Evento | null>(null);
  const sorted = [...list].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return (
    <div>
      <Header title="Eventos e Festividades" action={<Btn onClick={() => setNovo({ id: uid(), nome: "", tipo: "Festividade", data: "", hora: "19:00", local: "Igreja de Oiapoque" })}><Plus className="h-4 w-4" />Novo</Btn>} />
      <div className="space-y-3">
        {sorted.length === 0 && <Empty text="Nenhum evento criado." />}
        {sorted.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">{e.tipo}</span>
                <p className="mt-1 text-lg font-bold">{e.nome}</p>
              </div>
              <button onClick={() => confirm(`Excluir ${e.nome}?`) && setList(list.filter((x) => x.id !== e.id))} aria-label="Excluir" className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{fmtData(e.data)}</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{e.hora}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{e.local}</p>
            </div>
          </Card>
        ))}
      </div>
      {novo && (
        <Modal title="Novo evento" onClose={() => setNovo(null)}>
          <div className="space-y-3">
            <Field label="Tipo"><select className={inputCls} value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value, nome: novo.nome || e.target.value })}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Nome"><input className={inputCls} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Data"><input type="date" className={inputCls} value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} /></Field>
              <Field label="Hora"><input type="time" className={inputCls} value={novo.hora} onChange={(e) => setNovo({ ...novo, hora: e.target.value })} /></Field>
            </div>
            <Field label="Local"><input className={inputCls} value={novo.local} onChange={(e) => setNovo({ ...novo, local: e.target.value })} /></Field>
            <Btn className="w-full" disabled={!novo.nome || !novo.data} onClick={() => { setList([...list, novo]); setNovo(null); }}><Save className="h-4 w-4" />Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function useMes() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const move = (d: number) => setYm(({ y, m }) => { const n = m + d; return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n }; });
  const bar = (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-secondary p-2">
      <button onClick={() => move(-1)} aria-label="Mês anterior" className="rounded-lg p-2"><ChevronLeft className="h-5 w-5" /></button>
      <p className="font-bold text-secondary-foreground">{MESES[ym.m - 1]} {ym.y}</p>
      <button onClick={() => move(1)} aria-label="Próximo mês" className="rounded-lg p-2"><ChevronRight className="h-5 w-5" /></button>
    </div>
  );
  return { ...ym, bar };
}

function Financeiro({ tipo, membros }: { tipo: "dizimo" | "oferta"; membros: Membro[] }) {
  const dz = tipo === "dizimo";
  const [list, setList] = useStored<Entrada[]>(dz ? "io_dizimos" : "io_ofertas", []);
  const { y, m, bar } = useMes();
  const [novo, setNovo] = useState<Entrada | null>(null);
  const doMes = entriesInMonth(list, y, m);
  const total = sumValues(doMes);
  const del = (e: Entrada) => confirm("Excluir este lançamento?") && setList(list.filter((x) => x.id !== e.id));
  const linha = (e: Entrada) => (
    <div key={e.id} className="flex items-center justify-between gap-2 border-t py-2 text-sm first:border-t-0">
      <span className="text-muted-foreground">{fmtData(e.data)}{e.obs ? ` · ${e.obs}` : ""}</span>
      <span className="flex items-center gap-2 font-semibold">{brl(e.valor)}<button onClick={() => del(e)} aria-label="Excluir" className="text-destructive"><Trash2 className="h-4 w-4" /></button></span>
    </div>
  );
  return (
    <div>
      <Header title={dz ? "Dizimistas" : "Ofertas"} action={<Btn onClick={() => setNovo({ id: uid(), nome: "", valor: 0, data: localDateKey(new Date()), obs: "" })}><Plus className="h-4 w-4" />Lançar</Btn>} />
      {bar}
      <Card className="mb-4 bg-hero text-primary-foreground">
        <p className="text-sm opacity-80">Total de {MESES[m - 1]}</p>
        <p className="text-3xl font-bold">{brl(total)}</p>
        <p className="text-xs opacity-80">{dz ? `${totalsByPerson(doMes).length} dizimista(s)` : `${doMes.length} oferta(s)`}</p>
      </Card>
      <div className="space-y-3">
        {doMes.length === 0 && <Empty text="Nenhum lançamento neste mês." />}
        {dz ? totalsByPerson(doMes).map((p) => (
          <Card key={p.nome}>
            <div className="mb-1 flex justify-between font-bold"><span>{p.nome}</span><span className="text-primary">{brl(p.total)}</span></div>
            {p.itens.map(linha)}
          </Card>
        )) : doMes.length > 0 && <Card>{doMes.map(linha)}</Card>}
      </div>
      {novo && (
        <Modal title={dz ? "Lançar dízimo" : "Lançar oferta"} onClose={() => setNovo(null)}>
          <div className="space-y-3">
            {dz && <Field label="Dizimista"><input list="lista-membros" className={inputCls} value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /><datalist id="lista-membros">{membros.map((x) => <option key={x.id} value={x.nome} />)}</datalist></Field>}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Valor (R$)"><input type="number" inputMode="decimal" min="0" step="0.01" className={inputCls} value={novo.valor || ""} onChange={(e) => setNovo({ ...novo, valor: Number(e.target.value) })} /></Field>
              <Field label="Data"><input type="date" className={inputCls} value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} /></Field>
            </div>
            <Field label={dz ? "Observação" : "Culto / Observação"}><input className={inputCls} value={novo.obs} onChange={(e) => setNovo({ ...novo, obs: e.target.value })} /></Field>
            <Btn className="w-full" disabled={!novo.valor || !novo.data || (dz && !novo.nome?.trim())} onClick={() => { setList([...list, { ...novo, nome: (novo.nome ?? "").trim() }]); setNovo(null); }}><Save className="h-4 w-4" />Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- shell ---------- */
const TABS = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "membros", label: "Membros", icon: Users },
  { id: "obreiros", label: "Obreiros", icon: UserCog },
  { id: "escalas", label: "Escalas", icon: CalendarDays },
  { id: "aniv", label: "Aniver.", icon: Cake },
  { id: "dizimos", label: "Dízimos", icon: HandCoins },
  { id: "ofertas", label: "Ofertas", icon: Gift },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "eventos", label: "Eventos", icon: PartyPopper },
  { id: "sair", label: "Sair", icon: LogOut },
] as const;

export function ChurchApp() {
  const [user, setUser] = useStored<User | null>("io_session", null);
  const [obreiros, setObreiros] = useStored<Obreiro[]>("io_obreiros", []);
  const [membros, setMembros] = useStored<Membro[]>("io_membros", []);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("inicio");

  if (!user) return <Auth onLogin={(u) => { setUser(u); setTab("inicio"); }} />;

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 bg-hero px-4 py-3 text-primary-foreground shadow-soft">
        <img src={icon} alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
        <div className="leading-tight">
          <p className="font-display font-bold">Igreja Oiapoque</p>
          <p className="text-xs opacity-80">Bem-vindo, {user.nome}</p>
        </div>
      </header>
      <main className="p-4">
        {tab === "inicio" && <Inicio user={user} />}
        {tab === "membros" && <Membros list={membros} setList={setMembros} />}
        {tab === "obreiros" && <Obreiros list={obreiros} setList={setObreiros} />}
        {tab === "escalas" && <Escalas obreiros={obreiros} />}
        {tab === "aniv" && <Aniversariantes membros={membros} obreiros={obreiros} />}
        {tab === "dizimos" && <Financeiro key="d" tipo="dizimo" membros={membros} />}
        {tab === "ofertas" && <Financeiro key="o" tipo="oferta" membros={membros} />}
        {tab === "avisos" && <Avisos />}
        {tab === "eventos" && <Eventos />}
        {tab === "sair" && (
          <Card className="mt-10 space-y-4 text-center">
            <LogOut className="mx-auto h-10 w-10 text-primary" />
            <p className="font-bold">Deseja sair da sua conta?</p>
            <Btn variant="danger" className="w-full" onClick={() => setUser(null)}>Sair / Deslogar</Btn>
          </Card>
        )}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex min-w-[64px] flex-1 shrink-0 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
              <t.icon className="h-5 w-5" />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
