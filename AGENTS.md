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

- All app data lives in the user's external Supabase; the browser client reads/writes directly and RLS is the security boundary (signed-in read, admin/pastor write via `is_staff`).
- Roles live in `user_roles`; the first signup becomes admin via the `handle_new_user` trigger, so never create throwaway test accounts on an empty project.
- Birthdays are derived from `membros.nascimento` through browser-safe helpers; never store copied birthday rows.
- Ata text and WhatsApp messages are built by pure helpers in `src/lib/igreja.ts` (tested); PDF/DOC export stays client-side in `src/lib/ata-export.ts`.
