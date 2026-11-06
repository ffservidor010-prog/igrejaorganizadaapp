ALTER TABLE public.membros ADD COLUMN IF NOT EXISTS cpf text NOT NULL DEFAULT '', ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS membros_cpf_igreja_unique ON public.membros (igreja_id, cpf) WHERE cpf <> '';
CREATE UNIQUE INDEX IF NOT EXISTS membros_email_igreja_unique ON public.membros (igreja_id, lower(email)) WHERE email <> '';

DROP POLICY IF EXISTS "igreja apaga membros" ON public.membros;
DROP POLICY IF EXISTS "igreja cria membros" ON public.membros;
DROP POLICY IF EXISTS "igreja edita membros" ON public.membros;
CREATE POLICY "igreja apaga membros" ON public.membros FOR DELETE TO authenticated USING (igreja_id = public.minha_igreja() AND public.is_igreja_admin(auth.uid()));
CREATE POLICY "igreja cria membros" ON public.membros FOR INSERT TO authenticated WITH CHECK (igreja_id = public.minha_igreja() AND public.is_igreja_admin(auth.uid()));
CREATE POLICY "igreja edita membros" ON public.membros FOR UPDATE TO authenticated USING (igreja_id = public.minha_igreja() AND public.is_igreja_admin(auth.uid())) WITH CHECK (igreja_id = public.minha_igreja() AND public.is_igreja_admin(auth.uid()));

REVOKE EXECUTE ON FUNCTION public.atualizar_minha_foto(text) FROM authenticated, anon, public;

CREATE OR REPLACE FUNCTION public.meu_membro() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ig uuid := public.minha_igreja(); _id uuid; _p record; _email text;
BEGIN
  IF auth.uid() IS NULL OR _ig IS NULL THEN RAISE EXCEPTION 'Entre em uma igreja primeiro'; END IF;
  SELECT id INTO _id FROM membros WHERE user_id = auth.uid() AND igreja_id = _ig;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid();
  UPDATE membros SET user_id = auth.uid() WHERE id = (SELECT id FROM membros WHERE igreja_id = _ig AND user_id IS NULL AND email <> '' AND lower(email) = _email LIMIT 1) RETURNING id INTO _id;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  SELECT nome, telefone INTO _p FROM profiles WHERE id = auth.uid();
  INSERT INTO membros (nome, telefone, cargo, igreja_id, user_id, email)
  VALUES (COALESCE(NULLIF(_p.nome, ''), 'Membro'), COALESCE(_p.telefone, ''), 'membro', _ig, auth.uid(), COALESCE(_email, ''))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.validar_membro(_id uuid, _igreja uuid)
RETURNS TABLE(nome text, foto text, cpf text, ativo boolean, igreja text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.nome, m.foto,
    CASE WHEN length(regexp_replace(m.cpf, '\D', '', 'g')) = 11 THEN '***.' || substr(regexp_replace(m.cpf, '\D', '', 'g'), 4, 3) || '.***-' || right(regexp_replace(m.cpf, '\D', '', 'g'), 2) ELSE '' END,
    m.ativo, i.nome
  FROM membros m JOIN igrejas i ON i.id = m.igreja_id
  WHERE m.id = _id AND m.igreja_id = _igreja
$$;
REVOKE EXECUTE ON FUNCTION public.validar_membro(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.validar_membro(uuid, uuid) TO anon, authenticated;