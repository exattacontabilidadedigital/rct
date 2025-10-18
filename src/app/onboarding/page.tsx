"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FlagTriangleRight,
  Target,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { Company } from "@/types/platform";

type FormState = {
  companyName: string;
  regime: string;
  sector: string;
  revenueRange: string;
  employeeSize: string;
  acquisition: string;
  mainGoal: string;
  mainChallenge: string;
  automation: boolean;
  advisorSupport: boolean;
};

const regimeOptions = ["Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI"];

const sectorOptions = [
  "Varejo",
  "Serviços",
  "Indústria",
  "Tecnologia",
  "Saúde",
  "Educação",
  "Agro",
  "Construção",
];

const revenueRanges = [
  { value: "ate-360k", label: "Até R$360 mil" },
  { value: "360k-4-8m", label: "R$360 mil a R$4,8 mi" },
  { value: "4-8m-30m", label: "R$4,8 mi a R$30 mi" },
  { value: "30m-100m", label: "R$30 mi a R$100 mi" },
  { value: "acima-100m", label: "Acima de R$100 mi" },
];

const employeeSizes = [
  { value: "ate-10", label: "Até 10 pessoas" },
  { value: "11-30", label: "11 a 30 pessoas" },
  { value: "31-100", label: "31 a 100 pessoas" },
  { value: "101-300", label: "101 a 300 pessoas" },
  { value: "acima-300", label: "Acima de 300 pessoas" },
];

const acquisitionChannels = [
  "Google",
  "Redes sociais",
  "Indicação",
  "Evento ou webinar",
  "Parceiro",
  "Outro",
];

const onboardingTips = [
  {
    icon: ClipboardCheck,
    title: "Checklist Essencial",
    description: "Usaremos essas informações para montar seu plano de adaptação prioritário.",
  },
  {
    icon: Target,
    title: "Recomendações sob medida",
    description: "Conteúdos e tarefas são personalizados por regime, setor e faturamento.",
  },
  {
    icon: FlagTriangleRight,
    title: "Alertas proativos",
    description: "Quanto mais dados você compartilhar, melhor calibramos riscos e notificações.",
  },
];

const defaultFormState: FormState = {
  companyName: "",
  regime: regimeOptions[0],
  sector: "",
  revenueRange: revenueRanges[0].value,
  employeeSize: employeeSizes[0].value,
  acquisition: "",
  mainGoal: "",
  mainChallenge: "",
  automation: false,
  advisorSupport: true,
};

const getCompanyMetadata = (company: Company | null | undefined) => {
  const metadata = (company?.metadata as Record<string, unknown>) ?? {};
  return {
    revenueRange: (metadata.revenueRange as string) ?? defaultFormState.revenueRange,
    employeeSize: (metadata.employeeSize as string) ?? defaultFormState.employeeSize,
    mainGoal: (metadata.mainGoal as string) ?? "",
    mainChallenge: (metadata.mainChallenge as string) ?? "",
    automation: Boolean(metadata.automation),
    advisorSupport: metadata.advisorSupport === undefined ? true : Boolean(metadata.advisorSupport),
  };
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, companies, loading, updateCompanyProfile } = useAuth();

  const company = useMemo(() => {
    if (!user) return null;
    if (user.role === "empresa") {
      return companies.find((c) => c.ownerId === user.id || c.id === user.id) ?? null;
    }
    // Contadores ou colaboradores não precisam completar este fluxo
    return null;
  }, [companies, user]);

  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/onboarding");
      return;
    }
    if (user.role !== "empresa") {
      router.replace("/app/dashboard");
      return;
    }
    if (!company) {
      router.replace("/app/dashboard");
    }
  }, [company, loading, router, user]);

  useEffect(() => {
    if (!company) return;
    const meta = getCompanyMetadata(company);
    setFormState({
      companyName: company.name,
      regime: company.regime,
      sector: company.sector,
      revenueRange: meta.revenueRange,
      employeeSize: meta.employeeSize,
      acquisition: company.origin ?? "",
      mainGoal: meta.mainGoal,
      mainChallenge: meta.mainChallenge,
      automation: meta.automation,
      advisorSupport: meta.advisorSupport,
    });
  }, [company]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) return;
    setIsSubmitting(true);

    updateCompanyProfile(company.id, {
      name: formState.companyName,
      regime: formState.regime,
      sector: formState.sector,
      origin: formState.acquisition,
      metadata: {
        revenueRange: formState.revenueRange,
        employeeSize: formState.employeeSize,
        mainGoal: formState.mainGoal,
        mainChallenge: formState.mainChallenge,
        automation: formState.automation,
        advisorSupport: formState.advisorSupport,
        onboardingCompletedAt: new Date().toISOString(),
      },
      checklistProgress: company.checklistProgress > 12 ? company.checklistProgress : 18,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      router.push("/app/dashboard");
    }, 600);
  };

  if (loading || !company || !user || user.role !== "empresa") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-sm text-muted-foreground">
          Preparando sua experiência personalizada...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-10">
      <div className="container mx-auto grid gap-8 px-4 pb-16 pt-4 md:grid-cols-[minmax(0,1fr)_340px] md:pt-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">Passo 1 de 3</Badge>
            <h1 className="text-3xl font-semibold">Configuração inicial da empresa</h1>
            <p className="max-w-2xl text-muted-foreground">
              Em poucos minutos vamos alinhar o checklist e o dashboard de riscos à realidade da sua empresa.
              Essas respostas também ajudam a calibrar notificações e recomendações prioritárias.
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle>Informações básicas</CardTitle>
              <CardDescription>Preencha os dados abaixo para personalizar sua jornada na Reforma Tributária.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="company-name">Nome da empresa</Label>
                  <Input
                    id="company-name"
                    placeholder="Ex.: Mercado Luz"
                    required
                    value={formState.companyName}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, companyName: event.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-3">
                    <Label>Regime tributário atual</Label>
                    <Select
                      value={formState.regime}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, regime: value }))}
                    >
                      <SelectTrigger id="regime">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {regimeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label>Setor predominante</Label>
                    <Select
                      value={formState.sector || undefined}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, sector: value }))}
                    >
                      <SelectTrigger id="sector">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectorOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-3">
                    <Label>Faixa de faturamento anual</Label>
                    <Select
                      value={formState.revenueRange}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, revenueRange: value }))}
                    >
                      <SelectTrigger id="revenue">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {revenueRanges.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label>Equipe envolvida na adaptação</Label>
                    <Select
                      value={formState.employeeSize}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, employeeSize: value }))}
                    >
                      <SelectTrigger id="employeeSize">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeSizes.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label>Como chegou até a plataforma?</Label>
                  <Select
                    value={formState.acquisition || undefined}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, acquisition: value }))}
                  >
                    <SelectTrigger id="acquisition">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {acquisitionChannels.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-3">
                    <Label htmlFor="main-goal">Qual o principal objetivo com a RTC?</Label>
                    <Textarea
                      id="main-goal"
                      placeholder="Ex.: ajustar preços com segurança e orientar diretoria"
                      value={formState.mainGoal}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, mainGoal: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="main-challenge">Qual desafio mais preocupa hoje?</Label>
                    <Textarea
                      id="main-challenge"
                      placeholder="Ex.: mapear impacto da CBS nas operações de varejo"
                      value={formState.mainChallenge}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, mainChallenge: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Automatização de tarefas</p>
                      <p className="text-sm text-muted-foreground">
                        Deseja receber sugestões automáticas para acelerar tarefas repetitivas e integrações com ERP?
                      </p>
                    </div>
                    <Switch
                      checked={formState.automation}
                      onCheckedChange={(value) =>
                        setFormState((prev) => ({ ...prev, automation: Boolean(value) }))
                      }
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Apoio de contador consultivo</p>
                      <p className="text-sm text-muted-foreground">
                        Informe se você trabalha com contador parceiro para calibrarmos tarefas colaborativas e alertas.
                      </p>
                    </div>
                    <Switch
                      checked={formState.advisorSupport}
                      onCheckedChange={(value) =>
                        setFormState((prev) => ({ ...prev, advisorSupport: Boolean(value) }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Progresso da configuração</Label>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground">Você está a poucos passos de receber seu diagnóstico personalizado.</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Dados protegidos conforme LGPD. Você poderá editar essas preferências depois.
                </div>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  Continuar para o dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>

          {success ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <p>Onboarding concluído! Vamos redirecionar você para o painel.</p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card className="bg-primary/5">
            <CardHeader className="space-y-2">
              <Badge variant="secondary" className="w-fit">Por que pedimos isso?</Badge>
              <CardTitle>Personalização inteligente</CardTitle>
              <CardDescription>
                Ajustamos automaticamente checklists, alertas e simulações conforme porte, regime e objetivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {onboardingTips.map((tip) => (
                <div key={tip.title} className="flex items-start gap-3">
                  <tip.icon className="mt-1 h-5 w-5 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">{tip.title}</p>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Factory className="h-5 w-5" /> Sua empresa: {formState.companyName || company.name}
              </CardTitle>
              <CardDescription>
                Visão rápida das principais escolhas para validação antes do dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Regime</span>
                <span className="font-medium">{formState.regime}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Setor</span>
                <span className="font-medium">{formState.sector || "Selecionar"}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Faturamento</span>
                <span className="font-medium">
                  {revenueRanges.find((item) => item.value === formState.revenueRange)?.label ?? "Selecionar"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Equipe envolvida</span>
                <span className="font-medium">
                  {employeeSizes.find((item) => item.value === formState.employeeSize)?.label ?? "Selecionar"}
                </span>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Objetivo</span>
                <p className="font-medium">{formState.mainGoal || "Defina o foco principal"}</p>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Maior desafio</span>
                <p className="font-medium">{formState.mainChallenge || "Conte o que tira seu sono"}</p>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="ghost" className="gap-2" onClick={() => router.push("/login")}
                type="button"
              >
                Revisar dados de acesso
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5" /> Próximos passos
              </CardTitle>
              <CardDescription className="text-emerald-900/80 dark:text-emerald-200/80">
                Após salvar, habilitaremos o checklist essencial e primeiros alertas de risco.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Checklist adaptado ao seu porte
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Simulações iniciais com base na CBS/IBS oficial
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" /> Conteúdos sugeridos para a diretoria e equipe
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
