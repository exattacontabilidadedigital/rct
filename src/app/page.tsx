"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, BookOpen, CheckCircle2, ClipboardList, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Checklist Inteligente",
    description:
      "Mapeie impactos da Reforma por etapa, atribua responsáveis e acompanhe o progresso em tempo real.",
    icon: ClipboardList,
  },
  {
    title: "Simulador Tributário",
    description:
      "Integração com a Calculadora Oficial CBS/IBS para comparar cenários de preço e margem com poucos cliques.",
    icon: BarChart3,
  },
  {
    title: "Conformidade Fácil",
    description:
      "Valide XMLs e receba alertas automáticos sobre mudanças nas tabelas CST, cClassTrib e crédito presumido.",
    icon: ShieldCheck,
  },
  {
    title: "Conteúdo Curado",
    description:
      "Guias, vídeos, cursos e base legal sempre atualizados para contadores e empresas avançarem com confiança.",
    icon: BookOpen,
  },
];

const metrics = [
  { label: "Empresas acompanhadas", value: "> 1.500" },
  { label: "Riscos críticos mitigados", value: "-42%" },
  { label: "Tempo médio de implantação", value: "30 dias" },
  { label: "Conteúdos verificados", value: "+350" },
];

const plans = [
  {
    name: "Checklist Essencial",
    price: "Gratuito",
    description:
      "Diagnóstico adaptativo, status dos pilares e exportação compartilhável para começar a jornada.",
    items: [
      "Checklist base por regime e setor",
      "Visão de progresso e próximos passos",
      "Alertas verdes com atualizações gerais",
      "Convite para até 2 colaboradores",
    ],
    cta: "Começar agora",
    href: "/login",
    highlight: false,
  },
  {
    name: "Plano Estratégico",
    price: "R$ 189/mês",
    description:
      "Experiência completa com personalização, conteúdos premium, simulador e conformidade fiscal contínua.",
    items: [
      "Simulador tributário integrado à Calculadora CBS/IBS",
      "Checklist avançado com workflows colaborativos",
      "Validação automática via Conformidade Fácil",
      "Conteúdos premium, comunidade e suporte consultivo",
      "Painel multiempresa para contadores",
    ],
    cta: "Experimentar por 14 dias",
    href: "/login",
    highlight: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full font-semibold">
              RTC
            </div>
            <div>
              <p className="text-sm font-semibold">Plataforma Reforma Tributária 2.0</p>
              <p className="text-xs text-muted-foreground">Checklist inteligente • Simulador oficial • Conformidade</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="w-fit" variant="secondary">
              Especialistas em Reforma Tributária 2026
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Transforme a Reforma Tributária em planos de ação simples, mensuráveis e colaborativos.
            </h1>
            <p className="text-lg text-muted-foreground">
              Diagnóstico inteligente, simulador de CBS/IBS e validação automática de documentos fiscal para
              equipes enxutas de empresas e contadores que precisam liderar a transição de maneira segura.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login" className="flex items-center gap-2">
                  Começar gratuitamente
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#planos">Ver planos premium</Link>
              </Button>
            </div>
            <div className="grid gap-6 rounded-2xl border p-6 sm:grid-cols-2">
              {metrics.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-2xl font-semibold">{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <Badge className="w-fit" variant="outline">
                Visão da plataforma
              </Badge>
              <CardTitle className="text-2xl">Tudo o que você precisa em um só hub</CardTitle>
              <CardDescription>
                Checklist adaptativo, simulações oficiais, conteúdos e conformidade em fluxos guiados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <LayoutDashboard className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Dashboard inteligente</p>
                  <p className="text-sm text-muted-foreground">
                    Riscos priorizados, linha do tempo 2026-2033 e insights de impacto financeiro.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Colaboração sem atrito</p>
                  <p className="text-sm text-muted-foreground">
                    Empresas, subusuários e contadores trabalhando juntos com comentários, anexos e aprovações.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Conformidade contínua</p>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas laranja e vermelhos sobre mudanças regulatórias diretamente na plataforma.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2" asChild>
                <Link href="#features">
                  Explorar funcionalidades
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section id="features" className="space-y-12 py-16">
          <div className="space-y-4 text-center">
            <Badge variant="outline" className="mx-auto w-fit">
              Plataforma completa para Reforma Tributária
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Feita para pequenas e médias empresas e contadores consultivos
            </h2>
            <p className="mx-auto max-w-3xl text-balance text-muted-foreground">
              Unimos educação, automação e acompanhamento consultivo em uma jornada guiada que reduz ruído
              informativo e aponta o que é essencial para manter competitividade e conformidade em 2026.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full border-border/60">
                <CardHeader className="gap-4">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16" id="planos">
          <div className="space-y-4 text-center">
            <Badge variant="outline" className="mx-auto w-fit">
              Planos alinhados à jornada freemium
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Comece gratuito, evolua com personalização e suporte especializado
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              O Checklist Essencial ajuda sua empresa a iniciar o diagnóstico; a assinatura desbloqueia simulações,
              conteúdos premium, comunidade e validação automática de documentos fiscais.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-primary shadow-lg" : "border-border/60"}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {plan.highlight ? (
                      <Badge>Mais escolhido</Badge>
                    ) : (
                      <Badge variant="outline">Para começar</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <p className="text-3xl font-semibold">{plan.price}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={plan.highlight ? "default" : "outline"}>
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit">
                Segurança e confiabilidade
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Conte com curadoria de especialistas, governança de conteúdo e alertas proativos
              </h2>
              <p className="text-muted-foreground">
                O Comitê Editorial RTC revisa as atualizações legais quinzenalmente e publica alertas críticos em até
                48h. Você recebe notificações verdes, laranjas e vermelhas conforme a urgência, além de trilhas guiadas
                para mitigação de riscos.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium">Integrações oficiais</p>
                  <p className="text-sm text-muted-foreground">
                    Calculadora Consumo CBS/IBS, Conformidade Fácil, ERPs contábeis e Supabase.
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium">LGPD e segurança</p>
                  <p className="text-sm text-muted-foreground">
                    Autenticação segura, logs auditáveis e armazenamento cifrado de certificados ICP-Brasil.
                  </p>
                </div>
              </div>
            </div>
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Fluxo de notificações inteligentes</CardTitle>
                <CardDescription>
                  Classificadas por criticidade para que empresas, colaboradores e contadores priorizem o que importa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Verde · Informativo</p>
                  <p className="text-sm text-muted-foreground">
                    Atualizações gerais da Reforma, conteúdos novos e boas práticas de implementação.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Laranja · Atenção</p>
                  <p className="text-sm text-muted-foreground">
                    Impactos moderados, prazos próximos, ajustes de checklist e simulações recomendadas.
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-500/10">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-300">Vermelho · Crítico</p>
                  <p className="text-sm text-muted-foreground">
                    Mudanças urgentes, risco de penalidade e necessidade de revisão de documentos fiscais.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="ghost" asChild className="gap-2">
                  <Link href="/login">
                    Acessar demo da plataforma
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium">© {new Date().getFullYear()} Plataforma Reforma Tributária 2.0</p>
            <p className="text-xs text-muted-foreground">
              Produto desenvolvido para apoiar empresas e contadores na adaptação à Reforma Tributária do Consumo.
            </p>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <Link href="/politica-privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
