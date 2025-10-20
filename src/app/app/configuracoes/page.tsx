"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LineChart, ShieldCheck, UserPlus, Users } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { maturityTabs } from "@/lib/dashboard-data";

export default function SettingsPage() {
  const { registerCollaborator } = useAuth();
  const { user, company, loading, companySummary } = useCompanyPortal("/app/configuracoes");
  const [preferences, setPreferences] = useState({
    weeklyDigest: true,
    shareWithAccountant: companySummary?.advisorSupport ?? true,
    autoSync: companySummary?.automation ?? false,
  });
  const [collaboratorForm, setCollaboratorForm] = useState({ name: "", email: "", password: "" });
  const [collaboratorFeedback, setCollaboratorFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [isSubmittingCollaborator, setIsSubmittingCollaborator] = useState(false);

  const handleCreateCollaborator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) return;
    setIsSubmittingCollaborator(true);
    setCollaboratorFeedback(null);

    const result = await registerCollaborator({
      name: collaboratorForm.name,
      email: collaboratorForm.email,
      password: collaboratorForm.password || "rtc123",
      companyId: company.id,
    });

    setIsSubmittingCollaborator(false);

    if (!result.success) {
      setCollaboratorFeedback({
        type: "error",
        message: result.message ?? "Não foi possível criar o usuário.",
      });
      return;
    }

    setCollaboratorFeedback({
      type: "success",
      message: "Colaborador criado com sucesso. Compartilhe as credenciais para o primeiro acesso.",
    });
    setCollaboratorForm({ name: "", email: "", password: "" });
  };

  if (loading || !user || !company || !companySummary) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto space-y-6 px-4 pb-16 lg:px-8">
        <header className="space-y-1">
          <Badge variant="outline" className="w-fit">Configurações da empresa</Badge>
          <h1 className="text-3xl font-semibold">Personalize acessos e notificações</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Defina como a plataforma RTC compartilha informações com contadores, times internos e diretoria.
          </p>
        </header>

        <section
          id="usuarios"
          className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,26rem)]"
        >
          <Card className="border-primary/40">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" /> Criar colaborador interno
              </CardTitle>
              <CardDescription>
                Cadastre usuários do time diretamente por aqui. Eles recebem acesso imediato ao checklist da empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCollaborator} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="collaborator-name">Nome completo</Label>
                    <Input
                      id="collaborator-name"
                      placeholder="Ex.: Maria Silva"
                      required
                      value={collaboratorForm.name}
                      onChange={(event) =>
                        setCollaboratorForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collaborator-email">E-mail corporativo</Label>
                    <Input
                      id="collaborator-email"
                      type="email"
                      placeholder="colaborador@empresa.com"
                      required
                      value={collaboratorForm.email}
                      onChange={(event) =>
                        setCollaboratorForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-password">Senha inicial</Label>
                  <Input
                    id="collaborator-password"
                    type="password"
                    placeholder="Defina uma senha temporária"
                    required
                    value={collaboratorForm.password}
                    onChange={(event) =>
                      setCollaboratorForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Compartilhe esta senha com o colaborador. Ele poderá alterar no primeiro acesso.
                  </p>
                </div>
                {collaboratorFeedback ? (
                  <div
                    className={`rounded-md border p-3 text-sm ${
                      collaboratorFeedback.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-200"
                    }`}
                  >
                    {collaboratorFeedback.message}
                  </div>
                ) : null}
                <Button type="submit" className="gap-2" disabled={isSubmittingCollaborator}>
                  {isSubmittingCollaborator ? "Salvando..." : "Adicionar colaborador"}
                  <Users className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
              <p>Os colaboradores criados aqui entram com permissões de execução no checklist CRT-3.</p>
              <div className="flex flex-wrap items-center gap-1">
                <span>Para remover ou alterar acessos, utilize o painel de membros.</span>
                <Button asChild variant="link" className="h-auto p-0 text-xs">
                  <Link href="/app/membros">Abrir painel</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Perfis da plataforma</CardTitle>
              <CardDescription>
                Defina os níveis de usuário diretamente nas configurações. Convites de contador permanecem no fluxo dedicado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <Users className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Colaboradores</p>
                  <p>Executam tarefas, atualizam status e registram evidências do checklist.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <ShieldCheck className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Contadores</p>
                  <p>Atuam como consultores externos e continuam sendo convidados pelo fluxo dedicado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
                <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Responsável</p>
                  <p>Controla a empresa, configura acesso e acompanha auditoria.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild variant="secondary" className="gap-2">
                <Link href="/app/convidar?perfil=contador">
                  Convidar contador
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Use o menu do avatar para retornar rapidamente a esta seção ou iniciar um novo convite.
              </p>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className="border-primary/30">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Preferências de comunicação</CardTitle>
              <CardDescription>Ative notificações automáticas e controle compartilhamentos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-3 rounded-lg border bg-background/60 p-4">
                <div className="space-y-1">
                  <p className="font-medium">Resumo semanal por e-mail</p>
                  <p className="text-xs text-muted-foreground">Receba na segunda-feira os principais alertas e avanços.</p>
                </div>
                <Switch
                  checked={preferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, weeklyDigest: checked }))
                  }
                  aria-label="Ativar resumo semanal"
                />
              </div>
              <div className="flex items-start justify-between gap-3 rounded-lg border bg-background/60 p-4">
                <div className="space-y-1">
                  <p className="font-medium">Compartilhar dados com contador</p>
                  <p className="text-xs text-muted-foreground">Permite que o contador veja simuladores e relatórios financeiros.</p>
                </div>
                <Switch
                  checked={preferences.shareWithAccountant}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, shareWithAccountant: checked }))
                  }
                  aria-label="Compartilhar dados com contador"
                />
              </div>
              <div className="flex items-start justify-between gap-3 rounded-lg border bg-background/60 p-4">
                <div className="space-y-1">
                  <p className="font-medium">Sincronizar automações fiscais</p>
                  <p className="text-xs text-muted-foreground">Ative integrações de XML e notas para atualizar o checklist automaticamente.</p>
                </div>
                <Switch
                  checked={preferences.autoSync}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, autoSync: checked }))
                  }
                  aria-label="Ativar sincronização automática"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Alterações serão salvas automaticamente na próxima sincronização com a equipe.
              </p>
              <Button variant="outline" className="gap-2" size="sm">
                Gerenciar acessos avançados
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da empresa</CardTitle>
                <CardDescription>Informações usadas para personalizar recomendações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Setor predominante</span>
                  <span className="font-medium">{company.sector || "Defina no onboarding"}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Regime atual</span>
                  <span className="font-medium">{company.regime}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Faturamento estimado</span>
                  <span className="font-medium">{companySummary.revenueRange}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Equipe dedicada</span>
                  <span className="font-medium">{companySummary.employeeSize}</span>
                </div>
                <Separator />
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <p className="text-muted-foreground">Objetivo principal</p>
                  <p className="text-sm font-medium">{companySummary.mainGoal}</p>
                </div>
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <p className="text-muted-foreground">Maior desafio</p>
                  <p className="text-sm font-medium">{companySummary.mainChallenge}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="gap-2">
                  Atualizar dados
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maturidade da empresa</CardTitle>
                <CardDescription>Status atual: {company.maturity}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="analise">
                  <TabsList className="grid w-full grid-cols-3">
                    {maturityTabs.map((tab) => (
                      <TabsTrigger value={tab.id} key={tab.id} className="gap-2 text-xs">
                        <tab.icon className="h-3 w-3" /> {tab.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {maturityTabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="space-y-2 text-sm text-muted-foreground">
                      {tab.content.map((item) => (
                        <p key={item}>• {item}</p>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="border-primary/30">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5 text-primary" /> Auditoria de acesso
            </CardTitle>
            <CardDescription>Registre movimentações para manter a governança da transformação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Membros convidados são logados automaticamente com permissões mínimas.</p>
            <p>• Use o painel de membros para revogar acessos temporários.</p>
            <p>• Relatórios financeiros registram quem exportou dados sensíveis.</p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              Abrir auditoria completa
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
