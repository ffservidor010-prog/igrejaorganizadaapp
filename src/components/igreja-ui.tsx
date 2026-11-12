import type { ReactNode } from "react";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { MESES, waLink } from "@/lib/igreja";
import type { Tables } from "@/integrations/supabase/types";
type Membro = Tables<"membros">;
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const rawMsg = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Erro");
export const errMsg = (e: unknown) => { const m = rawMsg(e); if (m.includes("membros_cpf_igreja_unique")) return "Já existe um membro com este CPF nesta igreja."; if (m.includes("membros_email_igreja_unique")) return "Já existe um membro com este e-mail nesta igreja."; return m; };

/* ---------- UI básicos ---------- */
export function Btn({ children, variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "whats" | "info" }) {
  const v = {
    primary: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-soft",
    ghost: "bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700",
    danger: "bg-red-600 text-white",
    whats: "bg-green-600 text-white",
    info: "bg-blue-600 text-white",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-50 ${v} ${className}`}>{children}</button>;
}
export const inputCls = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-900 dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:placeholder:text-zinc-400";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>{children}</label>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white ${className}`}>{children}</div>;
}
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3><button onClick={onClose} className="text-zinc-500 dark:text-zinc-300">✕</button></div>
        {children}
      </div>
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-300">{text}</p>;
}
export function WaBtn({ phone, msg, label }: { phone: string; msg?: string; label?: string }) {
  if (!phone) return <span className="text-xs text-zinc-500 dark:text-zinc-400">sem telefone</span>;
  return (
    <a href={waLink(phone, msg)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${label ?? ""}`}
      className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-green-600 px-3 text-white shadow-soft active:scale-95">
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
export function Avatar({ m }: { m: Pick<Membro, "nome" | "foto"> }) {
  return m.foto
    ? <img src={m.foto} alt={m.nome} className="h-12 w-12 shrink-0 rounded-full border-2 border-zinc-900 object-cover dark:border-white" />
    : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-100 font-bold text-zinc-900 dark:border-white dark:bg-zinc-800 dark:text-white">{m.nome.slice(0, 1).toUpperCase()}</div>;
}
export function MonthNav({ ano, mes, set }: { ano: number; mes: number; set: (a: number, m: number) => void }) {
  const move = (d: number) => { const dt = new Date(ano, mes - 1 + d, 1); set(dt.getFullYear(), dt.getMonth() + 1); };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-white dark:border-zinc-200 dark:bg-white dark:text-zinc-900">
      <button onClick={() => move(-1)} className="p-2 text-white dark:text-zinc-900" aria-label="Mês anterior"><ChevronLeft /></button>
      <span className="font-semibold capitalize text-white dark:text-zinc-900">{MESES[mes - 1]} {ano}</span>
      <button onClick={() => move(1)} className="p-2 text-white dark:text-zinc-900" aria-label="Próximo mês"><ChevronRight /></button>
    </div>
  );
}
