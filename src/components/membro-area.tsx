import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { BadgeCheck, CalendarDays, Download, Image as ImageIcon, Send, Trash2, User, Upload, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { APP_NAME, CARGO_LABEL, dataBR } from "@/lib/igreja";
import { dataDoCulto } from "@/lib/administracao";
import { localDateKey } from "@/lib/church-planning";
import { baixar, compartilharPdf } from "@/lib/ata-export";
import { Btn, Card, Empty, Field, Modal, Avatar, inputCls, errMsg } from "./igreja-ui";

type Membro = Tables<"membros">;
type GaleriaItem = { id: string; titulo: string; tipo: "foto" | "video"; url: string; caminho: string | null; data: string };

async function reduzirFoto(file: File) {
  const img = await createImageBitmap(file);
  const s = 360; const c = document.createElement("canvas"); c.width = s; c.height = s;
  const ctx = c.getContext("2d"); if (!ctx) throw new Error("Não foi possível carregar a foto");
  const r = Math.max(s / img.width, s / img.height);
  ctx.drawImage(img, (s - img.width * r) / 2, (s - img.height * r) / 2, img.width * r, img.height * r);
  return c.toDataURL("image/jpeg", 0.8);
}

export function codigoCredencial(igrejaId: string, membroId: string) {
  return `IGREJA-ORGANIZADA:${igrejaId}:${membroId}`;
}

function credencialPdf(m: Membro, igreja: string, qr: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: [86, 140] });
  doc.setFillColor(13, 15, 20); doc.rect(0, 0, 86, 140, "F");
  doc.setTextColor(212, 175, 55); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(APP_NAME.toUpperCase(), 43, 10, { align: "center" });
  doc.setFontSize(9); doc.setTextColor(230, 230, 230); doc.text(igreja, 43, 15, { align: "center" });
  if (m.foto) { try { doc.addImage(m.foto, "JPEG", 28, 20, 30, 30); } catch { /* foto inválida */ } }
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text(m.nome, 43, 58, { align: "center", maxWidth: 76 });
  doc.setFontSize(9); doc.setTextColor(212, 175, 55);
  doc.text(`${CARGO_LABEL[m.cargo] ?? m.cargo}${m.ministerio ? ` · ${m.ministerio}` : ""}`, 43, 65, { align: "center" });
  doc.setFillColor(255, 255, 255); doc.roundedRect(21, 72, 44, 44, 2, 2, "F");
  doc.addImage(qr, "PNG", 23, 74, 40, 40);
  doc.setTextColor(180, 180, 180); doc.setFontSize(7);
  doc.text(`Membro desde ${dataBR(m.created_at.slice(0, 10))}`, 43, 124, { align: "center" });
  doc.text(`Nº ${m.id.slice(0, 8).toUpperCase()}`, 43, 129, { align: "center" });
  return doc.output("blob");
}

type Aba = "credencial" | "dados" | "cultos" | "escala" | "galeria";

export function MembroArea({ igreja, igrejaId }: { igreja: string; igrejaId: string }) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("credencial");
  const { data: m, error } = useQuery({
    queryKey: ["meu-membro"],
    queryFn: async () => {
      const { data: id, error } = await supabase.rpc("meu_membro" as never);
      if (error) throw error;
      const r = await supabase.from("membros").select("*").eq("id", id as unknown as string).single();
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const foto = useMutation({
    mutationFn: async (f: File) => {
      const { error } = await supabase.rpc("atualizar_minha_foto" as never, { _foto: await reduzirFoto(f) } as never);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meu-membro"] }); toast.success("Foto atualizada"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  if (error) return <Empty text={errMsg(error)} />;
  if (!m) return <p className="text-center text-sm text-muted-foreground">Carregando…</p>;
  const abas: { id: Aba; label: string; icon: typeof User }[] = [
    { id: "credencial", label: "Credencial", icon: BadgeCheck },
    { id: "dados", label: "Meus dados", icon: User },
    { id: "cultos", label: "Cultos", icon: CalendarDays },
    { id: "escala", label: "Minha escala", icon: CalendarDays },
    { id: "galeria", label: "Galeria", icon: ImageIcon },
  ];
  return (
    <div className="space-y-4">
      <div className="text-center"><h1 className="text-2xl font-bold text-primary">{igreja || APP_NAME}</h1><p className="text-sm text-muted-foreground">Olá, {m.nome}</p></div>
      <div className="grid grid-cols-5 gap-1">
        {abas.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)} className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] ${aba === a.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-secondary"}`}>
            <a.icon className="h-5 w-5" />{a.label}
          </button>
        ))}
      </div>
      {aba === "credencial" && <Credencial m={m} igreja={igreja} igrejaId={igrejaId} onFoto={(f) => foto.mutate(f)} enviando={foto.isPending} />}
      {aba === "dados" && <MeusDados m={m} igreja={igreja} />}
      {aba === "cultos" && <ProximosCultos />}
      {aba === "escala" && <MinhaEscala membroId={m.id} />}
      {aba === "galeria" && <Galeria staff={false} igrejaId={igrejaId} />}
    </div>
  );
}

function Credencial({ m, igreja, igrejaId, onFoto, enviando }: { m: Membro; igreja: string; igrejaId: string; onFoto: (f: File) => void; enviando: boolean }) {
  const [qr, setQr] = useState("");
  useEffect(() => { QRCode.toDataURL(codigoCredencial(igrejaId, m.id), { margin: 1, width: 320 }).then(setQr); }, [igrejaId, m.id]);
  const nomeArq = `credencial-${m.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  return (
    <div className="space-y-3">
      <Card className="border-primary/40 bg-gradient-to-b from-card to-secondary text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{APP_NAME}</p>
        <p className="text-sm text-muted-foreground">{igreja}</p>
        <div className="my-3 flex justify-center">
          {m.foto ? <img src={m.foto} alt={m.nome} className="h-28 w-28 rounded-full border-4 border-primary object-cover" />
            : <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary bg-secondary text-4xl font-bold text-primary">{m.nome.slice(0, 1)}</div>}
        </div>
        <h2 className="text-xl font-bold">{m.nome}</h2>
        <p className="text-sm text-primary">{CARGO_LABEL[m.cargo] ?? m.cargo}{m.ministerio ? ` · ${m.ministerio}` : ""}</p>
        {qr && <img src={qr} alt="QR Code da credencial" className="mx-auto mt-4 h-40 w-40 rounded-xl bg-foreground p-2" />}
        <p className="mt-2 text-xs text-muted-foreground">Nº {m.id.slice(0, 8).toUpperCase()} · membro desde {dataBR(m.created_at.slice(0, 10))}</p>
      </Card>
      <label className="block cursor-pointer rounded-xl border border-dashed border-primary/50 p-3 text-center text-sm text-primary">
        <Upload className="mr-1 inline h-4 w-4" />{enviando ? "Enviando…" : m.foto ? "Trocar minha foto" : "Adicionar minha foto"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFoto(f); }} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Btn disabled={!qr} onClick={() => baixar(credencialPdf(m, igreja, qr), nomeArq)}><Download className="h-4 w-4" />Baixar PDF</Btn>
        <Btn variant="whats" disabled={!qr} onClick={() => compartilharPdf(credencialPdf(m, igreja, qr), nomeArq, "Minha credencial")}><Send className="h-4 w-4" />Enviar PDF</Btn>
      </div>
    </div>
  );
}

function MeusDados({ m, igreja }: { m: Membro; igreja: string }) {
  const linhas: [string, string][] = [
    ["Nome", m.nome], ["Telefone", m.telefone || "—"], ["Cargo", CARGO_LABEL[m.cargo] ?? m.cargo], ["Ministério", m.ministerio || "—"],
    ["Nascimento", m.nascimento ? dataBR(m.nascimento) : "—"], ["Endereço", m.endereco || "—"], ["Igreja", igreja],
  ];
  return (
    <Card>
      <dl className="space-y-2">{linhas.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-border pb-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}</dl>
      <p className="mt-3 text-xs text-muted-foreground">Para corrigir seus dados, fale com o pastor ou a secretaria.</p>
    </Card>
  );
}

function ProximosCultos() {
  const hoje = localDateKey(new Date());
  const { data = [] } = useQuery({
    queryKey: ["membro-cultos"],
    queryFn: async () => {
      const [c, e] = await Promise.all([supabase.from("cultos").select("*"), supabase.from("eventos").select("*").gte("data", hoje).order("data")]);
      if (c.error) throw c.error; if (e.error) throw e.error;
      const cultos = (c.data ?? []).map((x) => ({ id: x.id, nome: x.nome, data: dataDoCulto(x, hoje), horario: x.horario, local: "" })).filter((x) => x.data >= hoje);
      const eventos = (e.data ?? []).map((x) => ({ id: x.id, nome: x.titulo, data: x.data, horario: x.horario, local: x.local }));
      return [...cultos, ...eventos].sort((a, b) => a.data.localeCompare(b.data)).slice(0, 20);
    },
  });
  if (!data.length) return <Empty text="Nenhum culto programado." />;
  return <div className="space-y-2">{data.map((c) => <Card key={c.id + c.data}><p className="font-bold text-primary">{c.nome}</p><p className="text-sm text-muted-foreground">{dataBR(c.data)}{c.horario ? ` · ${c.horario}` : ""}{c.local ? ` · ${c.local}` : ""}</p></Card>)}</div>;
}

function MinhaEscala({ membroId }: { membroId: string }) {
  const hoje = localDateKey(new Date());
  const { data = [] } = useQuery({
    queryKey: ["minha-escala", membroId],
    queryFn: async () => {
      const r = await supabase.from("escalas").select("*").eq("membro_id", membroId).gte("data", hoje).order("data");
      if (r.error) throw r.error; return r.data ?? [];
    },
  });
  if (!data.length) return <Empty text="Você não está escalado(a) nos próximos dias." />;
  return <div className="space-y-2">{data.map((e) => <Card key={e.id}><div className="flex items-baseline justify-between gap-2"><span className="font-bold text-primary">{dataBR(e.data)}</span><span className="text-xs">{e.confirmado ? <span className="text-success">confirmado</span> : "aguardando"}</span></div><p className="text-sm">{e.funcao}</p><p className="text-xs text-muted-foreground">{e.tipo_culto}</p></Card>)}</div>;
}

export function Galeria({ staff, igrejaId }: { staff: boolean; igrejaId: string }) {
  const qc = useQueryClient();
  const [novo, setNovo] = useState<{ titulo: string; data: string; file: File | null } | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["galeria"],
    queryFn: async () => {
      const r = await supabase.from("galeria" as never).select("*").order("data", { ascending: false });
      if (r.error) throw r.error;
      const itens = (r.data ?? []) as unknown as GaleriaItem[];
      const caminhos = itens.map((i) => i.caminho).filter(Boolean) as string[];
      const urls = new Map<string, string>();
      if (caminhos.length) {
        const s = await supabase.storage.from("galeria").createSignedUrls(caminhos, 3600);
        for (const x of s.data ?? []) if (x.path && x.signedUrl) urls.set(x.path, x.signedUrl);
      }
      return itens.map((i) => ({ ...i, url: (i.caminho && urls.get(i.caminho)) || i.url }));
    },
  });
  const enviar = useMutation({
    mutationFn: async (v: { titulo: string; data: string; file: File }) => {
      const tipo = v.file.type.startsWith("video") ? "video" : "foto";
      const caminho = `${igrejaId}/${Date.now()}-${v.file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("galeria").upload(caminho, v.file, { contentType: v.file.type });
      if (up.error) throw up.error;
      const ins = await supabase.from("galeria" as never).insert({ titulo: v.titulo, data: v.data, tipo, caminho, url: caminho } as never);
      if (ins.error) { await supabase.storage.from("galeria").remove([caminho]); throw ins.error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["galeria"] }); setNovo(null); toast.success("Enviado"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const apagar = useMutation({
    mutationFn: async (i: GaleriaItem) => {
      const r = await supabase.from("galeria" as never).delete().eq("id", i.id);
      if (r.error) throw r.error;
      if (i.caminho) await supabase.storage.from("galeria").remove([i.caminho]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["galeria"] }),
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Galeria</h2>
        {staff && <Btn onClick={() => setNovo({ titulo: "", data: localDateKey(new Date()), file: null })}><Plus className="h-4 w-4" />Adicionar</Btn>}</div>
      {!data.length && <Empty text="Nenhuma foto ou vídeo ainda." />}
      <div className="grid grid-cols-2 gap-2">
        {data.map((i) => (
          <div key={i.id} className="overflow-hidden rounded-xl border border-border bg-card">
            {i.tipo === "video" ? <video src={i.url} controls playsInline className="aspect-square w-full bg-background object-cover" />
              : <a href={i.url} target="_blank" rel="noreferrer"><img src={i.url} alt={i.titulo} loading="lazy" className="aspect-square w-full object-cover" /></a>}
            <div className="flex items-center gap-1 p-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{i.titulo || "Culto"}</p><p className="text-[10px] text-muted-foreground">{dataBR(i.data)}</p></div>
              {staff && <button aria-label="Apagar" onClick={() => confirm("Apagar da galeria?") && apagar.mutate(i)} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>}</div>
          </div>
        ))}
      </div>
      {novo && (
        <Modal title="Adicionar à galeria" onClose={() => setNovo(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (novo.file) enviar.mutate({ titulo: novo.titulo, data: novo.data, file: novo.file }); }}>
            <Field label="Título"><input className={inputCls} placeholder="Ex.: Culto de Louvor" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} /></Field>
            <Field label="Data"><input type="date" required className={inputCls} value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} /></Field>
            <Field label="Foto ou vídeo (até 50 MB)"><input type="file" required accept="image/*,video/*" className={inputCls} onChange={(e) => setNovo({ ...novo, file: e.target.files?.[0] ?? null })} /></Field>
            <Btn className="w-full" disabled={enviar.isPending}>{enviar.isPending ? "Enviando…" : "Enviar"}</Btn>
          </form>
        </Modal>
      )}
    </div>
  );
}

export { Avatar };
