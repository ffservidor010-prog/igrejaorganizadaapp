function Credencial({ m, igreja, igrejaId, carteirinha = false }: { carteirinha?: boolean; m: Membro; igreja: string; igrejaId: string }) {
  const qr = useQr(igrejaId, m.id);
  const nomeArq = `${carteirinha ? "carteirinha" : "credencial"}-${m.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  const pdf = () => (carteirinha ? carteirinhaPdf(m, igreja, qr) : credencialPdf(m, igreja, qr));
  const foto = m.foto ? <img src={m.foto} alt={m.nome} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-3xl font-bold text-amber-400">{m.nome.slice(0, 1)}</div>;
  return (
    <div className="space-y-3">
      {carteirinha ? <>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Frente</p>
        <Card className="border-primary/50 bg-white p-3 text-zinc-900">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-primary">{igreja}</p>
          <p className="mb-2 text-center text-[10px] uppercase text-zinc-500">Carteira de membro</p>
          <div className="flex gap-3">
            <div className="h-28 shrink-0 overflow-hidden rounded-md border-2 border-primary" style={{ width: "5.5rem" }}>{foto}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[10px] uppercase text-zinc-500">Nome</p>
              <p className="truncate whitespace-nowrap text-sm font-bold text-zinc-900">{m.nome}</p>
              {linhasFrente(m).map(([k, v]) => <div key={k}><p className="text-[10px] uppercase text-zinc-500">{k}</p><p className="text-sm font-semibold text-zinc-900">{v}</p></div>)}
            </div>
          </div>
        </Card>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Verso</p>
        <Card className="border-primary/50 bg-white p-3 text-zinc-900">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1 space-y-1">{linhasVerso(m).map(([k, v]) => <div key={k}><p className="text-[10px] uppercase text-zinc-500">{k}</p><p className="break-words text-sm font-semibold text-zinc-900">{v}</p></div>)}</div>
            {qr && <img src={qr} alt="QR Code de validação" className="h-24 w-24 shrink-0 rounded-md bg-white p-1" />}
          </div>
          <div className="mt-6 border-t border-primary pt-1 text-center text-[10px] text-zinc-500">Assinatura do Pastor</div>
        </Card>
      </> : (
        <Card className="border-primary/40 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 text-center text-white">
          <p className="text-sm font-bold uppercase tracking-widest text-amber-400">{igreja}</p>
          <div className="mx-auto my-3 h-28 w-28 overflow-hidden rounded-full border-4 border-primary">{foto}</div>
          <h2 className="text-xl font-bold text-white">{m.nome}</h2>
          <p className="text-sm text-amber-400">{CARGO_LABEL[m.cargo] ?? m.cargo}</p>
          {qr && <img src={qr} alt="QR Code da credencial" className="mx-auto mt-4 h-40 w-40 rounded-xl bg-white p-2" />}
          <p className="mt-2 text-xs text-zinc-400">Credencial de acesso rápido</p>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Btn disabled={!qr} onClick={() => baixar(pdf(), nomeArq)}><Download className="h-4 w-4" />Baixar PDF</Btn>
        <Btn variant="whats" disabled={!qr} onClick={() => compartilharPdf(pdf(), nomeArq, carteirinha ? "Minha carteirinha" : "Minha credencial")}><Send className="h-4 w-4" />Enviar PDF</Btn>
      </div>
    </div>
  );
}
