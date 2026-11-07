-- 1. Cargos por igreja
CREATE TABLE public.cargos (
  id uuid not null default gen_random_uuid() primary key,
  igreja_id uuid not null references public.igrejas(id) on delete cascade default public.minha_igreja(),
  nome text not null,
  created_at timestamp with time zone not null default now(),
  unique (igreja_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Igreja ve seus cargos" ON public.cargos FOR SELECT TO authenticated USING (igreja_id = public.minha_igreja());
CREATE POLICY "Admin gerencia cargos" ON public.cargos FOR ALL TO authenticated USING (public.is_igreja_admin(auth.uid())) WITH CHECK (public.is_igreja_admin(auth.uid()));

INSERT INTO public.cargos (igreja_id, nome)
SELECT i.id, c.nome FROM public.igrejas i
CROSS JOIN (VALUES ('Membro'),('Pastor'),('Pastora'),('Presbítero'),('Diácono'),('Diaconisa'),('Líder'),('Louvor')) AS c(nome)
ON CONFLICT DO NOTHING;

-- 2. Pedidos de oração pelo membro
ALTER TABLE public.pedidos_oracao ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.pedidos_oracao ADD COLUMN IF NOT EXISTS motivo text not null default '';
ALTER TABLE public.pedidos_oracao ADD COLUMN IF NOT EXISTS resposta text not null default '';
CREATE POLICY "Membro cria seu pedido de oracao" ON public.pedidos_oracao FOR INSERT TO authenticated WITH CHECK (igreja_id = public.minha_igreja() AND user_id = auth.uid());
CREATE POLICY "Membro ve seu pedido de oracao" ON public.pedidos_oracao FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Pedidos de carta
CREATE TABLE public.pedidos_carta (
  id uuid not null default gen_random_uuid() primary key,
  igreja_id uuid not null references public.igrejas(id) on delete cascade default public.minha_igreja(),
  membro_id uuid not null references public.membros(id) on delete cascade,
  user_id uuid not null,
  tipo text not null,
  igreja_destino text not null default '',
  cidade text not null default '',
  motivo text not null default '',
  status text not null default 'pendente',
  resposta text not null default '',
  respondido_em timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_carta TO authenticated;
GRANT ALL ON public.pedidos_carta TO service_role;
ALTER TABLE public.pedidos_carta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membro cria seu pedido de carta" ON public.pedidos_carta FOR INSERT TO authenticated WITH CHECK (igreja_id = public.minha_igreja() AND user_id = auth.uid());
CREATE POLICY "Membro ve seu pedido de carta" ON public.pedidos_carta FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff ve pedidos de carta" ON public.pedidos_carta FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Admin decide pedidos de carta" ON public.pedidos_carta FOR UPDATE TO authenticated USING (public.is_igreja_admin(auth.uid())) WITH CHECK (public.is_igreja_admin(auth.uid()));
CREATE POLICY "Admin apaga pedidos de carta" ON public.pedidos_carta FOR DELETE TO authenticated USING (public.is_igreja_admin(auth.uid()));

-- 4. Modelos de carta editáveis por igreja
CREATE TABLE public.modelos_carta (
  id uuid not null default gen_random_uuid() primary key,
  igreja_id uuid not null references public.igrejas(id) on delete cascade default public.minha_igreja(),
  tipo text not null,
  texto text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (igreja_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modelos_carta TO authenticated;
GRANT ALL ON public.modelos_carta TO service_role;
ALTER TABLE public.modelos_carta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Igreja ve seus modelos de carta" ON public.modelos_carta FOR SELECT TO authenticated USING (igreja_id = public.minha_igreja());
CREATE POLICY "Admin gerencia modelos de carta" ON public.modelos_carta FOR ALL TO authenticated USING (public.is_igreja_admin(auth.uid())) WITH CHECK (public.is_igreja_admin(auth.uid()));

INSERT INTO public.modelos_carta (igreja_id, tipo, texto)
SELECT i.id, t.tipo, t.texto FROM public.igrejas i
CROSS JOIN (VALUES
  ('mudanca', 'CARTA DE MUDANÇA

[nome da igreja]

À Igreja [igreja de destino], em [cidade].

Prezados irmãos,

Apresentamos a o irmão(ã) [nome do membro], CPF [CPF], membro desta igreja desde [Membro desde], que se muda para [cidade] e solicita sua transferência para os cuidados dessa congregação.

Motivo: [motivo]

Recomendamos que seja recebido(a) com o amor de Cristo.

[cidade], [data].

_______________________________
[pastor]
Pastor(a)'),
  ('recomendacao', 'CARTA DE RECOMENDAÇÃO

[nome da igreja]

A quem possa interessar,

Recomendamos a o irmão(ã) [nome do membro], CPF [CPF], membro desta igreja desde [Membro desde], pessoa de conduta cristã e digna de confiança.

Motivo: [motivo]

[cidade], [data].

_______________________________
[pastor]
Pastor(a)')
) AS t(tipo, texto)
ON CONFLICT DO NOTHING;

-- 5. Logo da igreja (admin troca via função segura; igrejas não aceita update direto)
ALTER TABLE public.igrejas ADD COLUMN IF NOT EXISTS logo_url text;
CREATE OR REPLACE FUNCTION public.salvar_logo(_url text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_igreja_admin(auth.uid()) THEN RAISE EXCEPTION 'Apenas o administrador pode trocar a logo.'; END IF;
  UPDATE public.igrejas SET logo_url = _url WHERE id = public.minha_igreja();
END $$;
REVOKE ALL ON FUNCTION public.salvar_logo(text) FROM public;
GRANT EXECUTE ON FUNCTION public.salvar_logo(text) TO authenticated;

-- 6. definir_papel: escopo por igreja, sem auto-rebaixamento, sempre 1 admin
CREATE OR REPLACE FUNCTION public.definir_papel(_user_id uuid, _role app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _igreja uuid;
BEGIN
  IF NOT public.is_igreja_admin(auth.uid()) THEN RAISE EXCEPTION 'Apenas o administrador da igreja pode alterar acessos.'; END IF;
  _igreja := public.minha_igreja();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND igreja_id = _igreja) THEN RAISE EXCEPTION 'Este usuário não pertence à sua igreja.'; END IF;
  IF _user_id = auth.uid() AND _role <> 'admin' THEN RAISE EXCEPTION 'Você não pode remover o seu próprio acesso de administrador.'; END IF;
  IF _role <> 'admin' AND (SELECT count(*) FROM public.user_roles ur JOIN public.profiles p ON p.id = ur.user_id WHERE ur.role = 'admin' AND p.igreja_id = _igreja) <= 1 THEN RAISE EXCEPTION 'A igreja precisa ter pelo menos um administrador.'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END $$;