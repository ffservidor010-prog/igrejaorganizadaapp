CREATE TABLE public.igrejas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo_convite text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text),1,8)),
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.igrejas TO authenticated;
GRANT ALL ON public.igrejas TO service_role;
ALTER TABLE public.igrejas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN igreja_id uuid REFERENCES public.igrejas(id) ON DELETE SET NULL;

-- Igreja atual
DO $$
DECLARE g uuid; t text;
BEGIN
  INSERT INTO public.igrejas (nome, criado_por)
  VALUES ('Igreja Oiapoque', (SELECT user_id FROM public.user_roles WHERE role='admin' LIMIT 1))
  RETURNING id INTO g;
  UPDATE public.profiles SET igreja_id = g;
  FOREACH t IN ARRAY ARRAY['membros','escalas','eventos','atas','dizimos','ofertas','avisos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN igreja_id uuid REFERENCES public.igrejas(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET igreja_id = %L', t, g);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN igreja_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX %I ON public.%I(igreja_id)', t || '_igreja_idx', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.minha_igreja()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT igreja_id FROM public.profiles WHERE id = auth.uid()
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role IN ('admin','pastor') AND p.igreja_id IS NOT NULL)
$$;
CREATE OR REPLACE FUNCTION public.is_igreja_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id = r.user_id
    WHERE r.user_id = _user_id AND r.role = 'admin' AND p.igreja_id IS NOT NULL)
$$;
ALTER TABLE public.membros ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.escalas ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.eventos ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.atas ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.dizimos ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.ofertas ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();
ALTER TABLE public.avisos ALTER COLUMN igreja_id SET DEFAULT public.minha_igreja();

CREATE POLICY "ver propria igreja" ON public.igrejas FOR SELECT TO authenticated USING (id = public.minha_igreja());

-- Políticas por igreja
DO $$
DECLARE t text; w text;
BEGIN
  FOREACH t IN ARRAY ARRAY['membros','escalas','eventos','atas','dizimos','ofertas','avisos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "ver %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "staff cria %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "staff edita %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "staff apaga %s" ON public.%I', t, t);
    w := CASE WHEN t IN ('dizimos','ofertas') THEN 'public.is_igreja_admin(auth.uid())' ELSE 'public.is_staff(auth.uid())' END;
    IF t IN ('dizimos','ofertas') THEN
      EXECUTE format('CREATE POLICY "igreja ver %s" ON public.%I FOR SELECT TO authenticated USING (igreja_id = public.minha_igreja() AND %s)', t, t, w);
    ELSE
      EXECUTE format('CREATE POLICY "igreja ver %s" ON public.%I FOR SELECT TO authenticated USING (igreja_id = public.minha_igreja())', t, t);
    END IF;
    EXECUTE format('CREATE POLICY "igreja cria %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (igreja_id = public.minha_igreja() AND %s)', t, t, w);
    EXECUTE format('CREATE POLICY "igreja edita %s" ON public.%I FOR UPDATE TO authenticated USING (igreja_id = public.minha_igreja() AND %s) WITH CHECK (igreja_id = public.minha_igreja() AND %s)', t, t, w, w);
    EXECUTE format('CREATE POLICY "igreja apaga %s" ON public.%I FOR DELETE TO authenticated USING (igreja_id = public.minha_igreja() AND %s)', t, t, w);
  END LOOP;
END $$;

-- Escala só com membro da mesma igreja
CREATE OR REPLACE FUNCTION public.check_escala_membro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.membros WHERE id = NEW.membro_id AND igreja_id = NEW.igreja_id) THEN
    RAISE EXCEPTION 'Membro não pertence a esta igreja';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER escalas_membro_mesma_igreja BEFORE INSERT OR UPDATE ON public.escalas FOR EACH ROW EXECUTE FUNCTION public.check_escala_membro();

-- Perfis
DROP POLICY IF EXISTS "perfil visivel" ON public.profiles;
DROP POLICY IF EXISTS "cria proprio perfil" ON public.profiles;
CREATE POLICY "perfil mesma igreja" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR (igreja_id IS NOT NULL AND igreja_id = public.minha_igreja()));
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (nome, telefone) ON public.profiles TO authenticated;

-- Papéis
DROP POLICY IF EXISTS "ve proprios papeis" ON public.user_roles;
DROP POLICY IF EXISTS "admin cria papeis" ON public.user_roles;
DROP POLICY IF EXISTS "admin apaga papeis" ON public.user_roles;
REVOKE INSERT, DELETE ON public.user_roles FROM authenticated;
CREATE POLICY "papeis mesma igreja" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.igreja_id = public.minha_igreja()));

-- Novo usuário: sem igreja até escolher
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome',''), COALESCE(NEW.raw_user_meta_data->>'telefone',''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.criar_igreja(_nome text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF length(trim(coalesce(_nome,''))) < 2 THEN RAISE EXCEPTION 'Informe o nome da igreja'; END IF;
  IF (SELECT igreja_id FROM profiles WHERE id = auth.uid()) IS NOT NULL THEN RAISE EXCEPTION 'Você já pertence a uma igreja'; END IF;
  INSERT INTO igrejas (nome, criado_por) VALUES (trim(_nome), auth.uid()) RETURNING id INTO g;
  INSERT INTO profiles (id) VALUES (auth.uid()) ON CONFLICT (id) DO NOTHING;
  UPDATE profiles SET igreja_id = g WHERE id = auth.uid();
  DELETE FROM user_roles WHERE user_id = auth.uid();
  INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  RETURN g;
END $$;

CREATE OR REPLACE FUNCTION public.entrar_igreja(_codigo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF (SELECT igreja_id FROM profiles WHERE id = auth.uid()) IS NOT NULL THEN RAISE EXCEPTION 'Você já pertence a uma igreja'; END IF;
  SELECT id INTO g FROM igrejas WHERE codigo_convite = upper(trim(_codigo));
  IF g IS NULL THEN RAISE EXCEPTION 'Código de convite inválido'; END IF;
  INSERT INTO profiles (id) VALUES (auth.uid()) ON CONFLICT (id) DO NOTHING;
  UPDATE profiles SET igreja_id = g WHERE id = auth.uid();
  DELETE FROM user_roles WHERE user_id = auth.uid();
  INSERT INTO user_roles (user_id, role) VALUES (auth.uid(), 'membro');
  RETURN g;
END $$;

CREATE OR REPLACE FUNCTION public.gerar_codigo_convite()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  IF NOT is_igreja_admin(auth.uid()) THEN RAISE EXCEPTION 'Apenas o ADM'; END IF;
  c := upper(substr(md5(random()::text || clock_timestamp()::text),1,8));
  UPDATE igrejas SET codigo_convite = c WHERE id = minha_igreja();
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.definir_papel(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_igreja_admin(auth.uid()) THEN RAISE EXCEPTION 'Apenas o ADM'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'Você não pode alterar seu próprio acesso'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _user_id AND igreja_id = minha_igreja()) THEN
    RAISE EXCEPTION 'Pessoa não pertence à sua igreja';
  END IF;
  DELETE FROM user_roles WHERE user_id = _user_id;
  INSERT INTO user_roles (user_id, role) VALUES (_user_id, _role);
END $$;

REVOKE EXECUTE ON FUNCTION public.minha_igreja(), public.is_igreja_admin(uuid), public.criar_igreja(text), public.entrar_igreja(text), public.gerar_codigo_convite(), public.definir_papel(uuid, public.app_role), public.check_escala_membro() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.minha_igreja(), public.is_igreja_admin(uuid), public.criar_igreja(text), public.entrar_igreja(text), public.gerar_codigo_convite(), public.definir_papel(uuid, public.app_role) TO authenticated;