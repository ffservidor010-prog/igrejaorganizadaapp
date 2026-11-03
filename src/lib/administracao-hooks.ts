import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listarRegistros, salvarRegistro, apagarRegistro, type TableName } from "./administracao.functions";

export function useRows<T>(table: TableName, order: string, asc = true) {
  const list = useServerFn(listarRegistros);
  return useQuery({ queryKey: [table], queryFn: async () => (await list({ data: { table, order, asc } })) as T[] });
}
export function useSave(table: TableName) {
  const qc = useQueryClient(); const save = useServerFn(salvarRegistro);
  return useMutation({ mutationFn: ({ id, values }: { id?: string | undefined; values: Record<string, unknown> }) => save({ data: { table, id, values } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); toast.success("Salvo"); }, onError: e => toast.error(e.message) });
}
export function useRemove(table: TableName) {
  const qc = useQueryClient(); const remove = useServerFn(apagarRegistro);
  return useMutation({ mutationFn: (id: string) => remove({ data: { table, id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); toast.success("Apagado"); }, onError: e => toast.error(e.message) });
}