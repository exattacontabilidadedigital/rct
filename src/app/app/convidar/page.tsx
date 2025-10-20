"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AtSign,
  Building2,
  CheckCircle2,
  MailPlus,
  Send,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { Company } from "@/types/platform";

type InviteRole = "colaborador" | "contador";

type InviteForm = {
  role: InviteRole;
  name: string;
  email: string;
  companyId: string;
  message: string;
};

const defaultFormState: InviteForm = {
  role: "colaborador",
  name: "",
  email: "",
  companyId: "",
  message: "Olá! Estou te convidando para acompanhar a preparação da empresa para a Reforma Tributária na plataforma RTC.",
};

const roleCopy: Record<InviteRole, { title: string; description: string; benefits: string[]; icon: React.ComponentType<{ className?: string }> }> = {
  colaborador: {
    title: "Colaborador interno",
    description: "Gerencia tarefas, atualiza o checklist e sinaliza riscos operacionais.",
    benefits: [
      "Recebe tarefas e lembretes automáticos",
      "Pode anexar evidências e documentos fiscais",
      "Acompanha checklist por pilar",
    ],
    icon: Users,
  },
  contador: {
    title: "Contador / consultor",
    description: "Oferece visão estratégica e garante conformidade com a CBS/IBS.",
    benefits: [
      "Painel multiempresa com alertas críticos",
      "Recomendações automáticas por cliente",
      "Validação prévia com Conformidade Fácil",
    ],
    icon: Building2,
  },
};

export default function InvitePage() {
  const router = useRouter();
  const { user, companies, loading, registerCollaborator, registerAccountant } = useAuth();
  const [form, setForm] = useState<InviteForm>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const availableCompanies = useMemo(() => {
    if (!user) return [];
    if (user.role === "empresa") {
      return companies.filter((company) => company.ownerId === user.id || company.id === user.id);
    }
    if (user.role === "contador") {
      return companies.filter((company) => company.accountantIds?.includes(user.id));
    }
    if (user.role === "colaborador") {
      return companies.filter((company) => company.employees.includes(user.id));
    }
    return [];
  }, [companies, user]);

  const targetCompany = useMemo<Company | null>(() => {
    if (!form.companyId) {
      return availableCompanies.length ? availableCompanies[0] : null;
    }
    return availableCompanies.find((company) => company.id === form.companyId) ?? null;
  }, [availableCompanies, form.companyId]);

  useEffect(() => {
    if (!form.companyId && availableCompanies.length) {
      setForm((prev) => ({ ...prev, companyId: availableCompanies[0].id }));
    }
  }, [availableCompanies, form.companyId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !targetCompany) return;
    setIsSubmitting(true);
    setFeedback(null);

    const handler = form.role === "colaborador" ? registerCollaborator : registerAccountant;
    const payload =
      form.role === "colaborador"
        ? {
            name: form.name,
            email: form.email,
            password: "demo123",
            companyId: targetCompany.id,
          }
        : {
            name: form.name,
            email: form.email,
            password: "demo123",
            companyIds: [targetCompany.id],
          };

    const result = await handler(payload as never);

    setIsSubmitting(false);

    if (!result.success) {
      setFeedback({ type: "error", message: result.message ?? "Não foi possível enviar o convite." });
      return;
    }

    setFeedback({
      type: "success",
      message: "Convite enviado! Você pode acompanhar o status pelo checklist e painel de membros.",
    });
    setForm((prev) => ({ ...prev, name: "", email: "" }));
    setTimeout(() => {
      router.push(`/app/membros?invited=success&perfil=${form.role}`);
    }, 400);
  };

  const selectedRoleCopy = roleCopy[form.role];

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando empresas disponíveis...</p>
      </div>
    );
  }

  if (!availableCompanies.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Share2 className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-lg font-semibold">Cadastre uma empresa primeiro</p>
          <p className="text-sm text-muted-foreground">
            Você precisa concluir o onboarding ou ter uma empresa associada para enviar convites.
          </p>
        </div>
        <Button onClick={() => router.push("/onboarding")}>
          Ir para onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto grid gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:px-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">Gestão de acesso</Badge>
            <h1 className="text-3xl font-semibold">Convide sua equipe e parceiros</h1>
            <p className="max-w-2xl text-muted-foreground">
              Ative colaboradores internos e contadores para acelerar o checklist, validar documentos e acompanhar alertas em tempo real.
            </p>
          </div>

          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle>Enviar convite</CardTitle>
              <CardDescription>
                Defina o perfil e os dados da pessoa que vai participar da preparação tributária.
                <span className="block text-xs text-muted-foreground">
                  Colaboradores internos também podem ser criados diretamente em Configurações &gt; Usuários.
                </span>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="grid gap-2">
                  <Label>Perfil do convite</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["colaborador", "contador"] as InviteRole[]).map((role) => {
                      const RoleIcon = roleCopy[role].icon;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, role }))}
                          className={`flex items-center gap-3 rounded-lg border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                            form.role === role ? "border-primary bg-primary/10" : "border-border"
                          }`}
                        >
                          <RoleIcon className="h-5 w-5 text-primary" />
                          <div className="space-y-1">
                            <p className="font-medium">{roleCopy[role].title}</p>
                            <p className="text-xs text-muted-foreground">{roleCopy[role].description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="companyId">Empresa vinculada</Label>
                  <Select
                    value={form.companyId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, companyId: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Convites herdam as permissões do perfil selecionado.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      placeholder="Ex.: Maria Silva"
                      required
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@empresa.com"
                      required
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Mensagem personalizada</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  />
                </div>

                <Separator />

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Benefícios do perfil selecionado</p>
                  <ul className="grid gap-2">
                    {selectedRoleCopy.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-[2px] h-4 w-4 text-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {feedback ? (
                  <div
                    className={`rounded-md border p-3 text-sm ${
                      feedback.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                        : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-200"
                    }`}
                  >
                    {feedback.message}
                  </div>
                ) : null}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AtSign className="h-4 w-4" /> Convites expiram em 7 dias. Você pode revogar acessos a qualquer momento.
                </p>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {form.role === "colaborador" ? "Enviar convite" : "Compartilhar acesso"}
                  <Send className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="space-y-2">
              <Badge variant="secondary" className="w-fit">Dicas rápidas</Badge>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" /> Onboard ágil da equipe
              </CardTitle>
              <CardDescription>
                Convide primeiro quem responde pelo checklist essêncial e pelo envio de documentos fiscais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Configure papéis claros para evitar duplicidades.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Combine com o contador uma rotina quinzenal de validação.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Use a mensagem personalizada para orientar o próximo passo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MailPlus className="h-5 w-5" /> Status dos convites
              </CardTitle>
              <CardDescription>Convites enviados recentemente e seus estados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <div>
                  <p className="font-medium">Ana Pires · Contadora</p>
                  <p className="text-xs text-muted-foreground">Enviado há 2 dias • aguardando aceite</p>
                </div>
                <Badge variant="outline" className="text-xs uppercase">Pendente</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <div>
                  <p className="font-medium">Equipe Fiscal · Colaboradores</p>
                  <p className="text-xs text-muted-foreground">Enviado há 5 dias • aceito</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500" variant="secondary">Ativo</Badge>
              </div>
              <Button variant="ghost" className="w-full gap-2 text-xs" onClick={() => router.push("/app/membros")}>
                Ver painel de membros
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
