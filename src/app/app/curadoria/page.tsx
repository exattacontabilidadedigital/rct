"use client";

import { ArrowRight, BookOpenCheck, CheckCircle2, GraduationCap, PlayCircle, Sparkles } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { contentRecommendations } from "@/lib/dashboard-data";

const learningTracks = [
  {
    id: "essencial",
    title: "Checklist essencial",
    description: "Coleção de vídeos curtos para orientar o kick-off com a diretoria e o time fiscal.",
    icon: PlayCircle,
  },
  {
    id: "financeiro",
    title: "Impactos financeiros",
    description: "Séries de workshops sobre precificação, margem e repasses para clientes.",
    icon: GraduationCap,
  },
  {
    id: "operacional",
    title: "Transformação operacional",
    description: "Processos para padronizar cadastros, revisar contratos e mitigar riscos.",
    icon: BookOpenCheck,
  },
];

export default function CuradoriaPage() {
  const { user, company, loading } = useCompanyPortal("/app/curadoria");

  if (loading || !user || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando curadoria...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto space-y-6 px-4 pb-16 lg:px-8">
        <header className="space-y-1">
          <Badge variant="outline" className="w-fit">Curadoria especializada</Badge>
          <h1 className="text-3xl font-semibold">Conteúdos guiados para acelerar a transição</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Aproveite recomendações personalizadas para treinar a equipe, comunicar stakeholders e implementar melhorias contínuas.
          </p>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Destaques da semana</CardTitle>
              <CardDescription>Seleção automática com base no objetivo principal da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentRecommendations.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background p-3">
                  <item.icon className="mt-1 h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.type}</p>
                    <Button variant="link" className="p-0 text-xs">
                      {item.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardHeader className="space-y-2">
              <Badge variant="secondary" className="w-fit">Curadoria premium</Badge>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" /> Estratégias exclusivas para líderes
              </CardTitle>
              <CardDescription>
                Combine sessões online e materiais prontos para destravar decisões em comitês executivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Trilha para apresentar impactos da CBS em 30 minutos.</p>
              <p>• Pack de comunicados para áreas comerciais e fornecedores.</p>
              <p>• Libraria de perguntas para sessões com o board.</p>
            </CardContent>
            <CardFooter>
              <Button className="gap-2" size="sm">
                Falar com especialista da RTC
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </section>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Trilhas temáticas</CardTitle>
            <CardDescription>Sequências rápidas para orientar diferentes perfis da organização.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="essencial">
              <TabsList className="grid w-full grid-cols-3 text-xs">
                {learningTracks.map((track) => (
                  <TabsTrigger key={track.id} value={track.id} className="gap-2">
                    <track.icon className="h-4 w-4" />
                    {track.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {learningTracks.map((track) => (
                <TabsContent key={track.id} value={track.id} className="space-y-3 text-sm text-muted-foreground">
                  <p>{track.description}</p>
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="font-medium text-foreground">Conteúdo sugerido</p>
                    <ul className="mt-2 grid gap-2 text-xs">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Guia passo a passo em PDF.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Webinar gravado com especialistas RTC.
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Perguntas frequentes e scripts de reunião.
                      </li>
                    </ul>
                    <Button variant="outline" className="mt-4 gap-2" size="sm">
                      Acessar trilha
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-100">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" /> Como aproveitar melhor a curadoria
            </CardTitle>
            <CardDescription className="text-emerald-900/80 dark:text-emerald-100/80">
              Combine conteúdo com ações do checklist para acelerar a curva de aprendizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Alinhe com o contador quais materiais devem ser revisados juntos.</p>
            <p>• Compartilhe com a diretoria insights-chave como resumo executivo semanal.</p>
            <p>• Registre aprendizados no checklist para manter o histórico da empresa.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="gap-2" size="sm">
              Ver calendário de lives
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
