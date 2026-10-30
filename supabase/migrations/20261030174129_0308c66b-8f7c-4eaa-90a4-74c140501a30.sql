CREATE TYPE public.app_role AS ENUM ('admin','pastor','lider','membro');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','pastor'))
$$;

CREATE POLICY "perfil visivel" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "edita proprio perfil" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "cria proprio perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "ve proprios papeis" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome',''), COALESCE(NEW.raw_user_meta_data->>'telefone',''))
  ON CONFLICT (id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'membro');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL DEFAULT '',
  cargo text NOT NULL DEFAULT 'membro' CHECK (cargo IN ('membro','lider','pastor','admin')),
  ministerio text NOT NULL DEFAULT '',
  foto text,
  ativo boolean NOT NULL DEFAULT true,
  nascimento date,
  endereco text NOT NULL DEFAULT '',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.escalas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo_culto text NOT NULL,
  funcao text NOT NULL,
  membro_id uuid NOT NULL REFERENCES public.membros(id) ON DELETE CASCADE,
  confirmado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  data date NOT NULL,
  horario text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  local text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.atas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano int NOT NULL,
  data_reuniao date,
  local text NOT NULL DEFAULT '',
  presidente text NOT NULL DEFAULT '',
  secretario text NOT NULL DEFAULT '',
  pauta text NOT NULL DEFAULT '',
  presentes text NOT NULL DEFAULT '',
  decisoes text NOT NULL DEFAULT '',
  texto_completo text NOT NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dizimos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor numeric(12,2) NOT NULL,
  data date NOT NULL,
  obs text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ofertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor numeric(12,2) NOT NULL,
  data date NOT NULL,
  obs text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['membros','escalas','eventos','atas','dizimos','ofertas','avisos'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "ver %s" ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "staff cria %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "staff edita %s" ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "staff apaga %s" ON public.%I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))', t, t);
  END LOOP;
END $$;

CREATE INDEX escalas_data_idx ON public.escalas(data);
CREATE INDEX dizimos_data_idx ON public.dizimos(data);
CREATE INDEX ofertas_data_idx ON public.ofertas(data);