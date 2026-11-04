ALTER TABLE public.membros ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "igreja ver membros" ON public.membros;
CREATE POLICY "igreja ver membros" ON public.membros FOR SELECT TO authenticated
USING (igreja_id = public.minha_igreja() AND (public.is_staff(auth.uid()) OR user_id = auth.uid()));

DROP POLICY IF EXISTS "igreja ver escalas" ON public.escalas;
CREATE POLICY "igreja ver escalas" ON public.escalas FOR SELECT TO authenticated
USING (igreja_id = public.minha_igreja() AND (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.membros m WHERE m.id = escalas.membro_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "igreja ver atas" ON public.atas;
CREATE POLICY "igreja ver atas" ON public.atas FOR SELECT TO authenticated
USING (igreja_id = public.minha_igreja() AND public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.meu_membro()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ig uuid := public.minha_igreja(); _id uuid; _p record;
BEGIN
  IF auth.uid() IS NULL OR _ig IS NULL THEN RAISE EXCEPTION 'Entre em uma igreja primeiro'; END IF;
  SELECT id INTO _id FROM membros WHERE user_id = auth.uid() AND igreja_id = _ig;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  SELECT nome, telefone INTO _p FROM profiles WHERE id = auth.uid();
  INSERT INTO membros (nome, telefone, cargo, igreja_id, user_id)
  VALUES (COALESCE(NULLIF(_p.nome, ''), 'Membro'), COALESCE(_p.telefone, ''), 'membro', _ig, auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.atualizar_minha_foto(_foto text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(_foto) > 600000 THEN RAISE EXCEPTION 'Foto muito grande'; END IF;
  UPDATE membros SET foto = _foto WHERE user_id = auth.uid() AND igreja_id = public.minha_igreja();
END $$;

REVOKE EXECUTE ON FUNCTION public.meu_membro() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.atualizar_minha_foto(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.meu_membro() TO authenticated;
GRANT EXECUTE ON FUNCTION public.atualizar_minha_foto(text) TO authenticated;

CREATE TABLE public.galeria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  igreja_id uuid NOT NULL DEFAULT public.minha_igreja() REFERENCES public.igrejas(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'foto' CHECK (tipo IN ('foto','video')),
  url text NOT NULL,
  caminho text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galeria TO authenticated;
GRANT ALL ON public.galeria TO service_role;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
CREATE POLICY galeria_read ON public.galeria FOR SELECT TO authenticated USING (igreja_id = public.minha_igreja());
CREATE POLICY galeria_write ON public.galeria FOR ALL TO authenticated
USING (igreja_id = public.minha_igreja() AND public.is_staff(auth.uid()))
WITH CHECK (igreja_id = public.minha_igreja() AND public.is_staff(auth.uid()));

CREATE POLICY "galeria ler arquivos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'galeria' AND (storage.foldername(name))[1] = public.minha_igreja()::text);
CREATE POLICY "galeria enviar arquivos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'galeria' AND (storage.foldername(name))[1] = public.minha_igreja()::text AND public.is_staff(auth.uid()));
CREATE POLICY "galeria apagar arquivos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'galeria' AND (storage.foldername(name))[1] = public.minha_igreja()::text AND public.is_staff(auth.uid()));