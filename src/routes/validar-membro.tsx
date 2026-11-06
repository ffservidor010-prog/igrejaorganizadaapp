import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { BadgeCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/validar-membro")({
  validateSearch: z.object({ id: z.string().catch(""), igreja: z.string().catch("") }),
  ssr: false,
  head: () => ({
    meta: [
      { title: "Validar membro — Igreja Organizada" },
      { name: "description", content: "Confirme se a carteirinha de membro é válida e está ativa." },
      { property: "og:title", content: "Validar membro" },
      { property: "og:description", content: "Verificação da carteirinha de membro da igreja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Validar,
});

const uuid = /^[0-9a-f-]{36}$/i;

function Validar() {
  const { id, igreja } = Route.useSearch();
  const ok = uuid.test(id) && uuid.test(igreja);
  const { data, isLoading } = useQuery({
    queryKey: ["validar", id, igreja],
    enabled: ok,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("validar_membro" as never, { _id: id, _igreja: igreja } as never);
      if (error) throw error;
      return ((data ?? []) as unknown as { nome: string; foto: string | null; cpf: string; ativo: boolean; igreja: string }[])[0] ?? null;
    },
  });
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-primary/40 bg-card p-6 text-center">
        {ok && isLoading ? <p className="text-muted-foreground">Verificando…</p> : !data ? (
          <><XCircle className="mx-auto h-14 w-14 text-destructive" /><h1 className="mt-3 text-xl font-bold">Carteirinha não encontrada</h1></>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">{data.igreja}</p>
            <div className="mx-auto my-4 h-28 w-28 overflow-hidden rounded-full border-4 border-primary">
              {data.foto ? <img src={data.foto} alt={data.nome} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl font-bold text-primary">{data.nome.slice(0, 1)}</div>}
            </div>
            <h1 className="text-xl font-bold">{data.nome}</h1>
            {data.cpf && <p className="text-sm text-muted-foreground">CPF {data.cpf}</p>}
            {data.ativo
              ? <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/20 px-4 py-2 font-bold text-success"><BadgeCheck className="h-5 w-5" />MEMBRO ATIVO</p>
              : <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-destructive/20 px-4 py-2 font-bold text-destructive"><XCircle className="h-5 w-5" />MEMBRO INATIVO</p>}
          </>
        )}
      </div>
    </main>
  );
}
