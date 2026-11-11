import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";
import {
  ArrowLeft, CalendarDays, Users, PartyPopper, Megaphone, FileText, Cake, HandCoins, Gift, Shield, LogOut,
  Plus, Trash2, Pencil, Eye, MessageCircle, Mail, Download, Check, ChevronLeft, ChevronRight, Search, Sparkles, Save,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import logo from "@/assets/logo.jpg";
import {
  APP_NAME, CARGOS, CARGO_LABEL, FUNCOES, MESES, TIPOS_CULTO, dataBR, escalaMensagem, gerarTextoAta, monthRange, waLink,
  cpfValido, mascararCpf,
} from "@/lib/igreja";
import { birthdaysFromPeople, birthdaysInMonth, localDateKey, sumValues, totalsByPerson } from "@/lib/church-planning";
import { ataDoc, ataPdf, baixar, compartilharPdf } from "@/lib/ata-export";

type Membro = Tables<"membros">;
type Escala = Tables<"escalas">;
type Evento = Tables<"eventos">;
type Ata = Tables<"atas">;
type Screen = "duvidas" | "galeria" | "visitantes" | "oracao" | "home" | "escala" | "membros" | "eventos" | "avisos" | "atas" | "aniv" | "dizimos" | "ofertas" | "admin";
import { Btn, Field, Card, Modal, Empty, WaBtn, Avatar, MonthNav, inputCls, brl, errMsg } from "./igreja-ui";
import { useRows, useSave, useRemove } from "@/lib/administracao-hooks";
import { CultosManager, SetoresManager, VisitantesScreen, OracaoScreen } from "./administracao-screens";
import { dataDoCulto, mensagemEscala, relatorioDizimos } from "@/lib/administracao";
import { MembroArea, Galeria, Duvidas } from "./membro-area";

/* ---------- Login ---------- */
function IgrejaEscolha({ value, onChange }: { value: { tipo: "nova" | "convite"; igreja: string; codigo: string }; onChange: (v: { tipo: "nova" | "convite"; igreja: string; codigo: string }) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {([["nova", "Criar nova igreja"], ["convite", "Entrar com convite"]] as const).map(([t, l]) => (
          <button key={t} type="button" onClick={() => onChange({ ...value, tipo: t })}
            className={`rounded-xl border p-3 text-sm font-semibold ${value.tipo === t ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary"}`}>{l}</button>
        ))}
      </div>
      {value.tipo === "nova"
        ? <Field label="Nome da igreja"><input required className={inputCls} value={value.igreja} onChange={(e) => onChange({ ...value, igreja: e.target.value })} /></Field>
        : <Field label="Código de convite"><input required className={`${inputCls} uppercase tracking-widest`} value={value.codigo} onChange={(e) => onChange({ ...value, codigo: e.target.value.toUpperCase() })} /></Field>}
    </div>
  );
}

async function vincularIgreja(v: { tipo: "nova" | "convite"; igreja: string; codigo: string }) {
  const { error } = v.tipo === "nova"
    ? await supabase.rpc("criar_igreja", { _nome: v.igreja })
    : await supabase.rpc("entrar_igreja", { _codigo: v.codigo });
  if (error) throw error;
}

function Onboarding({ onDone, inicial }: { onDone: () => void; inicial: { tipo: "nova" | "convite"; igreja: string; codigo: string } }) {
  const [v, setV] = useState(inicial);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await vincularIgreja(v); toast.success(v.tipo === "nova" ? "Igreja criada! Você é o ADM." : "Bem-vindo(a) à igreja!"); onDone(); }
    catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <img src={logo} alt={APP_NAME} width={256} height={256} className="h-20 w-20 rounded-3xl shadow-soft" />
      <h2 className="mb-4 mt-3 text-xl font-bold text-primary">Escolha sua igreja</h2>
      <Card className="w-full max-w-sm">
        <form onSubmit={submit} className="space-y-3">
          <IgrejaEscolha value={v} onChange={setV} />
          <Btn disabled={busy} className="w-full">Continuar</Btn>
        </form>
      </Card>
    </div>
  );
}

function Auth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ nome: "", telefone: "", email: "", senha: "" });
  const [ig, setIg] = useState<{ tipo: "nova" | "convite"; igreja: string; codigo: string }>({ tipo: "nova", igreja: "", codigo: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: f.email, password: f.senha,
          options: { emailRedirectTo: window.location.origin, data: { nome: f.nome, telefone: f.telefone, igreja_tipo: ig.tipo, igreja_nome: ig.igreja, igreja_codigo: ig.codigo } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else { try { await vincularIgreja(ig); } catch (err) { toast.error(errMsg(err)); } }
      }
    } catch (err) { toast.error(errMsg(err) === "Invalid login credentials" ? "E-mail ou senha incorretos" : errMsg(err)); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <img src={logo} alt={APP_NAME} width={256} height={256} className="h-28 w-28 rounded-3xl shadow-soft" />
      <h1 className="mt-4 text-3xl font-bold text-primary">{APP_NAME}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Administração da igreja</p>
      <Card className="w-full max-w-sm">
        {sent ? (
          <p className="text-center text-sm">Enviamos um link para <b>{f.email}</b>. Abra seu e-mail, confirme a conta e depois entre aqui.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <>
              <IgrejaEscolha value={ig} onChange={setIg} />
              <Field label="Nome"><input required className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
            <Field label="Telefone com DDD"><input required className={inputCls} inputMode="tel" placeholder="(96) 99999-9999" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Field>
            </>}
            <Field label="E-mail"><input required type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Senha"><input required type="password" minLength={6} className={inputCls} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} /></Field>
            <Btn disabled={busy} className="w-full">{mode === "in" ? "Entrar" : "Criar conta"}</Btn>
            <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-primary">
              {mode === "in" ? "Não tem conta? Criar conta" : "Já tenho conta. Entrar"}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}

/* ---------- Início ---------- */
function Home({ go, nome, igreja, staff, admin }: { go: (s: Screen) => void; nome: string; igreja: string; staff: boolean; admin: boolean }) {
  const main: { id: Screen; label: string; icon: typeof Users }[] = [
    { id: "escala", label: "Escala", icon: CalendarDays },
    { id: "membros", label: "Membros", icon: Users },
    { id: "eventos", label: "Eventos", icon: PartyPopper },
    { id: "avisos", label: "Avisos", icon: Megaphone },
    { id: "atas", label: "Ata Mensal", icon: FileText },
  ];
  const extra: { id: Screen; label: string; icon: typeof Users }[] = ([
    { id: "aniv", label: "Aniversariantes", icon: Cake },
    ...(staff ? [{ id: "visitantes" as Screen, label: "Visitantes", icon: Users }, { id: "oracao" as Screen, label: "Pedidos de Oração", icon: FileText }, { id: "galeria" as Screen, label: "Galeria", icon: PartyPopper }, { id: "duvidas" as Screen, label: "Dúvidas", icon: FileText }] : []),
    { id: "dizimos", label: "Dízimos", icon: HandCoins },
    { id: "ofertas", label: "Ofertas", icon: Gift },
    ...(admin ? [{ id: "admin" as Screen, label: "Admin", icon: Shield }] : []),
  ] as { id: Screen; label: string; icon: typeof Users }[]).filter((b) => admin || (b.id !== "dizimos" && b.id !== "ofertas"));
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-4 text-center">
        <img src={logo} alt={APP_NAME} width={256} height={256} className="h-24 w-24 rounded-3xl shadow-soft" />
        <h1 className="mt-3 text-2xl font-bold text-primary">{igreja || APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">Bem-vindo(a), {nome || "irmão(ã)"}{admin ? " · ADM" : staff ? " · acesso de liderança" : ""}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {main.map((b, i) => (
          <button key={b.id} onClick={() => go(b.id)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-card p-5 shadow-soft active:scale-95 ${i === main.length - 1 ? "col-span-2" : ""}`}>
            <b.icon className="h-8 w-8 text-primary" /><span className="font-semibold">{b.label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {extra.map((b) => (
          <button key={b.id} onClick={() => go(b.id)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-secondary p-3 text-xs active:scale-95">
            <b.icon className="h-5 w-5 text-primary" />{b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Escala ---------- */
function EscalaScreen({ staff, admin }: { staff: boolean; admin: boolean }) {
  const now = new Date();
  const [ym, setYm] = useState({ a: now.getFullYear(), m: now.getMonth() + 1 });
  const { data: escalas = [] } = useRows<Escala>("escalas", "data");
  const { data: membros = [] } = useRows<Membro>("membros", "nome");
  const { data: cultos = [] } = useRows<Tables<"cultos">>("cultos", "nome");
  const { data: setores = [] } = useRows<Tables<"setores">>("setores", "nome");
  const save = useSave("escalas"); const del = useRemove("escalas");
  const [form, setForm] = useState<{ id?: string; data: string; tipo_culto: string; horario: string; funcao: string; membro_id: string; culto_id: string; setor_id: string } | null>(null);
  const byId = useMemo(() => new Map(membros.map((m) => [m.id, m])), [membros]);
  const { ini, fim } = monthRange(ym.a, ym.m);
  const doMes = escalas.filter((e) => e.data >= ini && e.data <= fim);
  const grupos = useMemo(() => {
    const g = new Map<string, Escala[]>();
    for (const e of doMes) { const nomeCulto = cultos.find(c => c.id === e.culto_id)?.nome ?? e.tipo_culto; const k = `${e.data}|${nomeCulto}`; g.set(k, [...(g.get(k) ?? []), e]); }
    return [...g.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [doMes, cultos]);
  const hoje = localDateKey(now);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Escala</h2>
        {staff && <Btn onClick={() => setForm({ data: hoje, tipo_culto: "", horario: "", funcao: setores[0]?.nome ?? "", membro_id: membros.find(m => m.ativo)?.id ?? "", culto_id: "", setor_id: setores[0]?.id ?? "" })}><Plus className="h-4 w-4" />Escalar</Btn>}
      </div>
      <div className="flex flex-wrap gap-2"><CultosManager admin={admin} /><SetoresManager staff={staff} /></div>
      <MonthNav ano={ym.a} mes={ym.m} set={(a, m) => setYm({ a, m })} />
      {!grupos.length && <Empty text="Nenhuma escala neste mês." />}
      {grupos.map(([k, itens]) => {
        const [data, tipo] = k.split("|");
        return (
          <Card key={k} className={(data ?? "") < hoje ? "opacity-70" : ""}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><span className="font-bold text-primary">{dataBR(data ?? "")}</span><span className="break-words text-sm text-muted-foreground">{tipo}</span></div>
            <ul className="space-y-2">
              {itens.map((e) => {
                const m = byId.get(e.membro_id);
                return (
                  <li key={e.id} className="flex items-center gap-3 rounded-xl bg-secondary p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{setores.find(s => s.id === e.setor_id)?.nome ?? e.funcao} · {e.confirmado ? <span className="text-success">confirmado</span> : "aguardando"}</p>
                    </div>
                    {staff && <button aria-label="Confirmar" onClick={() => save.mutate({ id: e.id, values: { confirmado: !e.confirmado } })} className={`rounded-full p-2 ${e.confirmado ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}><Check className="h-4 w-4" /></button>}
                    {staff && <Btn variant="ghost" className="h-8 w-8 shrink-0 p-0" aria-label="Editar escala" onClick={() => { const c = cultos.find(c => c.id === e.culto_id); const [n, h] = (c?.nome ?? e.tipo_culto).split(" · "); setForm({ id: e.id, data: e.data, tipo_culto: n ?? "", horario: c?.horario ?? h ?? "", funcao: e.funcao, membro_id: e.membro_id, culto_id: e.culto_id ?? "", setor_id: e.setor_id ?? "" }); }}><Pencil className="h-4 w-4" /></Btn>}
                    {staff && <button aria-label="Remover" onClick={() => confirm("Remover da escala?") && del.mutate(e.id)} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>}
                    {m && <WaBtn phone={m.telefone} label={m.nome} msg={escalaMensagem(m.nome, setores.find(s => s.id === e.setor_id)?.nome ?? e.funcao, e.data)} />}
                  </li>
                );
              })}
            </ul>
            <Btn variant="whats" className="mt-3 w-full" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(mensagemEscala(data ?? "", tipo ?? "", itens.map(e => ({ funcao: setores.find(s => s.id === e.setor_id)?.nome ?? e.funcao, nome: byId.get(e.membro_id)?.nome ?? "—" })), cultos.find(c => c.id === itens[0]?.culto_id)?.horario ?? ""))}`, "_blank")}><MessageCircle className="h-4 w-4" />Enviar no WhatsApp</Btn>
          </Card>
        );
      })}
      {form && (
        <Modal title="Escalar pessoa" onClose={() => setForm(null)}>
          {!membros.length ? <Empty text="Cadastre membros primeiro." /> : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const { id, horario, ...values } = form; const nomeCulto = values.tipo_culto.split(" · ")[0]!.trim(); save.mutate({ id, values: { ...values, tipo_culto: horario.trim() ? `${nomeCulto} · ${horario.trim()}` : nomeCulto, culto_id: null, setor_id: values.setor_id || null } }, { onSuccess: () => setForm(null) }); }}>
              <Field label="Data do culto"><input type="date" required className={inputCls} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
              <Field label="Culto (digite o nome)"><input required list="cultos-sugestoes" placeholder="Ex.: Culto de Libertação" className={inputCls} value={form.tipo_culto} onChange={e => { const c = cultos.find(c => c.nome === e.target.value); setForm({ ...form, tipo_culto: e.target.value, ...(c ? { horario: c.horario, data: dataDoCulto(c, form.data) } : {}) }); }} /><datalist id="cultos-sugestoes">{cultos.map(c => <option key={c.id} value={c.nome} />)}</datalist></Field>
              <Field label="Horário"><input placeholder="Ex.: 19h" className={inputCls} value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} /></Field>
              <Field label="Setor / Ministério"><select required className={inputCls} value={form.setor_id} onChange={e => { const setor = setores.find(s => s.id === e.target.value); if (setor) setForm({ ...form, setor_id: setor.id, funcao: setor.nome }); }}><option value="">Escolha um setor</option>{setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></Field>
              <Field label="Pessoa"><select required className={inputCls} value={form.membro_id} onChange={(e) => setForm({ ...form, membro_id: e.target.value })}>{membros.filter((m) => m.ativo).map((m) => <option key={m.id} value={m.id}>{m.nome}{m.ministerio ? ` (${m.ministerio})` : ""}</option>)}</select></Field>
              <Btn className="w-full" disabled={save.isPending}><Save className="h-4 w-4" />Salvar escala</Btn>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ---------- Membros ---------- */
async function fotoParaDataUrl(file: File) {
  const img = await createImageBitmap(file);
  const s = 256; const c = document.createElement("canvas"); c.width = s; c.height = s;
  const ctx = c.getContext("2d"); if (!ctx) throw new Error("Não foi possível carregar a foto"); const r = Math.max(s / img.width, s / img.height);
  ctx.drawImage(img, (s - img.width * r) / 2, (s - img.height * r) / 2, img.width * r, img.height * r);
  return c.toDataURL("image/jpeg", 0.8);
}
const membroVazio = { nome: "", cpf: "", email: "", telefone: "", cargo: "membro", ministerio: "", foto: null as string | null, ativo: true, nascimento: "", data_membro: "", batismo_aguas: "", batismo_espirito: "", endereco: "", observacao: "" };

function MembrosScreen({ staff }: { staff: boolean }) {
  const { data: membros = [], isLoading } = useRows<Membro>("membros", "nome");
  const save = useSave("membros"); const del = useRemove("membros");
  const [q, setQ] = useState(""); const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [edit, setEdit] = useState<{ id?: string; v: typeof membroVazio } | null>(null);
  const [ver, setVer] = useState<any>(null);
  const list = membros.filter((m) => (filtro === "todos" || (filtro === "ativos") === m.ativo) && `${m.nome} ${m.telefone} ${m.ministerio}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Membros <span className="text-sm text-muted-foreground">({membros.length})</span></h2>
        {staff && <Btn onClick={() => setEdit({ v: { ...membroVazio } })}><Plus className="h-4 w-4" />Adicionar</Btn>}
      </div>
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${inputCls} pl-9`} placeholder="Buscar nome, telefone ou ministério" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="flex gap-2">{(["ativos", "inativos", "todos"] as const).map((f) => <button key={f} onClick={() => setFiltro(f)} className={`rounded-full px-3 py-1 text-xs capitalize ${filtro === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{f}</button>)}</div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !list.length && <Empty text="Nenhum membro encontrado." />}
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id}><Card className="flex items-center gap-3 p-3">
            <Avatar m={m} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{m.nome}</p>
              <p className="truncate text-xs text-muted-foreground"><span className="text-primary">{CARGO_LABEL[m.cargo] ?? m.cargo}</span>{m.ministerio ? ` · ${m.ministerio}` : ""}{!m.ativo ? " · inativo" : ""}</p>
            </div>
            {staff && <button aria-label="Editar" onClick={() => setEdit({ id: m.id, v: { ...membroVazio, ...m, nascimento: m.nascimento ?? "", data_membro: m.data_membro ?? "", batismo_aguas: m.batismo_aguas ?? "", batismo_espirito: m.batismo_espirito ?? "" } })} className="p-2 text-muted-foreground"><Pencil className="h-4 w-4" /></button>}
            <button aria-label="Ver Carteirinha" onClick={() => setVer(m)} className="p-2 rounded-full border">
  <Eye className="h-4 w-4" />
</button><WaBtn phone={m.telefone} label={m.nome} />
          </Card></li>
        ))}
      </ul>
      {edit && (
        <Modal title={edit.id ? "Editar membro" : "Adicionar membro"} onClose={() => setEdit(null)}>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (edit.v.cpf && !cpfValido(edit.v.cpf)) { toast.error("CPF inválido"); return; }
            const v = { ...edit.v, email: edit.v.email.trim().toLowerCase(), nascimento: edit.v.nascimento || null, data_membro: edit.v.data_membro || null, batismo_aguas: edit.v.batismo_aguas || null, batismo_espirito: edit.v.batismo_espirito || null };
            save.mutate({ id: edit.id, values: v }, { onSuccess: () => setEdit(null) });
          }}>
            <div className="flex items-center gap-3">
              <Avatar m={{ nome: edit.v.nome || "?", foto: edit.v.foto }} />
              <label className="cursor-pointer text-sm text-primary">Escolher foto<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setEdit({ ...edit, v: { ...edit.v, foto: await fotoParaDataUrl(f) } }); }} /></label>
            </div>
            <Field label="Nome"><input required className={inputCls} value={edit.v.nome} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, nome: e.target.value } })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF"><input inputMode="numeric" placeholder="000.000.000-00" className={inputCls} value={edit.v.cpf} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, cpf: mascararCpf(e.target.value) } })} /></Field>
              <Field label="E-mail (login do membro)"><input type="email" className={inputCls} value={edit.v.email} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, email: e.target.value } })} /></Field>
            </div>
            <Field label="Telefone com DDD"><input required inputMode="tel" placeholder="(96) 99999-9999" className={inputCls} value={edit.v.telefone} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, telefone: e.target.value } })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cargo"><select className={inputCls} value={edit.v.cargo} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, cargo: e.target.value } })}>{CARGOS.map((c) => <option key={c} value={c}>{CARGO_LABEL[c]}</option>)}</select></Field>
              <Field label="Nascimento"><input type="date" className={inputCls} value={edit.v.nascimento} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, nascimento: e.target.value } })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2"><Field label="Membro desde"><input type="date" className={inputCls} value={edit.v.data_membro} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, data_membro: e.target.value } })} /></Field><Field label="Batismo nas águas"><input type="date" className={inputCls} value={edit.v.batismo_aguas} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, batismo_aguas: e.target.value } })} /></Field><Field label="Batismo no Espírito"><input type="date" className={inputCls} value={edit.v.batismo_espirito} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, batismo_espirito: e.target.value } })} /></Field></div>
            <Field label="Instrumento ou ministério"><input list="funcoes-m" className={inputCls} placeholder="Ex.: Bateria, Louvor, Recepção" value={edit.v.ministerio} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, ministerio: e.target.value } })} /><datalist id="funcoes-m">{FUNCOES.map((f) => <option key={f} value={f} />)}</datalist></Field>
            <Field label="Endereço"><input className={inputCls} value={edit.v.endereco} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, endereco: e.target.value } })} /></Field>
            <Field label="Observação"><textarea className={inputCls} value={edit.v.observacao} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, observacao: e.target.value } })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.v.ativo} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, ativo: e.target.checked } })} />Ativo</label>
            <div className="flex gap-2">
              {edit.id && <Btn type="button" variant="danger" onClick={() => confirm("Apagar este membro? As escalas dele também serão apagadas.") && del.mutate(edit.id!, { onSuccess: () => setEdit(null) })}><Trash2 className="h-4 w-4" /></Btn>}
              <Btn className="flex-1" disabled={save.isPending}><Save className="h-4 w-4" />Salvar</Btn>
            </div>
          </form>
        </Modal>
      )}
      {ver && (
<Modal title="Carteirinha" onClose={() => setVer(null)}>
<div className="space-y-3 text-center">
<Avatar m={{ nome: ver.nome, foto: ver.foto }} />
<p className="font-bold text-lg">{ver.nome}</p>
<p className="text-sm text-muted-foreground">{ver.cargo || "Membro"}</p>
<p className="text-sm">{ver.telefone || ""}</p>
<p className="text-sm">{ver.email || ""}</p>
</div>
</Modal>
)}
    </div>
  );
}

/* ---------- Eventos ---------- */
function EventosScreen({ staff, admin }: { staff: boolean; admin: boolean }) {
  const { data: eventos = [] } = useRows<Evento>("eventos", "data");
  const { data: cultos = [] } = useRows<Tables<"cultos">>("cultos", "nome");
  const save = useSave("eventos"); const del = useRemove("eventos");
  const [edit, setEdit] = useState<{ id?: string; v: { titulo: string; data: string; horario: string; local: string; descricao: string; culto_id?: string | null } } | null>(null);
  const hoje = localDateKey(new Date());
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Eventos</h2>
        {staff && <Btn onClick={() => setEdit({ v: { titulo: "", data: hoje, horario: "19:00", local: "", descricao: "", culto_id: "" } })}><Plus className="h-4 w-4" />Novo</Btn>}
      </div>
      <CultosManager admin={admin} />
      {!eventos.length && <Empty text="Nenhum evento cadastrado." />}
      {eventos.map((e) => (
        <Card key={e.id} className={e.data < hoje ? "opacity-60" : ""}>
          <div className="flex items-start justify-between gap-2">
            <div><p className="font-bold text-primary">{e.titulo}</p><p className="text-sm">{dataBR(e.data)}{e.horario ? ` · ${e.horario}` : ""}{e.local ? ` · ${e.local}` : ""}</p>{e.descricao && <p className="mt-1 text-sm text-muted-foreground">{e.descricao}</p>}</div>
            {staff && <div className="flex"><button aria-label="Editar" className="p-2" onClick={() => setEdit({ id: e.id, v: e })}><Pencil className="h-4 w-4" /></button><button aria-label="Apagar" className="p-2 text-destructive" onClick={() => confirm("Apagar evento?") && del.mutate(e.id)}><Trash2 className="h-4 w-4" /></button></div>}
          </div>
        </Card>
      ))}
      {edit && (
        <Modal title={edit.id ? "Editar evento" : "Novo evento"} onClose={() => setEdit(null)}>
          <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); const { titulo, data, horario, local, descricao, culto_id } = edit.v; save.mutate({ id: edit.id, values: { titulo, data, horario, local, descricao, culto_id: culto_id || null } }, { onSuccess: () => setEdit(null) }); }}>
            <Field label="Culto"><select required className={inputCls} value={edit.v.culto_id ?? ""} onChange={e => { const c = cultos.find(c => c.id === e.target.value); if (c) setEdit({ ...edit, v: { ...edit.v, culto_id: c.id, titulo: edit.v.titulo || c.nome, horario: c.horario, data: dataDoCulto(c, edit.v.data) } }); }}><option value="">Escolha um culto</option>{cultos.map(c => <option key={c.id} value={c.id}>{c.nome} · {c.horario}</option>)}</select></Field>
            <Field label="Título"><input required list="tipos-ev" className={inputCls} value={edit.v.titulo} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, titulo: e.target.value } })} /><datalist id="tipos-ev">{["Festividade", "Congresso", "Aniversário da Igreja", "Batismo", "Santa Ceia"].map((t) => <option key={t} value={t} />)}</datalist></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" required className={inputCls} value={edit.v.data} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, data: e.target.value } })} /></Field>
              <Field label="Horário"><input type="time" className={inputCls} value={edit.v.horario} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, horario: e.target.value } })} /></Field>
            </div>
            <Field label="Local"><input className={inputCls} value={edit.v.local} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, local: e.target.value } })} /></Field>
            <Field label="Descrição"><textarea className={inputCls} value={edit.v.descricao} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, descricao: e.target.value } })} /></Field>
            <Btn className="w-full"><Save className="h-4 w-4" />Salvar</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Avisos ---------- */
function AvisosScreen({ staff }: { staff: boolean }) {
  const { data: avisos = [] } = useRows<Tables<"avisos">>("avisos", "created_at", false);
  const save = useSave("avisos"); const del = useRemove("avisos");
  const [texto, setTexto] = useState("");
  const enviar = () => {
    if (!texto.trim()) { toast.error("Escreva o aviso"); return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
    if (staff) save.mutate({ values: { texto } }, { onSuccess: () => setTexto("") });
  };
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Avisos</h2>
      <Card className="space-y-3">
        <textarea rows={4} className={inputCls} placeholder="Escreva o aviso para o grupo…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Btn variant="whats" className="w-full py-4 text-base" onClick={enviar}><MessageCircle className="h-5 w-5" />Enviar Aviso no WhatsApp</Btn>
        <p className="text-xs text-muted-foreground">O WhatsApp abre com o texto pronto; escolha o grupo.</p>
      </Card>
      {!avisos.length && <Empty text="Nenhum aviso enviado ainda." />}
      {avisos.map((a) => (
        <Card key={a.id} className="flex gap-2"><div className="flex-1"><p className="text-xs text-primary">{new Date(a.created_at).toLocaleString("pt-BR")}</p><p className="whitespace-pre-wrap text-sm">{a.texto}</p></div>
          {staff && <button aria-label="Apagar" onClick={() => del.mutate(a.id)} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>}
        </Card>
      ))}
    </div>
  );
}

/* ---------- Aniversariantes ---------- */
function AnivScreen() {
  const { data: membros = [] } = useRows<Membro>("membros", "nome");
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const people = membros.filter((m) => m.ativo && m.nascimento).map((m) => ({ id: m.id, nome: m.nome, telefone: m.telefone, nascimento: m.nascimento ?? "" }));
  const list = birthdaysInMonth(birthdaysFromPeople([], people, []), mes);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Aniversariantes</h2>
      <select className={inputCls} value={mes} onChange={(e) => setMes(Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i + 1} className="capitalize">{m}</option>)}</select>
      {!list.length && <Empty text="Ninguém faz aniversário neste mês (preencha o nascimento no cadastro do membro)." />}
      {list.map((p) => (
        <Card key={p.id} className="flex items-center gap-3 p-3">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-hero text-primary-foreground"><span className="text-lg font-bold leading-none">{p.data.slice(8)}</span></div>
          <p className="flex-1 font-semibold">{p.nome}</p>
          <WaBtn phone={p.telefone} label={p.nome} msg={`Feliz aniversário, ${p.nome.split(" ")[0]}! Que Deus abençoe sua vida. 🎉`} />
        </Card>
      ))}
    </div>
  );
}

/* ---------- Dízimos / Ofertas ---------- */
function FinanceiroScreen({ tipo, staff }: { tipo: "dizimos" | "ofertas"; staff: boolean }) {
  const now = new Date();
  const [ym, setYm] = useState({ a: now.getFullYear(), m: now.getMonth() + 1 });
  const { data: rows = [], isPending: rowsPending, error: rowsError } = useRows<{ id: string; nome?: string; membro_id?: string | null; valor: number; data: string; obs: string }>(tipo, "data");
  const { data: membros = [], isPending: membrosPending, error: membrosError } = useRows<Membro>("membros", "nome");
  const save = useSave(tipo); const del = useRemove(tipo);
  const [form, setForm] = useState<{ nome: string; membro_id: string; valor: string; data: string; obs: string } | null>(null);
  const { ini, fim } = monthRange(ym.a, ym.m);
  const doMes = rows.filter((r) => r.data >= ini && r.data <= fim).map((r) => ({ ...r, valor: Number(r.valor) }));
  const total = sumValues(doMes);
  const [report, setReport] = useState(false);
  const relatorio = relatorioDizimos(membros, rows, ym.a, ym.m);
  if (rowsPending || membrosPending) return <p className="text-muted-foreground">Carregando…</p>;
  if (rowsError || membrosError) return <p role="alert" className="text-destructive">Não foi possível carregar os dados. {rowsError?.message ?? membrosError?.message}</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{tipo === "dizimos" ? "Dízimos" : "Ofertas"}</h2>
        {staff && <Btn onClick={() => setForm({ nome: "", membro_id: "", valor: "", data: localDateKey(now), obs: "" })}><Plus className="h-4 w-4" />Lançar</Btn>}
      </div>
      <MonthNav ano={ym.a} mes={ym.m} set={(a, m) => setYm({ a, m })} />
      <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft"><p className="text-sm">Total do mês</p><p className="text-3xl font-bold">{brl(total)}</p></div>
      {tipo === "dizimos" && <>
        <div className="flex gap-2"><Btn variant={report ? "ghost" : "primary"} onClick={() => setReport(false)}>Lançamentos</Btn><Btn variant={report ? "primary" : "ghost"} onClick={() => setReport(true)}>Relatório Mensal</Btn></div>
        {report && <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 border-b border-border pb-3"><p className="text-success"><b>{relatorio.deram}</b> deram</p><p className="text-destructive"><b>{relatorio.pendentes}</b> pendentes</p></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Mês do relatório"><select className={inputCls} value={ym.m} onChange={e => setYm({ ...ym, m: Number(e.target.value) })}>{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Field><Field label="Ano do relatório"><input type="number" className={inputCls} value={ym.a} onChange={e => setYm({ ...ym, a: Number(e.target.value) })} /></Field></div>
          {!membros.length && <Empty text="Nenhum membro cadastrado." />}
          {relatorio.pessoas.map(p => <Card key={p.id}><div className="flex flex-wrap justify-between gap-2"><p className="break-words font-semibold">{p.nome}</p><span className={`font-semibold ${p.contribuiu ? "text-success" : "text-destructive"}`}>{p.contribuiu ? brl(p.total) : "PENDENTE"}</span></div>{p.itens.map(i => <p key={i.id} className="text-sm text-success">{dataBR(i.data)} · {brl(Number(i.valor))}</p>)}</Card>)}
        </div>}
      </>}
      {!report && !doMes.length && <Empty text="Nenhum lançamento neste mês." />}
      {!report && (tipo === "dizimos"
        ? totalsByPerson(doMes).map((p) => (
          <Card key={p.nome}><div className="mb-2 flex justify-between font-semibold"><span>{p.nome}</span><span className="text-primary">{brl(p.total)}</span></div>
            {p.itens.map((i) => <div key={i.id} className="flex items-center justify-between text-sm text-muted-foreground"><span>{dataBR(i.data)}</span><span className="flex items-center gap-2">{brl(i.valor)}{staff && <button aria-label="Apagar" onClick={() => del.mutate(i.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>}</span></div>)}
          </Card>))
        : doMes.map((i) => (
          <Card key={i.id} className="flex items-center justify-between p-3"><div><p className="font-semibold">{brl(i.valor)}</p><p className="text-xs text-muted-foreground">{dataBR(i.data)}{i.obs ? ` · ${i.obs}` : ""}</p></div>
            {staff && <button aria-label="Apagar" onClick={() => del.mutate(i.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
          </Card>)))}
      {form && (
        <Modal title={tipo === "dizimos" ? "Lançar dízimo" : "Lançar oferta"} onClose={() => setForm(null)}>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            const valor = Number(form.valor.replace(",", "."));
            if (!(valor > 0)) { toast.error("Valor inválido"); return; }
            const values = tipo === "dizimos" ? { nome: form.nome, membro_id: form.membro_id || null, valor, data: form.data, obs: form.obs } : { valor, data: form.data, obs: form.obs };
            save.mutate({ values }, { onSuccess: () => setForm(null) });
          }}>
            {tipo === "dizimos" && <Field label="Dizimista"><select required className={inputCls} value={form.membro_id} onChange={e => { const m = membros.find(m => m.id === e.target.value); setForm({ ...form, membro_id: e.target.value, nome: m?.nome ?? "" }); }}><option value="">Escolha um membro</option>{membros.map(m => <option key={m.id} value={m.id}>{m.nome}{m.telefone ? ` · ${m.telefone}` : ""}</option>)}</select></Field>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor (R$)"><input required inputMode="decimal" className={inputCls} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></Field>
              <Field label="Data"><input type="date" required className={inputCls} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></Field>
            </div>
            <Field label={tipo === "dizimos" ? "Observação" : "Culto / observação"}><input className={inputCls} value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} /></Field>
            <Btn className="w-full"><Save className="h-4 w-4" />Salvar</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Atas ---------- */
type AtaForm = { id?: string; igreja: string; mes: number; ano: number; data_reuniao: string; horario: string; local: string; presidente: string; secretario: string; pauta: string; presentes: string; decisoes: string; texto_completo: string };

function AtasScreen({ staff, igreja }: { staff: boolean; igreja: string }) {
  const { data: atas = [] } = useRows<Ata>("atas", "criado_em", false);
  const save = useSave("atas"); const del = useRemove("atas");
  const [edit, setEdit] = useState<AtaForm | null>(null);
  const [gerando, setGerando] = useState(false);
  const now = new Date();
  const novo = (): AtaForm => ({ igreja: igreja || APP_NAME, mes: now.getMonth() + 1, ano: now.getFullYear(), data_reuniao: localDateKey(now), horario: "19:00", local: "", presidente: "", secretario: "", pauta: "", presentes: "", decisoes: "", texto_completo: "" });
  const sorted = [...atas].sort((a, b) => b.ano - a.ano || b.mes - a.mes);

  const gerar = async () => {
    if (!edit) return;
    setGerando(true);
    try {
      const { ini, fim } = monthRange(edit.ano, edit.mes);
      const [esc, ev, mem, todos] = await Promise.all([
        supabase.from("escalas").select("*").gte("data", ini).lte("data", fim),
        supabase.from("eventos").select("*").gte("data", ini).lte("data", fim).order("data"),
        supabase.from("membros").select("nome").gte("created_at", `${ini}T00:00:00`).lte("created_at", `${fim}T23:59:59`).order("nome"),
        supabase.from("membros").select("id,nome"),
      ]);
      const err = esc.error || ev.error || mem.error || todos.error; if (err) throw err;
      const nomes = new Map((todos.data ?? []).map((m) => [m.id, m.nome]));
      const escalas = (esc.data ?? []).map((e) => ({ data: e.data, tipo_culto: e.tipo_culto, funcao: e.funcao, nome: nomes.get(e.membro_id) ?? "—", confirmado: e.confirmado }));
      const presentesList = edit.presentes.trim()
        ? edit.presentes.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
        : [...new Set(escalas.map((e) => e.nome))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      const texto = gerarTextoAta({
        igreja: edit.igreja, mes: edit.mes, ano: edit.ano, dataReuniao: edit.data_reuniao, horario: edit.horario, local: edit.local,
        presidente: edit.presidente, secretario: edit.secretario, pauta: edit.pauta, presentes: presentesList, decisoes: edit.decisoes,
        escalas, eventos: ev.data ?? [], novosMembros: (mem.data ?? []).map((m) => m.nome),
      });
      setEdit({ ...edit, presentes: edit.presentes || presentesList.join(", "), texto_completo: texto });
      toast.success("Ata gerada! Revise e edite o texto antes de salvar.");
    } catch (e) { toast.error(errMsg(e)); }
    setGerando(false);
  };

  const nomeArq = (a: { mes: number; ano: number }) => `ata-${String(a.mes).padStart(2, "0")}-${a.ano}`;
  const enviar = async (a: { mes: number; ano: number; texto_completo: string }, canal: "whats" | "email") => {
    const titulo = `Ata de ${MESES[a.mes - 1]} de ${a.ano}`;
    const blob = ataPdf(a.texto_completo);
    if (await compartilharPdf(blob, `${nomeArq(a)}.pdf`, titulo)) return;
    baixar(blob, `${nomeArq(a)}.pdf`);
    toast.info("PDF baixado. Anexe o arquivo na mensagem.");
    if (canal === "whats") window.open(`https://wa.me/?text=${encodeURIComponent(`${titulo} – segue o PDF em anexo.`)}`, "_blank");
    else window.location.href = `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(`Segue em anexo a ${titulo}.\n\n${a.texto_completo}`)}`;
  };
  const Acoes = ({ a }: { a: { mes: number; ano: number; texto_completo: string } }) => (
    <div className="grid grid-cols-2 gap-2">
      <Btn type="button" variant="ghost" onClick={() => baixar(ataPdf(a.texto_completo), `${nomeArq(a)}.pdf`)}><Download className="h-4 w-4" />Baixar PDF</Btn>
      <Btn type="button" variant="ghost" onClick={() => baixar(ataDoc(a.texto_completo), `${nomeArq(a)}.doc`)}><Download className="h-4 w-4" />Baixar DOC</Btn>
      <Btn type="button" variant="whats" onClick={() => enviar(a, "whats")}><MessageCircle className="h-4 w-4" />Enviar no WhatsApp</Btn>
      <Btn type="button" variant="info" onClick={() => enviar(a, "email")}><Mail className="h-4 w-4" />Enviar por E-mail</Btn>
    </div>
  );

  const set = (k: keyof AtaForm, v: string | number) => edit && setEdit({ ...edit, [k]: v });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Ata Mensal</h2>
        {staff && <Btn onClick={() => setEdit(novo())}><Plus className="h-4 w-4" />Nova Ata</Btn>}
      </div>
      {!sorted.length && <Empty text="Nenhuma ata registrada." />}
      {sorted.map((a) => (
        <Card key={a.id} className="space-y-3">
          <div className="flex items-start justify-between">
            <div><p className="font-bold capitalize text-primary">{MESES[a.mes - 1]} de {a.ano}</p><p className="text-xs text-muted-foreground">{a.data_reuniao ? `Reunião em ${dataBR(a.data_reuniao)}` : ""}{a.presidente ? ` · Pres.: ${a.presidente}` : ""}</p></div>
            {staff && <div className="flex">
              <button aria-label="Editar" className="p-2" onClick={() => setEdit({ id: a.id, igreja: a.texto_completo.split("\n")[0] ?? "", mes: a.mes, ano: a.ano, data_reuniao: a.data_reuniao ?? "", horario: "", local: a.local, presidente: a.presidente, secretario: a.secretario, pauta: a.pauta, presentes: a.presentes, decisoes: a.decisoes, texto_completo: a.texto_completo })}><Pencil className="h-4 w-4" /></button>
              <button aria-label="Apagar" className="p-2 text-destructive" onClick={() => confirm("Apagar esta ata?") && del.mutate(a.id)}><Trash2 className="h-4 w-4" /></button>
            </div>}
          </div>
          {a.texto_completo && <Acoes a={a} />}
        </Card>
      ))}
      {edit && (
        <Modal title={edit.id ? "Editar ata" : "Nova ata"} onClose={() => setEdit(null)}>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (!edit.texto_completo.trim()) { toast.error("Gere ou escreva o texto da ata"); return; }
            const { id, igreja: _i, horario: _h, ...values } = edit;
            save.mutate({ id, values: { ...values, data_reuniao: values.data_reuniao || null } }, { onSuccess: () => setEdit(null) });
          }}>
            <Field label="Nome da igreja"><input required className={inputCls} value={edit.igreja} onChange={(e) => set("igreja", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mês"><select className={inputCls} value={edit.mes} onChange={(e) => set("mes", Number(e.target.value))}>{MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Field>
              <Field label="Ano"><input type="number" className={inputCls} value={edit.ano} onChange={(e) => set("ano", Number(e.target.value))} /></Field>
              <Field label="Data da reunião"><input type="date" className={inputCls} value={edit.data_reuniao} onChange={(e) => set("data_reuniao", e.target.value)} /></Field>
              <Field label="Horário"><input type="time" className={inputCls} value={edit.horario} onChange={(e) => set("horario", e.target.value)} /></Field>
            </div>
            <Field label="Local"><input className={inputCls} placeholder="Templo sede, endereço" value={edit.local} onChange={(e) => set("local", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Presidente"><input className={inputCls} value={edit.presidente} onChange={(e) => set("presidente", e.target.value)} /></Field>
              <Field label="Secretário(a)"><input className={inputCls} value={edit.secretario} onChange={(e) => set("secretario", e.target.value)} /></Field>
            </div>
            <Field label="Pauta"><textarea className={inputCls} placeholder="Deixe vazio para usar a pauta padrão" value={edit.pauta} onChange={(e) => set("pauta", e.target.value)} /></Field>
            <Field label="Presentes (separados por vírgula)"><textarea className={inputCls} placeholder="Vazio = pessoas que estavam na escala do mês" value={edit.presentes} onChange={(e) => set("presentes", e.target.value)} /></Field>
            <Field label="Decisões"><textarea className={inputCls} value={edit.decisoes} onChange={(e) => set("decisoes", e.target.value)} /></Field>
            <Btn type="button" className="w-full" disabled={gerando} onClick={gerar}><Sparkles className="h-4 w-4" />{gerando ? "Gerando…" : "Gerar Ata Automática do Mês"}</Btn>
            <Field label="Texto completo da ata (pode editar)"><textarea rows={16} className={`${inputCls} font-serif leading-relaxed`} value={edit.texto_completo} onChange={(e) => set("texto_completo", e.target.value)} /></Field>
            {edit.texto_completo && <Acoes a={edit} />}
            <Btn className="w-full" disabled={save.isPending}><Save className="h-4 w-4" />Salvar ata</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Admin ---------- */
function AdminScreen({ igreja }: { igreja: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const [p, r] = await Promise.all([supabase.from("profiles").select("*").order("nome"), supabase.from("user_roles").select("*")]);
      if (p.error) throw p.error; if (r.error) throw r.error;
      return (p.data ?? []).map((u) => ({ ...u, roles: (r.data ?? []).filter((x) => x.user_id === u.id).map((x) => x.role) }));
    },
  });
  const { data: convite } = useQuery({
    queryKey: ["convite"],
    queryFn: async () => { const { data, error } = await supabase.from("igrejas").select("codigo_convite").maybeSingle(); if (error) throw error; return data?.codigo_convite ?? ""; },
  });
  const gerar = useMutation({
    mutationFn: async () => { const { error } = await supabase.rpc("gerar_codigo_convite"); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["convite"] }); toast.success("Novo código gerado. O anterior deixou de valer."); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "pastor" | "lider" | "membro" }) => {
      const { error } = await supabase.rpc("definir_papel", { _user_id: id, _role: role }); if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas"] }); toast.success("Acesso atualizado"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const msgConvite = `Olá! Entre na ${igreja} pelo ${APP_NAME}: ${typeof window !== "undefined" ? window.location.origin : ""}\nAo criar sua conta, escolha "Entrar com convite" e use o código: ${convite}`;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Admin · {igreja}</h2>
      <Card className="space-y-3">
        <p className="text-sm font-semibold">Código de convite</p>
        <p className="text-center text-3xl font-bold tracking-[0.3em] text-primary">{convite || "…"}</p>
        <div className="grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(msgConvite)}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-success px-3 py-2 text-sm font-semibold text-success-foreground">Enviar no WhatsApp</a>
          <Btn variant="ghost" disabled={gerar.isPending} onClick={() => { if (confirm("Gerar um novo código? O código atual deixará de funcionar.")) gerar.mutate(); }}>Gerar novo código</Btn>
        </div>
        <p className="text-xs text-muted-foreground">Quem entrar com este código vira Membro da sua igreja.</p>
      </Card>
      <p className="text-sm text-muted-foreground"><b>Pastor</b> e <b>Admin</b> editam escalas, membros, eventos e atas. Só o <b>Admin</b> vê dízimos e ofertas.</p>
      {(data ?? []).map((u) => (
        <Card key={u.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.nome || "(sem nome)"}</p><p className="text-xs text-muted-foreground">{u.telefone}</p></div>
          <select className="rounded-lg border border-input bg-background px-2 py-1 text-sm" value={u.roles[0] ?? "membro"} onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value as "membro" })}>
            {CARGOS.map((c) => <option key={c} value={c}>{CARGO_LABEL[c]}</option>)}
          </select>
        </Card>
      ))}
    </div>
  );
}

/* ---------- App ---------- */
export function IgrejaApp() {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [screen, setScreen] = useState<Screen>("home");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === "SIGNED_OUT") { qc.clear(); setScreen("home"); }
      if (ev === "SIGNED_IN" || ev === "USER_UPDATED") qc.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  const uid = session?.user.id;
  const { data: me, isLoading: meLoading, refetch: refetchMe } = useQuery({
    queryKey: ["me", uid], enabled: !!uid,
    queryFn: async () => {
      if (!uid) throw new Error("Entre na sua conta");
      const [p, r] = await Promise.all([supabase.from("profiles").select("nome, igreja_id, igrejas(nome)").eq("id", uid).maybeSingle(), supabase.from("user_roles").select("role").eq("user_id", uid)]);
      if (p.error) throw p.error;
      const ig = p.data?.igrejas as { nome: string } | null | undefined;
      return { nome: p.data?.nome ?? "", igrejaId: p.data?.igreja_id ?? null, igreja: ig?.nome ?? "", roles: (r.data ?? []).map((x) => x.role) };
    },
  });
  const admin = !!me?.roles.includes("admin");
  const staff = admin || !!me?.roles.includes("pastor");
  const sair = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); setScreen("home"); };
  const meta = session?.user.user_metadata ?? {};
  const semIgreja = !!session && !meLoading && !!me && !me.igrejaId;

  if (session === undefined) return <div className="min-h-screen bg-background" />;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster theme="dark" position="top-center" richColors />
      {!session ? <Auth /> : (
        <div className="mx-auto max-w-7x1 px-4 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
          <div className="mb-4 flex items-center justify-between">
            {screen !== "home" && !semIgreja && staff
              ? <button onClick={() => setScreen("home")} className="flex items-center gap-1 text-sm text-primary"><ArrowLeft className="h-4 w-4" />Início</button>
              : <span className="truncate text-xs uppercase tracking-widest text-muted-foreground">{me?.igreja || APP_NAME}</span>}
            <button onClick={sair} className="flex items-center gap-1 text-sm text-muted-foreground"><LogOut className="h-4 w-4" />Sair</button>
          </div>
          {semIgreja ? (
            <Onboarding inicial={{ tipo: meta['igreja_tipo'] === "convite" ? "convite" : "nova", igreja: meta['igreja_nome'] ?? "", codigo: meta['igreja_codigo'] ?? "" }}
              onDone={() => { qc.clear(); refetchMe(); setScreen("home"); }} />
          ) : !me ? null : !staff ? <MembroArea igreja={me.igreja} igrejaId={me.igrejaId ?? ""} /> : <>
          {screen === "galeria" && <Galeria staff igrejaId={me.igrejaId ?? ""} />}
          {screen === "duvidas" && <Duvidas staff />}
          {screen === "home" && <Home go={setScreen} nome={me?.nome ?? ""} igreja={me.igreja} staff={staff} admin={admin} />}
          {screen === "escala" && <EscalaScreen staff={staff} admin={admin} />}
          {screen === "membros" && <MembrosScreen staff={admin} />}
          {screen === "eventos" && <EventosScreen staff={staff} admin={admin} />}
          {screen === "avisos" && <AvisosScreen staff={staff} />}
          {screen === "atas" && <AtasScreen staff={staff} igreja={me.igreja} />}
          {screen === "aniv" && <AnivScreen />}
          {screen === "dizimos" && admin && <FinanceiroScreen tipo="dizimos" staff={admin} />}
          {screen === "ofertas" && admin && <FinanceiroScreen tipo="ofertas" staff={admin} />}
          {screen === "visitantes" && staff && <VisitantesScreen />}
          {screen === "oracao" && staff && <OracaoScreen />}
          {screen === "admin" && admin && <AdminScreen igreja={me.igreja} />}
          </>}
        </div>
      )}
    </div>
  );
}
