"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  LineChart,
  ShieldCheck,
} from "lucide-react";

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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import {
  contentRecommendations,
  defaultActions,
  defaultAlerts,
  defaultPillarBreakdown,
  focusRecommendations,
  reportSummaries,
  severityConfig,
  timelineStatusConfig,
  transitionTimeline,
} from "@/lib/dashboard-data";

export default function DashboardPage() {
  const { user, company, loading, severity, companySummary } = useCompanyPortal("/app/dashboard");

  if (loading || !user || !company || !severity || !companySummary) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando dados do dashboard...</p>
      </div>
    );
  }

  const topActions = defaultActions.slice(0, 2);
  const topAlerts = defaultAlerts.slice(0, 2);
  const topReports = reportSummaries.slice(0, 2);
  const nextPhase = transitionTimeline[0];
  const nextPhaseStatus = timelineStatusConfig[nextPhase.status];

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto space-y-6 px-4 pb-16 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="w-fit">Dashboard • Visão executiva</Badge>
            <h1 className="text-3xl font-semibold">Olá, {user.name?.split(" ")[0] ?? "líder"}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Acompanhe o progresso da adequação à Reforma Tributária, priorize riscos e compartilhe resultados com sua equipe.
            </p>
          </div>
          <Button asChild className="gap-2" type="button">
            <Link href="/onboarding">
              Atualizar diagnóstico
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-primary/30">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Progresso geral
              </CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{company.checklistProgress}%</span>
                <span className="text-xs text-muted-foreground">Checklist Essencial</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={company.checklistProgress} className="h-2" />
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              A meta é atingir 80% antes de dezembro.
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Risco atual
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${severity.badge}`}>
                  {severity.label}
                </span>
                <span className="text-xl font-semibold uppercase tracking-tight">
                  {company.riskLevel}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{severity.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/checklist">
                  Ver plano de mitigação
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-primary" /> Próxima revisão
              </CardTitle>
              <p className="text-xl font-semibold">Revisão em 15 dias</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Agende uma sessão com o contador para revisar simulações e ajustes de preço.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="gap-2" size="sm">
                Sincronizar agenda
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4 text-primary" /> Cenário de margem
              </CardTitle>
              <p className="text-xl font-semibold">-1,8% sem ajustes</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Simule novos preços para preservar a margem média. Dados baseados nas últimas projeções CBS/IBS.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/relatorios">
                  Abrir simulador
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">Checklist por pilar</CardTitle>
                <CardDescription>Consulte rapidamente o avanço dos pilares e redirecione esforços.</CardDescription>
              </div>
              <Button asChild variant="outline" className="gap-2" size="sm">
                <Link href="/app/checklist">
                  Abrir checklist completo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {defaultPillarBreakdown.map((pillar) => (
                <div key={pillar.id} className="rounded-lg border bg-muted/40 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{pillar.label}</p>
                      <p className="text-xs text-muted-foreground">{pillar.commentary}</p>
                    </div>
                    <span className="text-sm font-semibold">{pillar.progress}%</span>
                  </div>
                  <Progress value={pillar.progress} className="mt-3 h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximas ações</CardTitle>
              <CardDescription>Organize o time e evite bloqueios nos próximos marcos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/60">
                    <TableHead>Ação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Prazo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topActions.map((action) => (
                    <TableRow key={action.id} className="border-muted/40">
                      <TableCell className="max-w-[200px] text-sm font-medium">
                        {action.title}
                        <Badge
                          variant="outline"
                          className={`ml-2 text-[11px] uppercase ${severityConfig[action.severity]?.badge ?? ""}`}
                        >
                          {action.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{action.owner}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{action.dueIn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/checklist">
                  Ver plano de ação
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Alertas recentes</CardTitle>
              <CardDescription>Monitoramento automatizado a partir do checklist e integrações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAlerts.map((alert) => (
                <div key={alert.id} className="grid gap-2 rounded-lg border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-background text-xs">
                      {alert.source}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs uppercase ${severityConfig[alert.severity]?.badge ?? ""}`}
                    >
                      {alert.severity}
                    </Badge>
                    {alert.actionableUntil ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3" /> até {alert.actionableUntil}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">{alert.title}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/checklist">
                  Ver todos os alertas
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Relatórios em destaque</CardTitle>
              <CardDescription>Acelere decisões com análises prontas para o board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {topReports.map((report) => (
                <p key={report.id} className="flex items-start gap-2">
                  <LineChart className="mt-[2px] h-4 w-4 text-primary" />
                  <span>
                    <strong className="text-foreground">{report.title}.</strong> {report.description}
                  </span>
                </p>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/relatorios">
                  Abrir relatórios
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Curadoria recomendada</CardTitle>
              <CardDescription>Conteúdo personalizado para acelerar a transição.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contentRecommendations.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-primary/30 bg-background p-3">
                  <item.icon className="mt-1 h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.type}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/curadoria">
                  Explorar curadoria
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Próxima fase da timeline</CardTitle>
              <CardDescription>Planeje com antecedência os marcos da reforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{nextPhase.period}</p>
              <p className="text-sm font-semibold text-foreground">{nextPhase.title}</p>
              <p>{nextPhase.description}</p>
              <Badge variant="outline" className={`w-fit text-[11px] uppercase ${nextPhaseStatus?.badge ?? ""}`}>
                {nextPhaseStatus?.label ?? "Em planejamento"}
              </Badge>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/timeline">
                  Ver timeline completa
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className="border-primary/30">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Configurações rápidas</CardTitle>
              <CardDescription>Revise as permissões e automações mais usadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Compartilhamento com contador: <strong>{companySummary.advisorSupport ? "Ativo" : "Inativo"}</strong></p>
              <p>• Automações fiscais: <strong>{companySummary.automation ? "Sincronizadas" : "Pendentes"}</strong></p>
              <p>• Resumo semanal: <strong>Ativado</strong></p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" className="gap-2 text-xs" size="sm">
                <Link href="/app/configuracoes">
                  Abrir configurações
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-100">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" /> Recomendações para o comitê
              </CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
                Use estas pautas na próxima reunião executiva da reforma tributária.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {focusRecommendations.map((tip) => (
                <p key={tip}>• {tip}</p>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="gap-2" size="sm">
                Compartilhar com diretoria
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}
