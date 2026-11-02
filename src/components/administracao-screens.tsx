import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useRows, useSave, useRemove } from "@/lib/administracao-hooks";
import { converterVisitante } from "@/lib/administracao.functions";
import { DIAS } from "@/lib/administracao";
import { dataBR } from "@/lib/igreja";
import { localDateKey } from "@/lib/church-planning";
import { Btn, Card, Field, Modal, Empty, WaBtn, inputCls } from "./igreja-ui";

export function CultosManager({ admin }: { admin: boolean }) {
  const { data: rows = [], error } = useRows<Tables<"cultos">>("cultos", "nome");
  const save = useSave("cultos"); const del = useRemove("cultos");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; nome: string; tipo: string; dia_semana: number; data_unica: string; horario: string } | null>(null);
  return <>
    <Btn variant="ghost" onClick={() => setOpen(true)}>Cultos</Btn>
    {open && <Modal title="Cultos" onClose={() => setOpen(false)}>
      <div className="space-y-3">
        {admin && <Btn onClick={() => setEdit({ nome: "", tipo: "semanal", dia_semana: 0, data_unica: localDateKey(new Date()), horario: "" })}><Plus className="h-4 w-4" />Novo culto</Btn>}
        {error && <p role="alert" className="text-destructive">{error.message}</p>}
        {!rows.length && <Empty text="Nenhum culto cadastrado." />}
        {rows.map(c => <div key={c.id} className="flex items-center gap-2 border-b border-border py-2">
          <div className="min-w-0 flex-1"><p className="break-words font-semibold text-primary">{c.nome}</p><p className="text-xs text-muted-foreground">{c.tipo === "semanal" ? `${DIAS[c.dia_semana ?? 0]} · semanal` : dataBR(c.data_unica ?? "")} · {c.horario}</p></div>
          {admin && <><Btn variant="ghost" aria-label={`Editar culto ${c.nome}`} onClick={() => setEdit({ id: c.id, nome: c.nome, tipo: c.tipo, dia_semana: c.dia_semana ?? 0, data_unica: c.data_unica ?? localDateKey(new Date()), horario: c.horario })}><Pencil className="h-4 w-4" /></Btn><Btn variant="danger" aria-label={`Excluir culto ${c.nome}`} onClick={() => confirm("Excluir culto? Escalas e eventos já salvos serão mantidos.") && del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Btn></>}
        </div>)}
      </div>
    </Modal>}
    {edit && <Modal title={edit.id ? "Editar culto" : "Novo culto"} onClose={() => setEdit(null)}>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); const { id, ...v } = edit; save.mutate({ id, values: { ...v, dia_semana: v.tipo === "semanal" ? v.dia_semana : null, data_unica: v.tipo === "unico" ? v.data_unica : null } }, { onSuccess: () => setEdit(null) }); }}>
        <Field label="Nome do culto"><input required className={inputCls} value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })} /></Field>
        <Field label="Tipo"><select className={inputCls} value={edit.tipo} onChange={e => setEdit({ ...edit, tipo: e.target.value })}><option value="semanal">Fixo semanal</option><option value="unico">Data única / festividade</option></select></Field>
        {edit.tipo === "semanal" ? <Field label="Dia da semana"><select className={inputCls} value={edit.dia_semana} onChange={e => setEdit({ ...edit, dia_semana: Number(e.target.value) })}>{DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field> : <Field label="Data única"><input required type="date" className={inputCls} value={edit.data_unica} onChange={e => setEdit({ ...edit, data_unica: e.target.value })} /></Field>}
        <Field label="Horário"><input required type="time" className={inputCls} value={edit.horario} onChange={e => setEdit({ ...edit, horario: e.target.value })} /></Field>
        <Btn disabled={save.isPending} className="w-full">Salvar culto</Btn>
      </form>
    </Modal>}
  </>;
}

export function SetoresManager({ staff }: { staff: boolean }) {
  const { data: rows = [] } = useRows<Tables<"setores">>("setores", "nome");
  const save = useSave("setores"); const del = useRemove("setores");
  const [open, setOpen] = useState(false); const [edit, setEdit] = useState<{ id?: string; nome: string } | null>(null);
  return <><Btn variant="ghost" onClick={() => setOpen(true)}>Setores / Ministérios</Btn>
    {open && <Modal title="Setores / Ministérios" onClose={() => setOpen(false)}><div className="space-y-3">
      {staff && <Btn onClick={() => setEdit({ nome: "" })}><Plus className="h-4 w-4" />Novo setor</Btn>}
      {!rows.length && <Empty text="Nenhum setor cadastrado." />}
      {rows.map(s => <div className="flex items-center gap-2 border-b border-border py-2" key={s.id}><span className="min-w-0 flex-1 break-words">{s.nome}</span>{staff && <><Btn variant="ghost" aria-label={`Editar setor ${s.nome}`} onClick={() => setEdit({ id: s.id, nome: s.nome })}><Pencil className="h-4 w-4" /></Btn><Btn variant="danger" aria-label={`Excluir setor ${s.nome}`} onClick={() => confirm("Excluir setor? Escalas já salvas serão mantidas.") && del.mutate(s.id)}><Trash2 className="h-4 w-4" /></Btn></>}</div>)}
    </div></Modal>}
    {edit && <Modal title={edit.id ? "Editar setor" : "Novo setor"} onClose={() => setEdit(null)}><form className="space-y-3" onSubmit={e => { e.preventDefault(); save.mutate({ id: edit.id, values: { nome: edit.nome } }, { onSuccess: () => setEdit(null) }); }}><Field label="Nome do setor"><input required className={inputCls} value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })} /></Field><Btn disabled={save.isPending}>Salvar setor</Btn></form></Modal>}
  </>;
}

export function VisitantesScreen() {
  const { data: rows = [], isLoading, error } = useRows<Tables<"visitantes">>("visitantes", "data_visita", false);
  const save = useSave("visitantes"); const del = useRemove("visitantes");
  const [edit, setEdit] = useState<{ id?: string; nome: string; telefone: string; data_visita: string; convidado_por: string } | null>(null);
  const qc = useQueryClient(); const convert = useServerFn(converterVisitante);
  const conversion = useMutation({ mutationFn: (id: string) => convert({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["visitantes"] }); qc.invalidateQueries({ queryKey: ["membros"] }); toast.success("Visitante transformado em membro"); }, onError: e => toast.error(e.message) });
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">Visitantes</h2><Btn onClick={() => setEdit({ nome: "", telefone: "", data_visita: localDateKey(new Date()), convidado_por: "" })}><Plus className="h-4 w-4" />Novo Visitante</Btn>
    {isLoading ? <p>Carregando…</p> : !rows.length && <Empty text="Nenhum visitante cadastrado." />}{error && <p role="alert" className="text-destructive">{error.message}</p>}
    {rows.map(v => <Card key={v.id} className="space-y-3"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="break-words font-semibold text-primary">{v.nome}</p><p className="text-sm">{dataBR(v.data_visita)}</p><p className="break-words text-xs text-muted-foreground">{v.telefone}{v.convidado_por ? ` · Convidado por ${v.convidado_por}` : ""}</p></div><WaBtn phone={v.telefone} label={v.nome} /></div>
      <div className="flex flex-wrap gap-2">{v.membro_id ? <span className="text-sm text-success">Convertido em membro</span> : <Btn variant="ghost" disabled={conversion.isPending} onClick={() => conversion.mutate(v.id)}><UserPlus className="h-4 w-4" />Transformar em membro</Btn>}
      <Btn variant="ghost" aria-label={`Editar visitante ${v.nome}`} onClick={() => setEdit({ id: v.id, nome: v.nome, telefone: v.telefone, data_visita: v.data_visita, convidado_por: v.convidado_por })}><Pencil className="h-4 w-4" /></Btn><Btn variant="danger" aria-label={`Excluir visitante ${v.nome}`} onClick={() => confirm("Excluir visitante?") && del.mutate(v.id)}><Trash2 className="h-4 w-4" /></Btn></div></Card>)}
    {edit && <Modal title={edit.id ? "Editar visitante" : "Novo Visitante"} onClose={() => setEdit(null)}><form className="space-y-3" onSubmit={e => { e.preventDefault(); const { id, ...values } = edit; save.mutate({ id, values }, { onSuccess: () => setEdit(null) }); }}>
      <Field label="Nome"><input required className={inputCls} value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })} /></Field><Field label="Telefone"><input required inputMode="tel" className={inputCls} value={edit.telefone} onChange={e => setEdit({ ...edit, telefone: e.target.value })} /></Field><Field label="Data da visita"><input required type="date" className={inputCls} value={edit.data_visita} onChange={e => setEdit({ ...edit, data_visita: e.target.value })} /></Field><Field label="Quem convidou"><input className={inputCls} value={edit.convidado_por} onChange={e => setEdit({ ...edit, convidado_por: e.target.value })} /></Field><Btn disabled={save.isPending} className="w-full">Salvar visitante</Btn>
    </form></Modal>}
  </div>;
}

export function OracaoScreen() {
  const { data: rows = [], isLoading, error } = useRows<Tables<"pedidos_oracao">>("pedidos_oracao", "data", false);
  const save = useSave("pedidos_oracao");
  const [filter, setFilter] = useState("todos"); const [form, setForm] = useState<{ nome: string; pedido: string; data: string } | null>(null);
  const list = rows.filter(r => filter === "todos" || r.status === filter);
  return <div className="space-y-4"><h2 className="text-xl font-bold">Pedidos de Oração</h2>
    <Btn onClick={() => setForm({ nome: "", pedido: "", data: localDateKey(new Date()) })}><Plus className="h-4 w-4" />Novo pedido</Btn>
    <select aria-label="Status dos pedidos" className={inputCls} value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos</option><option value="pendente">Pendentes</option><option value="orado">Orados</option></select>
    {isLoading ? <p>Carregando…</p> : !list.length && <Empty text="Nenhum pedido de oração." />}{error && <p role="alert" className="text-destructive">{error.message}</p>}
    {list.map(p => <Card key={p.id} className="space-y-2"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="break-words font-semibold">{p.nome}</p><p className="text-xs text-muted-foreground">{dataBR(p.data)}</p></div><span className={`text-sm font-semibold ${p.status === "orado" ? "text-success" : "text-primary"}`}>{p.status === "orado" ? "Orado" : "Pendente"}</span></div><p className="whitespace-pre-wrap break-words text-sm">{p.pedido}</p>{p.status !== "orado" && <Btn variant="whats" disabled={save.isPending} onClick={() => save.mutate({ id: p.id, values: { status: "orado" } })}><Check className="h-4 w-4" />Marcar como Orado</Btn>}</Card>)}
    {form && <Modal title="Novo pedido de oração" onClose={() => setForm(null)}><form className="space-y-3" onSubmit={e => { e.preventDefault(); save.mutate({ values: { ...form, status: "pendente" } }, { onSuccess: () => setForm(null) }); }}><Field label="Nome"><input required className={inputCls} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></Field><Field label="Data"><input required type="date" className={inputCls} value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} /></Field><Field label="Pedido de oração"><textarea required rows={4} className={inputCls} value={form.pedido} onChange={e => setForm({ ...form, pedido: e.target.value })} /></Field><Btn disabled={save.isPending} className="w-full">Salvar pedido</Btn></form></Modal>}
  </div>;
}