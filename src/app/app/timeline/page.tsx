"use client";

import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import {
  focusRecommendations,
  timelineStatusConfig,
  transitionTimeline,
} from "@/lib/dashboard-data";

export default function TimelinePage() {
  const { user, company, loading } = useCompanyPortal("/app/timeline");

  if (loading || !user || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando timeline...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto space-y-6 px-4 pb-16 lg:px-8">
        <header className="space-y-1">
          <Badge variant="outline" className="w-fit">Timeline da reforma</Badge>
          <h1 className="text-3xl font-semibold">Oriente a transição da CBS/IBS com marcos claros</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Estruture a jornada da empresa em fases estratégicas e acompanhe o andamento junto ao contador e às equipes internas.
          </p>
        </header>

        <Card className="border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Mapa de transformação</CardTitle>
            <CardDescription>
              Priorize entregas críticas, alinhe investimentos e registre aprendizados em cada etapa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {transitionTimeline.map((phase, index) => {
              const Icon = phase.icon;
              const status = timelineStatusConfig[phase.status];
              const isLast = index === transitionTimeline.length - 1;

              return (
                <div key={phase.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-background text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {!isLast ? <div className="mt-1 h-full w-px bg-border" /> : null}
                  </div>
                  <div className="space-y-2 pb-6">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{phase.period}</p>
                    <h3 className="text-sm font-semibold">{phase.title}</h3>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                    <Badge variant="outline" className={`w-fit text-[11px] uppercase ${status?.badge ?? ""}`}>
                      {status?.label ?? "Em planejamento"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="bg-muted/40">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Foco do trimestre</CardTitle>
              <CardDescription>Ações-chave sugeridas pelo algoritmo de maturidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {focusRecommendations.map((tip) => (
                <p key={tip} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-primary" /> {tip}
                </p>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2 text-xs" size="sm">
                Ver plano detalhado
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Agenda recomendada</CardTitle>
              <CardDescription>Ajuste o ritmo de reuniões e rituais de acompanhamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Reunião quinzenal com o contador para validar entregas.
              </p>
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Comitê executivo mensal para revisar indicadores da reforma.
              </p>
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" /> Cerimônia semanal interna para atualizar o checklist.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="gap-2">
                Sincronizar com calendário
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}
