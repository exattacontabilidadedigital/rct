"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const { login, registerCompany, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"entrar" | "criar">("entrar");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    email: "",
    password: "",
    regime: regimes[0] ?? "Simples Nacional",
    sector: sectors[0] ?? "Varejo",
    cnpj: "",
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRetriedRef = useRef(false);
  const hasRedirectedRef = useRef(false);
  const loginCredentialsRef = useRef(loginForm);

  useEffect(() => {
    loginCredentialsRef.current = loginForm;
  }, [loginForm]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      hasRedirectedRef.current = false;
      return;
    }

    if (hasRedirectedRef.current) {
      return;
    }

    hasRedirectedRef.current = true;
    router.replace("/app/dashboard");
  }, [user, router]);

  useEffect(() => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    if (message && message.type !== "success") {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null);
        messageTimeoutRef.current = null;
      }, 5000);
    }

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, [message]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    hasRetriedRef.current = false;
    setIsSubmitting(true);
    setMessage(null);

    const sanitizedCredentials = {
      email: loginForm.email.trim().toLowerCase(),
      password: loginForm.password.trim(),
    };

    loginCredentialsRef.current = sanitizedCredentials;

    if (!sanitizedCredentials.email || !sanitizedCredentials.password) {
      setIsSubmitting(false);
      setMessage({ type: "error", text: "Informe e-mail e senha para continuar." });
      return;
    }

    if (
      sanitizedCredentials.email !== loginForm.email ||
      sanitizedCredentials.password !== loginForm.password
    ) {
      setLoginForm(sanitizedCredentials);
    }

    const result = await login(sanitizedCredentials);
    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: "error", text: result.message ?? "Erro ao entrar" });
      if (result.code === "invalid-credentials") {
        return;
      }

      if (!hasRetriedRef.current) {
        hasRetriedRef.current = true;
        setMessage({
          type: "info",
          text: "Não foi possível entrar. Tentaremos novamente em alguns segundos...",
        });
        retryTimeoutRef.current = setTimeout(async () => {
          setIsSubmitting(true);
          const retryResult = await login(loginCredentialsRef.current);
          setIsSubmitting(false);
          if (!retryResult.success) {
            setMessage({
              type: "error",
              text: retryResult.message ?? "Tentativa automática também falhou. Verifique os dados e tente novamente.",
            });
          } else {
            setMessage({ type: "success", text: "Login realizado com sucesso" });
            hasRedirectedRef.current = true;
            router.replace("/app/dashboard");
          }
          retryTimeoutRef.current = null;
        }, 3000);
      }
      return;
    }

    setMessage({ type: "success", text: "Login realizado com sucesso" });
    hasRedirectedRef.current = true;
    router.replace("/app/dashboard");
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
      text: "Empresa cadastrada com sucesso! Você será redirecionado para fazer login.",
    });
    
    // Aguardar 2 segundos para exibir a mensagem antes de redirecionar
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  const handleTabChange = (value: string) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    hasRetriedRef.current = false;
    setMessage(null);
    setIsSubmitting(false);

    const nextTab = value === "criar" ? "criar" : "entrar";
    setActiveTab(nextTab);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background px-4">
      <Card className="w-full max-w-xl shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-semibold">Acesso à plataforma</CardTitle>
            <CardDescription>
              Entre com suas credenciais ou crie uma conta em poucos passos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="entrar" className="mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail corporativo</Label>
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
                  <div className="space-y-2">
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
                    {isSubmitting ? "Entrando..." : "Acessar"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Prefere testar antes? Use empresa@rtc.com, colaborador@rtc.com ou contador@rtc.com (senha: demo123).
                  </p>
                </form>
              </TabsContent>
              <TabsContent value="criar" className="mt-4 space-y-5">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="text-left text-sm font-medium text-foreground">Criar conta de empresa</p>
                  <p>
                    Este formulário habilita o workspace da empresa na plataforma. Colaboradores e contadores adicionais
                    podem ser incluídos depois, nas Configurações ou pelo painel de convites.
                  </p>
                </div>
                <form onSubmit={handleRegisterCompany} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                      <Label>Regime tributário</Label>
                      <Select
                        value={companyForm.regime}
                        onValueChange={(value) =>
                          setCompanyForm((prev) => ({ ...prev, regime: value }))
                        }
                      >
                        <SelectTrigger>
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
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Setor principal</Label>
                      <Select
                        value={companyForm.sector}
                        onValueChange={(value) =>
                          setCompanyForm((prev) => ({ ...prev, sector: value }))
                        }
                      >
                        <SelectTrigger>
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
                    <div className="space-y-2">
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
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Cadastrando..." : "Criar minha conta"}
                  </Button>
                </form>
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

            <div className="space-y-1 text-center text-sm text-muted-foreground">
              <p>
                Precisa de ajuda? Escreva para <Link href="mailto:suporte@rtc.com">suporte@rtc.com</Link>
              </p>
              <p>
                Ao continuar você concorda com os <Link href="/termos">Termos</Link> e a
                <Link className="ml-1" href="/politica-privacidade">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
    </main>
  );
}
