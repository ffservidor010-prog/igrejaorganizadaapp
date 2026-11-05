<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Multi-church: every data table has `igreja_id` (default `minha_igreja()`) and RLS scopes all reads/writes to the caller's `profiles.igreja_id`; never query or write across churches.
- Joining/creating a church and changing roles only go through security-definer RPCs (`criar_igreja`, `entrar_igreja`, `definir_papel`, `gerar_codigo_convite`); clients cannot write `user_roles` or `profiles.igreja_id` directly.
- Dízimos/ofertas are admin-only (`is_igreja_admin`); other content is editable by admin/pastor (`is_staff`).
- Birthdays are derived from `membros.nascimento` through browser-safe helpers; never store copied birthday rows.
- Ata text and WhatsApp messages are built by pure helpers in `src/lib/igreja.ts` (tested); PDF/DOC export stays client-side in `src/lib/ata-export.ts`.
- CRUD lists/mutations use authenticated server functions in `src/lib/administracao.functions.ts`, explicit tenant filtering and RLS; list reads paginate to avoid truncated reports.
- Shared existing church UI lives in `src/components/igreja-ui.tsx`; additional administration screens reuse it to preserve the theme.
- Cultos/setores are tenant-owned catalogues referenced by composite tenant foreign keys; historical schedule/event text remains when catalogue entries are deleted.
- Tithes link to member IDs; legacy name matching is allowed only for unique names, preventing ambiguous attribution.
- Visitor conversion uses a row-locked SECURITY INVOKER RPC to ensure atomic, idempotent conversion under the caller's RLS permissions.
- Non-staff users (not admin/pastor) only see the member area (`src/components/membro-area.tsx`); RLS limits them to their own `membros` row (linked by `user_id`, auto-created via `meu_membro()`) and their own `escalas`, so hiding admin UI is never the only protection.
- Gallery media lives in the private `galeria` bucket under `<igreja_id>/` and is shown via signed URLs; only staff upload/delete.
