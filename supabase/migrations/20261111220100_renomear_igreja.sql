CREATE OR REPLACE FUNCTION public.renomear_igreja(_nome text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_igreja uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF length(trim(coalesce(_nome,''))) < 2 THEN RAISE EXCEPTION 'Informe o nome da igreja'; END IF;
  SELECT igreja_id INTO v_igreja FROM profiles WHERE id = auth.uid();
  IF v_igreja IS NULL THEN RAISE EXCEPTION 'Você não pertence a uma igreja'; END IF;
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Somente o ADM pode alterar o nome da igreja';
  END IF;
  UPDATE igrejas SET nome = trim(_nome) WHERE id = v_igreja;
END $$;
