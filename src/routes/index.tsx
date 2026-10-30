import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IgrejaApp } from "@/components/IgrejaApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minha Igreja App — Escalas, membros e atas" },
      { name: "description", content: "Minha Igreja App: escalas com WhatsApp, membros, eventos, avisos, dízimos, ofertas e ata mensal pronta para cartório." },
      { property: "og:title", content: "Minha Igreja App" },
      { property: "og:description", content: "Escalas, membros, eventos e ata mensal da igreja em um só app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="min-h-screen bg-background" />;
  return <IgrejaApp />;
}
