ALTER TABLE public.membros ADD COLUMN IF NOT EXISTS data_membro date, ADD COLUMN IF NOT EXISTS batismo_aguas date, ADD COLUMN IF NOT EXISTS batismo_espirito date;

CREATE TABLE public.duvidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL DEFAULT public.minha_igreja() REFERENCES public.igrejas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL DEFAULT '',
  pergunta text NOT NULL,
  resposta text NOT NULL DEFAULT '',
  respondido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.duvidas TO authenticated;
GRANT ALL ON public.duvidas TO service_role;
ALTER TABLE public.duvidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duvidas_select" ON public.duvidas FOR SELECT TO authenticated
  USING (igreja_id = public.minha_igreja() AND (user_id = auth.uid() OR public.is_staff(auth.uid())));
CREATE POLICY "duvidas_insert" ON public.duvidas FOR INSERT TO authenticated
  WITH CHECK (igreja_id = public.minha_igreja() AND user_id = auth.uid() AND resposta = '' AND respondido_em IS NULL);
CREATE POLICY "duvidas_update_staff" ON public.duvidas FOR UPDATE TO authenticated
  USING (igreja_id = public.minha_igreja() AND public.is_staff(auth.uid()))
  WITH CHECK (igreja_id = public.minha_igreja() AND public.is_staff(auth.uid()));
CREATE POLICY "duvidas_delete" ON public.duvidas FOR DELETE TO authenticated
  USING (igreja_id = public.minha_igreja() AND (public.is_staff(auth.uid()) OR (user_id = auth.uid() AND respondido_em IS NULL)));