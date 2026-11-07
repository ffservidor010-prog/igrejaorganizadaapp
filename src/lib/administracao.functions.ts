import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

const table = z.enum(["membros", "escalas", "eventos", "galeria", "atas", "dizimos", "ofertas", "avisos", "cultos", "setores", "visitantes", "pedidos_oracao", "cargos", "modelos_carta", "pedidos_carta"]);
export type TableName = z.infer<typeof table>;
export const listarRegistros = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ table, order: z.string(), asc: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { data: igrejaId, error: igrejaError } = await context.supabase.rpc("minha_igreja");
    if (igrejaError || !igrejaId) throw new Error("Escolha sua igreja primeiro.");
    const rows: Tables<TableName>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from(data.table).select("*").eq("igreja_id", igrejaId).order(data.order, { ascending: data.asc }).order("id").range(offset, offset + 999);
      if (result.error) throw new Error(result.error.message);
      rows.push(...(result.data ?? []));
      if ((result.data?.length ?? 0) < 1000) break;
    }
    return rows;
  });
export const salvarRegistro = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ table, id: z.string().uuid().optional(), values: z.record(z.unknown()) }))
  .handler(async ({ data, context }) => {
    const { data: igrejaId, error } = await context.supabase.rpc("minha_igreja");
    if (error || !igrejaId) throw new Error("Escolha sua igreja primeiro.");
    const { id: _id, igreja_id: _igreja, created_at: _created, updated_at: _updated, ...fields } = data.values;
    const values = { ...fields, igreja_id: igrejaId };
    const q = data.id ? context.supabase.from(data.table).update(values as never).eq("id", data.id).eq("igreja_id", igrejaId) : context.supabase.from(data.table).insert(values as never);
    const result = await q.select("id").single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });
export const apagarRegistro = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ table, id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: igrejaId } = await context.supabase.rpc("minha_igreja");
    if (!igrejaId) throw new Error("Escolha sua igreja primeiro.");
    const result = await context.supabase.from(data.table).delete().eq("id", data.id).eq("igreja_id", igrejaId).select("id").single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });
export const converterVisitante = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("converter_visitante", { _visitante_id: data.id });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });