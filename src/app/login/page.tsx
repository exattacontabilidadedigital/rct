"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Factory,
  LogIn,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/types/platform";

interface MessageState {
  type: "success" | "error" | "info";
  text: string;
}

const regimes = [
  "Simples Nacional",
  "Lucro Presumido",
  "Lucro Real",
  "MEI",
];

const sectors = [
  "Varejo",
  "Serviços",
  "Indústria",
  "Tecnologia",
  "Saúde",
  "Educação",
];

export default function LoginPage() {
  const router = useRouter();
  const {
    companies,
    login,
    registerAccountant,
    registerCollaborator,
    registerCompany,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"entrar" | "criar">("entrar");
  const [registerRole, setRegisterRole] = useState<UserRole>("empresa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [accountantCompanies, setAccountantCompanies] = useState<string[]>([]);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    email: "",
    password: "",
    regime: "Simples Nacional",
    sector: "Varejo",
    cnpj: "",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [collaboratorForm, setCollaboratorForm] = useState({
    name: "",
    email: "",
    password: "",
    companyId: "",
  });
  const [accountantForm, setAccountantForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const availableCompanies = useMemo(() => companies ?? [], [companies]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await login(loginForm);
    setIsSubmitting(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Erro ao entrar" });
      return;
    }
    setMessage({ type: "success", text: "Login realizado com sucesso" });
    router.push("/app/dashboard");
  };

  const handleRegisterCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await registerCompany(companyForm);
    setIsSubmitting(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Erro ao cadastrar" });
      return;
    }
    setMessage({
      type: "success",
      text: "Empresa cadastrada! Você será direcionado para o onboarding inicial.",
    });
    router.push("/onboarding");
  };

  const handleRegisterCollaborator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await registerCollaborator(collaboratorForm);
    setIsSubmitting(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Erro ao cadastrar colaborador" });
      return;
    }
    setMessage({
      type: "success",
      text: "Cadastro concluído! Você já pode colaborar com a preparação tributária.",
    });
    router.push("/app/dashboard");
  };

  const handleRegisterAccountant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await registerAccountant({
      ...accountantForm,
      companyIds: accountantCompanies,
    });
    setIsSubmitting(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Erro ao cadastrar contador" });
      return;
    }
    setMessage({
      type: "success",
      text: "Cadastro concluído! Vincule empresas clientes e acompanhe tudo em um painel único.",
    });
    router.push("/app/dashboard");
  };

  const renderRegisterForm = () => {
    if (registerRole === "empresa") {
      return (
        <form onSubmit={handleRegisterCompany} className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="company-name">Nome da empresa</Label>
            <Input
              id="company-name"
              placeholder="Ex.: Mercado Luz"
              required
              value={companyForm.name}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="company-email">E-mail corporativo</Label>
            <Input
              id="company-email"
              type="email"
              placeholder="contato@empresa.com"
              required
              value={companyForm.email}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="company-password">Senha</Label>
            <Input
              id="company-password"
              type="password"
              required
              value={companyForm.password}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="company-cnpj">CNPJ (opcional)</Label>
            <Input
              id="company-cnpj"
              placeholder="00.000.000/0000-00"
              value={companyForm.cnpj}
              onChange={(event) =>
                setCompanyForm((prev) => ({ ...prev, cnpj: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label>Regime tributário</Label>
            <Select
              defaultValue={companyForm.regime}
              onValueChange={(value) =>
                setCompanyForm((prev) => ({ ...prev, regime: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {regimes.map((regime) => (
                  <SelectItem key={regime} value={regime}>
                    {regime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3">
            <Label>Setor principal</Label>
            <Select
              defaultValue={companyForm.sector}
              onValueChange={(value) =>
                setCompanyForm((prev) => ({ ...prev, sector: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Cadastrando..." : "Criar minha conta"}
          </Button>
        </form>
      );
    }

    if (registerRole === "colaborador") {
      return (
        <form onSubmit={handleRegisterCollaborator} className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="collaborator-name">Nome completo</Label>
            <Input
              id="collaborator-name"
              placeholder="Seu nome"
              required
              value={collaboratorForm.name}
              onChange={(event) =>
                setCollaboratorForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="collaborator-email">E-mail corporativo</Label>
            <Input
              id="collaborator-email"
              type="email"
              placeholder="voce@empresa.com"
              required
              value={collaboratorForm.email}
              onChange={(event) =>
                setCollaboratorForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="collaborator-password">Senha</Label>
            <Input
              id="collaborator-password"
              type="password"
              required
              value={collaboratorForm.password}
              onChange={(event) =>
                setCollaboratorForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3">
            <Label>Vincular a qual empresa?</Label>
            <Select
              value={collaboratorForm.companyId}
              onValueChange={(value) =>
                setCollaboratorForm((prev) => ({ ...prev, companyId: value }))
              }
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
            <p className="text-xs text-muted-foreground">
              Caso não encontre sua empresa, solicite o código exclusivo ao responsável ou cadastre a organização
              acima.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Cadastrando..." : "Entrar na empresa"}
          </Button>
        </form>
      );
    }

    return (
      <form onSubmit={handleRegisterAccountant} className="space-y-4">
        <div className="grid gap-3">
          <Label htmlFor="accountant-name">Nome do escritório ou profissional</Label>
          <Input
            id="accountant-name"
            placeholder="Ex.: Clínica Contábil"
            required
            value={accountantForm.name}
            onChange={(event) =>
              setAccountantForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="accountant-email">E-mail</Label>
          <Input
            id="accountant-email"
            type="email"
            placeholder="contato@escritorio.com"
            required
            value={accountantForm.email}
            onChange={(event) =>
              setAccountantForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="accountant-password">Senha</Label>
          <Input
            id="accountant-password"
            type="password"
            required
            value={accountantForm.password}
            onChange={(event) =>
              setAccountantForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Empresas clientes (opcional)</Label>
          <div className="grid gap-3 rounded-lg border p-3">
            {availableCompanies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há empresas cadastradas. Você pode adicionar posteriormente.
              </p>
            ) : (
              availableCompanies.map((company) => {
                const checked = accountantCompanies.includes(company.id);
                return (
                  <label key={company.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setAccountantCompanies((prev) =>
                          value
                            ? [...prev, company.id]
                            : prev.filter((id) => id !== company.id)
                        );
                      }}
                    />
                    <span className="flex flex-col">
                      <strong>{company.name}</strong>
                      <span className="text-xs text-muted-foreground">
                        {company.regime} · Checklist {company.checklistProgress}%
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Habilitar painel contábil"}
        </Button>
      </form>
    );
  };

  return (
    <div className="bg-muted/30 min-h-screen py-10">
      <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="mx-auto w-full max-w-xl">
          <Card className="shadow-lg">
            <CardHeader className="space-y-2 text-center">
              <Badge variant="outline" className="mx-auto w-fit">
                Acesso seguro à plataforma
              </Badge>
              <CardTitle className="text-2xl font-semibold">Entrar ou criar conta</CardTitle>
              <CardDescription>
                Central de autenticação para empresas, colaboradores e contadores liderarem a reforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                <TabsList className="mx-auto">
                  <TabsTrigger value="entrar" className="gap-1">
                    <LogIn className="h-4 w-4" /> Entrar
                  </TabsTrigger>
                  <TabsTrigger value="criar" className="gap-1">
                    <UserPlus className="h-4 w-4" /> Criar conta
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="entrar" className="mt-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="voce@empresa.com"
                        required
                        value={loginForm.email}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Entrando..." : "Acessar plataforma"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Utilize os acessos demo para explorar rapidamente: empresa@rtc.com, colaborador@rtc.com ou
                      contador@rtc.com (senha: demo123).
                    </p>
                  </form>
                </TabsContent>
                <TabsContent value="criar" className="mt-4 space-y-5">
                  <div className="grid gap-3">
                    <Label>Qual perfil você deseja criar?</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant={registerRole === "empresa" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRegisterRole("empresa")}
                      >
                        <Building2 className="h-4 w-4" /> Empresa
                      </Button>
                      <Button
                        type="button"
                        variant={registerRole === "colaborador" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRegisterRole("colaborador")}
                      >
                        <Users className="h-4 w-4" /> Colaborador
                      </Button>
                      <Button
                        type="button"
                        variant={registerRole === "contador" ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setRegisterRole("contador")}
                      >
                        <ShieldCheck className="h-4 w-4" /> Contador
                      </Button>
                    </div>
                  </div>
                  {renderRegisterForm()}
                </TabsContent>
              </Tabs>
              {message ? (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    message.type === "error"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-200"
                  }`}
                >
                  {message.text}
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <p>
                Precisa de ajuda? Entre em contato em <Link href="mailto:suporte@rtc.com">suporte@rtc.com</Link>
              </p>
              <p>
                Ao continuar você concorda com os <Link href="/termos">Termos de Uso</Link> e a
                <Link className="ml-1" href="/politica-privacidade">
                  Política de Privacidade
                </Link>
                .
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="hidden flex-col gap-6 lg:flex">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader className="space-y-1">
              <Badge variant="secondary" className="w-fit">
                Benefícios imediatos
              </Badge>
              <CardTitle className="text-2xl">
                Comece o diagnóstico em menos de 5 minutos
              </CardTitle>
              <CardDescription>
                O Checklist Essencial gratuito já traz alertas prioritários e trilhas por pilar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Factory className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Empresas</p>
                  <p className="text-sm text-muted-foreground">
                    Visualize impactos em preços e margens, compartilhe com diretoria e exporte relatórios.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Colaboradores</p>
                  <p className="text-sm text-muted-foreground">
                    Recebem tarefas, prazos e lembretes automáticos para acelerar a execução.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Contadores</p>
                  <p className="text-sm text-muted-foreground">
                    Acompanham múltiplas empresas com alertas laranja e vermelho priorizando o que é urgente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Use credenciais demo para testar agora</CardTitle>
              <CardDescription>
                Explore a plataforma sem criar conta. Cada perfil tem dados simulados.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="rounded-lg border p-4">
                <p className="font-medium">Empresa</p>
                <p>Email: empresa@rtc.com · Senha: demo123</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">Colaborador</p>
                <p>Email: colaborador@rtc.com · Senha: demo123</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium">Contador</p>
                <p>Email: contador@rtc.com · Senha: demo123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
