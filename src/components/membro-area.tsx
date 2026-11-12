import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { BadgeCheck, CalendarDays, Download, Image as ImageIcon, Send, Trash2, User, Plus, HelpCircle, Sun, Moon, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { APP_NAME, CARGO_LABEL, TIPOS_CARTA, CARTA_LABEL, dataBR, preencherModeloCarta } from "@/lib/igreja";
import { dataDoCulto } from "@/lib/administracao";
import { localDateKey } from "@/lib/church-planning";
import { baixar, compartilharPdf } from "@/lib/ata-export";
import { cartaPdf } from "@/lib/carta-pdf";
import { Btn, Card, Empty, Field, Modal, Avatar, inputCls, errMsg } from "./igreja-ui";

type Membro = Tables<"membros">;
type GaleriaItem = { id: string; titulo: string; tipo: "foto" | "video"; url: string; caminho: string | null; data: string };

const VERSICULOS = [
  { t: "Eis que farei uma coisa nova, e agora sairá à luz.", r: "Isaías 43:19" },
  { t: "Porque eu bem sei os planos que tenho para vocês, planos de fazê-los prosperar.", r: "Jeremias 29:11" },
  { t: "Não temas, porque eu sou contigo.", r: "Isaías 41:10" },
  { t: "Os que esperam no Senhor renovarão as suas forças.", r: "Isaías 40:31" },
  { t: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes.", r: "Jeremias 33:3" },
  { t: "Nenhuma arma forjada contra ti prosperará.", r: "Isaías 54:17" },
  { t: "Com amor eterno te amei.", r: "Jeremias 31:3" },
];

async function reduzirFoto(file: File) {
  const img = await createImageBitmap(file);
  const s = 360; const c = document.createElement("canvas"); c.width = s; c.height = s;
  const ctx = c.getContext("2d"); if (!ctx) throw new Error("Não foi possível carregar a foto");
  const r = Math.max(s / img.width, s / img.height);
  ctx.drawImage(img, (s - img.width * r) / 2, (s - img.height * r) / 2, img.width * r, img.height * r);
  return c.toDataURL("image/jpeg", 0.8);
}

export function codigoCredencial(igrejaId: string, membroId: string) {
  const origem = typeof window !== "undefined" ? window.location.origin : "";
  return `${origem}/validar-membro?id=${membroId}&igreja=${igrejaId}`;
}

const nomeCompleto = (doc: jsPDF, nome: string, x: number, y: number, maxW: number, size: number) => {
  let f = size; doc.setFontSize(f);
  while (f > 6 && doc.getTextWidth(nome) > maxW) { f -= 0.5; doc.setFontSize(f); }
  doc.text(nome, x, y);
};

function credencialPdf(m: Membro, igreja: string, qr: string, logoUrl?: string | null): Blob {
  const doc = new jsPDF({ unit: "mm", format: [86, 120] });
  doc.setFillColor(13, 15, 20); doc.rect(0, 0, 86, 120, "F");
  doc.setTextColor(212, 175, 55); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  if (logoUrl) { try { doc.addImage(logoUrl, "JPEG", 36, 2, 14, 14); } catch {} }
  doc.text(igreja.toUpperCase(), 43, logoUrl ? 21 : 10, { align: "center", maxWidth: 78 });
  if (m.foto) { try { doc.addImage(m.foto, "JPEG", 31, 15, 24, 24); } catch {} }
  doc.setTextColor(255, 255, 255);
  const w = 78; doc.setFontSize(12); let f = 12; while (f > 6 && doc.getTextWidth(m.nome) > w) { f -= 0.5; doc.setFontSize(f); }
  doc.text(m.nome, 43, 46, { align: "center" });
  doc.setFontSize(9); doc.setTextColor(212, 175, 55); doc.text(CARGO_LABEL[m.cargo] ?? m.cargo, 43, 52, { align: "center" });
  doc.setFillColor(255, 255, 255); doc.roundedRect(21, 58, 44, 44, 2, 2, "F");
  doc.addImage(qr, "PNG", 23, 60, 40, 40);
  doc.setTextColor(180, 180, 180); doc.setFontSize(7); doc.text("Credencial de acesso", 43, 110, { align: "center" });
  return doc.output("blob");
}

export function linhasFrente(m: Membro) {
  return ([["CPF", m.cpf], ["Nascimento", m.nascimento ? dataBR(m.nascimento) : ""]] as [string, string][]).filter(([, v]) => v);
}
export function linhasVerso(m: Membro) {
  return ([
    ["Telefone", m.telefone], ["E-mail", m.email], ["Endereço", m.endereco],
    ["Batismo nas águas", m.batismo_aguas ? dataBR(m.batismo_aguas) : ""],
    ["Batismo no Espírito Santo", m.batismo_espirito ? dataBR(m.batismo_espirito) : ""],
    ["Membro desde", m.data_membro ? dataBR(m.data_membro) : ""],
  ] as [string, string][]).filter(([, v]) => v && v.trim());
}

function carteirinhaPdf(m: Membro, igreja: string, qr: string, logoUrl?: string | null): Blob {
  const doc = new jsPDF({ unit: "mm", format: [54, 86], orientation: "landscape" });
  const fundo = () => { doc.setFillColor(13, 15, 20); doc.rect(0, 0, 86, 54, "F"); doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.6); doc.rect(2, 2, 82, 50); };
  fundo(); doc.setFont("helvetica", "bold"); doc.setTextColor(212, 175, 55); doc.setFontSize(9);
  if (logoUrl) { try { doc.addImage(logoUrl, "JPEG", 4, 3.5, 9, 9); } catch {} }
  doc.text(igreja.toUpperCase(), 43, 8, { align: "center", maxWidth: 64 });
  doc.setFontSize(6); doc.setTextColor(200, 200, 200); doc.text("CARTEIRA DE MEMBRO", 43, 11.5, { align: "center" });
  if (m.foto) { try { doc.addImage(m.foto, "JPEG", 5, 15, 24, 30); } catch {} }
  doc.setTextColor(150, 150, 150); doc.setFontSize(5.5); doc.text("NOME", 32, 18);
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); nomeCompleto(doc, m.nome, 32, 22, 50, 9);
  let y = 28;
  for (const [k, v] of linhasFrente(m)) { doc.setFontSize(5.5); doc.setTextColor(150, 150, 150); doc.text(k.toUpperCase(), 32, y); doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.text(v, 32, y + 3.5); y += 8; }
  doc.setFontSize(5); doc.setTextColor(180, 180, 180); doc.text(`Nº ${m.id.slice(0, 8).toUpperCase()}`, 82, 49, { align: "right" });
  doc.addPage([54, 86], "landscape"); fundo();
  y = 8;
  for (const [k, v] of linhasVerso(m)) { doc.setFontSize(5); doc.setTextColor(150, 150, 150); doc.text(k.toUpperCase(), 5, y); doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.text(v, 5, y + 3, { maxWidth: 52 }); y += 6.5; }
  doc.setFillColor(255, 255, 255); doc.roundedRect(60, 6, 22, 22, 1, 1, "F"); doc.addImage(qr, "PNG", 61, 7, 20, 20);
  doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.3); doc.line(48, 46, 82, 46);
  doc.setFontSize(5.5); doc.setTextColor(200, 200, 200); doc.text("Assinatura do Pastor", 65, 49, { align: "center" });
  return doc.output("blob");
}

type Aba = "credencial" | "carteirinha" | "duvidas" | "dados" | "cultos" | "escala" | "galeria";

export function MembroArea({ igreja, igrejaId, tema = "claro", onToggleTema }: { igreja: string; igrejaId: string; tema?: "claro" | "escuro"; onToggleTema?: () => void }) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("credencial");
  const claro = tema === "claro";
  const [indiceVersiculo, setIndiceVersiculo] = useState(() => {
    const agora = new Date();
    const inicioAno = new Date(agora.getFullYear(), 0, 0);
    const diaDoAno = Math.floor((agora.getTime() - inicioAno.getTime()) / 86400000);
    return diaDoAno % VERSICULOS.length;
  });
  const versiculo = VERSICULOS[indiceVersiculo]!;
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
  if (error) return <Empty text={errMsg(error)} />;
  if (!m) return <p className="text-center text-sm text-muted-foreground">Carregando…</p>;
  const abas: { id: Aba; label: string; icon: typeof User }[] = [
    { id: "credencial", label: "Credencial", icon: BadgeCheck },
    { id: "dados", label: "Meus dados", icon: User },
    { id: "cultos", label: "Cultos", icon: CalendarDays },
    { id: "escala", label: "Minha escala", icon: CalendarDays },
    { id: "galeria", label: "Galeria", icon: ImageIcon },
    { id: "carteirinha", label: "Carteirinha", icon: BadgeCheck },
    { id: "duvidas", label: "Dúvidas", icon: HelpCircle },
  ];
  return (
    <div className={`space-y-4 ${claro ? "text-zinc-900" : "text-zinc-100"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-left"><h1 className="text-2xl font-bold text-primary">{igreja || APP_NAME}</h1><p className={`text-sm ${claro ? "text-zinc-600" : "text-zinc-400"}`}>Olá, {m.nome}</p></div>
        {onToggleTema && (
          <button onClick={onToggleTema} aria-label="Alternar modo claro e escuro" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${claro ? "bg-white border-zinc-200" : "bg-zinc-800 border-zinc-700"}`}>
            {claro ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-amber-400" />}
          </button>
        )}
      </div>

      {/* VERSICULO DIARIO - AREA DE MEMBRO */}
      <div className={`overflow-hidden rounded-3xl ${claro ? "bg-gradient-to-r from-amber-100 to-amber-50" : "bg-amber-900/30"}`}>
        <div className="p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-black"><BookOpen className="h-4 w-4" /> Versículo do Dia</span>
          <button onClick={() => setIndiceVersiculo((i) => (i + 1) % VERSICULOS.length)} className="text-left w-full">
            <p className={`mt-3 text-[17px] font-semibold leading-snug ${claro ? "text-zinc-900" : "text-white"}`}>“{versiculo.t}”</p>
            <p className="mt-1 font-bold text-amber-700">| {versiculo.r}</p>
            <p className={`mt-1 text-[11px] ${claro ? "text-zinc-500" : "text-zinc-400"}`}>Toque para ver o próximo versículo</p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {abas.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)} className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-semibold ${aba === a.id ? "border-amber-500 bg-amber-400 text-black" : claro ? "border-zinc-200 bg-white text-zinc-900" : "border-zinc-700 bg-zinc-800 text-white"}`}>
            <a.icon className="h-5 w-5" />{a.label}
          </button>
        ))}
      </div>
      {aba === "credencial" && <Credencial m={m} igreja={igreja} igrejaId={igrejaId} />}
      {aba === "carteirinha" && <Credencial carteirinha m={m} igreja={igreja} igrejaId={igrejaId} />}
      {aba === "duvidas" && <Duvidas staff={false} nome={m.nome} />}
      {aba === "dados" && <MeusDados m={m} igreja={igreja} />}
      {aba === "cultos" && <ProximosCultos />}
      {aba === "escala" && <MinhaEscala membroId={m.id} />}
      {aba === "galeria" && <Galeria staff={false} igrejaId={igrejaId} />}
    </div>
  );
}

function useQr(igrejaId: string, id: string) {
  const [qr, setQr] = useState("");
  useEffect(() => { QRCode.toDataURL(codigoCredencial(igrejaId, id), { margin: 1, width: 320 }).then(setQr); }, [igrejaId, id]);
  return qr;
}

function Credencial({ m, igreja, igrejaId, carteirinha = false }: { carteirinha?: boolean; m: Membro; igreja: string; igrejaId: string }) {
  const qr = useQr(igrejaId, m.id);
  const nomeArq = `${carteirinha ? "carteirinha" : "credencial"}-${m.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  const pdf = () => (carteirinha ? carteirinhaPdf(m, igreja, qr) : credencialPdf(m, igreja, qr));
  const foto = m.foto ? <img src={m.foto} alt={m.nome} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-secondary text-3xl font-bold text-primary">{m.nome.slice(0, 1)}</div>;
  return (
    <div className="space-y-3">
      {carteirinha ? <>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Frente</p>
        <Card className="border-primary/50 p-3">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-primary">{igreja}</p>
          <p className="mb-2 text-center text-[10px] uppercase text-muted-foreground">Carteira de membro</p>
          <div className="flex gap-3">
            <div className="h-28 shrink-0 overflow-hidden rounded-md border-2 border-primary" style={{ width: "5.5rem" }}>{foto}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] uppercase text-muted-foreground">Nome</p>
              <p className="truncate whitespace-nowrap text-sm font-bold">{m.nome}</p>
              {linhasFrente(m).map(([k, v]) => <div key={k}><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="text-sm font-semibold">{v}</p></div>)}
            </div>
          </div>
        </Card>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Verso</p>
        <Card className="border-primary/50 p-3">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1 space-y-1">{linhasVerso(m).map(([k, v]) => <div key={k}><p className="text-[10px] uppercase text-muted-foreground">{k}</p><p className="break-words text-sm font-semibold">{v}</p></div>)}</div>
            {qr && <img src={qr} alt="QR Code de validação" className="h-24 w-24 shrink-0 rounded-md bg-white p-1" />}
          </div>
          <div className="mt-6 border-t border-primary pt-1 text-center text-[10px] text-muted-foreground">Assinatura do Pastor</div>
        </Card>
      </> : (
        <Card className="border-primary/40 bg-gradient-to-b from-card to-secondary text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">{igreja}</p>
          <div className="mx-auto my-3 h-28 w-28 overflow-hidden rounded-full border-4 border-primary">{foto}</div>
          <h2 className="text-xl font-bold">{m.nome}</h2>
          <p className="text-sm text-primary">{CARGO_LABEL[m.cargo] ?? m.cargo}</p>
          {qr && <img src={qr} alt="QR Code da credencial" className="mx-auto mt-4 h-40 w-40 rounded-xl bg-white p-2" />}
          <p className="mt-2 text-xs text-muted-foreground">Credencial de acesso rápido</p>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Btn disabled={!qr} onClick={() => baixar(pdf(), nomeArq)}><Download className="h-4 w-4" />Baixar PDF</Btn>
        <Btn variant="whats" disabled={!qr} onClick={() => compartilharPdf(pdf(), nomeArq, carteirinha ? "Minha carteirinha" : "Minha credencial")}><Send className="h-4 w-4" />Enviar PDF</Btn>
      </div>
    </div>
  );
}

function MeusDados({ m, igreja }: { m: Membro; igreja: string }) {
  const linhas = ([["Nome", m.nome], ["CPF", m.cpf], ["E-mail", m.email], ["Telefone", m.telefone], ["Cargo", CARGO_LABEL[m.cargo] ?? m.cargo], ["Ministério", m.ministerio],
    ["Nascimento", m.nascimento ? dataBR(m.nascimento) : ""], ["Membro desde", m.data_membro ? dataBR(m.data_membro) : ""],
    ["Batismo nas águas", m.batismo_aguas ? dataBR(m.batismo_aguas) : ""], ["Batismo no Espírito Santo", m.batismo_espirito ? dataBR(m.batismo_espirito) : ""], ["Endereço", m.endereco], ["Igreja", igreja]] as [string, string][]).filter(([, v]) => v && v.trim());
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

type Duvida = { id: string; nome: string; pergunta: string; resposta: string; respondido_em: string | null; created_at: string };

export function Duvidas({ staff, nome = "" }: { staff: boolean; nome?: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [resp, setResp] = useState<Record<string, string>>({});
  const { data = [] } = useQuery({
    queryKey: ["duvidas"],
    queryFn: async () => {
      const r = await supabase.from("duvidas" as never).select("*").order("created_at", { ascending: false });
      if (r.error) throw r.error; return (r.data ?? []) as unknown as Duvida[];
    },
  });
  const ok = () => qc.invalidateQueries({ queryKey: ["duvidas"] });
  const enviar = useMutation({
    mutationFn: async () => { const r = await supabase.from("duvidas" as never).insert({ nome, pergunta: texto.trim() } as never); if (r.error) throw r.error; },
    onSuccess: () => { setTexto(""); ok(); toast.success("Dúvida enviada"); }, onError: (e) => toast.error(errMsg(e)),
  });
  const responder = useMutation({
    mutationFn: async (d: Duvida) => { const r = await supabase.from("duvidas" as never).update({ resposta: resp[d.id] ?? d.resposta, respondido_em: new Date().toISOString() } as never).eq("id", d.id); if (r.error) throw r.error; },
    onSuccess: () => { ok(); toast.success("Resposta salva"); }, onError: (e) => toast.error(errMsg(e)),
  });
  const apagar = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.from("duvidas" as never).delete().eq("id", id); if (r.error) throw r.error; },
    onSuccess: ok, onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Dúvidas {staff ? "dos membros" : ""}</h2>
      {!staff && (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) enviar.mutate(); }}>
          <textarea required rows={3} className={inputCls} placeholder="Escreva sua dúvida para o pastor…" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <Btn className="w-full" disabled={enviar.isPending}><Send className="h-4 w-4" />Enviar dúvida</Btn>
        </form>
      )}
      {!data.length && <Empty text="Nenhuma dúvida ainda." />}
      {data.map((d) => (
        <Card key={d.id} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2"><span className="font-bold text-primary">{d.nome || "Membro"}</span>
            <span className="text-xs">{d.respondido_em ? <span className="text-success">respondida</span> : <span className="text-destructive">aguardando</span>} · {dataBR(d.created_at.slice(0, 10))}</span></div>
          <p className="text-sm">{d.pergunta}</p>
          {staff ? (
            <div className="space-y-2">
              <textarea rows={2} className={inputCls} placeholder="Resposta" value={resp[d.id] ?? d.resposta} onChange={(e) => setResp({ ...resp, [d.id]: e.target.value })} />
              <div className="flex gap-2"><Btn className="flex-1" disabled={responder.isPending} onClick={() => responder.mutate(d)}>Responder</Btn>
                <Btn variant="danger" aria-label="Apagar" onClick={() => confirm("Apagar dúvida?") && apagar.mutate(d.id)}><Trash2 className="h-4 w-4" /></Btn></div>
            </div>
          ) : d.resposta ? <p className="rounded-xl bg-secondary p-2 text-sm"><span className="font-semibold text-primary">Resposta: </span>{d.resposta}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export { Avatar };
