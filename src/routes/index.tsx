import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChurchApp } from "@/components/ChurchApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Igreja Oiapoque — Administração" },
      { name: "description", content: "Administração interna da Igreja de Oiapoque: cultos, obreiros, escalas, aniversariantes, avisos e eventos." },
      { property: "og:title", content: "Igreja Oiapoque — Administração" },
      { property: "og:description", content: "Cultos, obreiros, escalas, aniversariantes, avisos e eventos da Igreja de Oiapoque." },
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
  return <ChurchApp />;
}
