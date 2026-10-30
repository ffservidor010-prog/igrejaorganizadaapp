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
