"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Share2, ShieldCheck, Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import type { Company, User } from "@/types/platform";

type PublicUser = Pick<User, "id" | "name" | "email" | "role">;

interface MemberRow {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  status: "active" | "owner";
}

const roleLabels: Record<string, string> = {
  owner: "Responsável",
  colaborador: "Colaborador",
  contador: "Contador",
};

function buildMemberRows(company: Company | null, allUsers: PublicUser[]) {
  if (!company) return { ownerRow: null, collaborators: [], accountants: [] };

  const findUser = (id: string) => allUsers.find((candidate) => candidate.id === id) ?? null;

  const ownerUser = findUser(company.ownerId);
  const ownerRow: MemberRow | null = ownerUser
    ? {
        id: ownerUser.id,
        name: ownerUser.name,
        email: ownerUser.email,
        roleLabel: roleLabels.owner,
        status: "owner",
      }
    : null;

  const collaboratorRows: MemberRow[] = Array.from(new Set(company.employees)).map((id) => {
    const user = findUser(id);
    if (!user) {
      return {
        id,
        name: "Colaborador pendente",
        email: "--",
        roleLabel: roleLabels.colaborador,
        status: "active",
      };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleLabel: roleLabels.colaborador,
      status: "active",
    };
  });

  const accountantRows: MemberRow[] = Array.from(new Set(company.accountantIds ?? [])).map((id) => {
    const user = findUser(id);
    if (!user) {
      return {
        id,
        name: "Contador convidado",
        email: "--",
        roleLabel: roleLabels.contador,
        status: "active",
      };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleLabel: roleLabels.contador,
      status: "active",
    };
  });

  return { ownerRow, collaborators: collaboratorRows, accountants: accountantRows };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, getAccessibleCompanies, allUsers } = useAuth();

  const accessibleCompanies = useMemo(() => {
    if (!user) return [] as Company[];
    return getAccessibleCompanies(user.id);
  }, [getAccessibleCompanies, user]);

  const company = accessibleCompanies.length ? accessibleCompanies[0] : null;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/app/membros");
      return;
    }
    if (!company) {
      router.replace("/onboarding");
    }
  }, [company, loading, router, user]);

  const { ownerRow, collaborators, accountants } = buildMemberRows(company, allUsers);

  const invitedStatus = searchParams.get("invited");
  const invitedRole = searchParams.get("perfil");
  const successMessage = invitedRole === "contador" ? "Contador conectado com sucesso." : "Colaborador adicionado à equipe.";

  if (loading || !user || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando membros da empresa...</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen py-8">
      <div className="container mx-auto space-y-6 px-4 pb-16 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/app/dashboard")}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao dashboard
            </Button>
            <div>
              <Badge variant="outline" className="w-fit">Gestão de acessos</Badge>
              <h1 className="text-3xl font-semibold">Pessoas conectadas</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Visualize quem já está colaborando na jornada da Reforma Tributária. Use Configurações &gt; Usuários para criar colaboradores instantaneamente ou envie convites quando precisar incluir contadores e parceiros.
              </p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => router.push("/app/convidar")}
            type="button"
          >
            Convidar novo acesso
            <ArrowRight className="h-4 w-4" />
          </Button>
        </header>

        {invitedStatus === "success" ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Convite concluído</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="border-primary/20">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Equipe interna</CardTitle>
              <CardDescription>Responsável principal e colaboradores com acesso ao checklist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/60">
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownerRow ? (
                    <TableRow key={ownerRow.id} className="border-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback>{getInitials(ownerRow.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{ownerRow.name}</p>
                            <p className="text-xs text-muted-foreground">{ownerRow.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs uppercase">{ownerRow.roleLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-500">Responsável</TableCell>
                    </TableRow>
                  ) : null}
                  {collaborators.length ? (
                    collaborators.map((member) => (
                      <TableRow key={member.id} className="border-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border">
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs uppercase">{member.roleLabel}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">Ativo</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum colaborador cadastrado ainda. Use o botão acima para convidar.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Contadores conectados</CardTitle>
              <CardDescription>Profissionais com acesso consultivo à empresa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {accountants.length ? (
                accountants.map((member) => (
                  <div key={member.id} className="flex items-start justify-between rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase text-primary">Ativo</Badge>
                  </div>
                ))
              ) : (
                <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Ainda sem contador conectado.
                  </p>
                  <Button variant="outline" className="gap-2 text-xs" onClick={() => router.push("/app/convidar?perfil=contador")}
                    type="button"
                  >
                    Convidar contador
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
              <p>Contadores têm acesso às empresas associadas e podem validar documentos antes da emissão.</p>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Resumo do acesso</CardTitle>
              <CardDescription>Dados principais usados para calibrar recomendações e permissões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Empresa</span>
                <span className="font-medium">{company.name}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Perfil atual</span>
                <span className="font-medium uppercase">{user.role}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <span className="text-muted-foreground">Total de acessos</span>
                <span className="font-medium">{1 + collaborators.length + accountants.length}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="gap-2 text-xs" onClick={() => router.push("/app/convidar")}
                type="button"
              >
                Gerenciar convites
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-500/10 dark:text-amber-100">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" /> Boas práticas de colaboração
              </CardTitle>
              <CardDescription className="text-amber-900/80 dark:text-amber-100/80">
                Garanta que cada etapa da reforma tenha um responsável claro e comunicação constante.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Alinhe expectativas com a diretoria sobre frequência de atualizações.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Compartilhe o checklist com a equipe toda semana.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Utilize alertas laranja e vermelho para priorizar reuniões.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="gap-2" onClick={() => router.push("/app/convidar")}
                type="button"
              >
                Convidar mais pessoas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </section>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5" /> Precisa convidar alguém sem e-mail corporativo?
            </CardTitle>
            <CardDescription>Compartilhe o status pelo link do dashboard exportado em PDF.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" className="gap-2">
              <AlertCircle className="h-4 w-4" /> Ver instruções de exportação
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
