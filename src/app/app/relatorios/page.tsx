"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  LineChart,
  TrendingUp,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

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
import {
  reportInsights,
  reportKpis,
  reportOverview,
  reportQuickActions,
  revenueTrendData,
  taxCompositionData,
} from "@/lib/dashboard-data";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number, fractionDigits = 2) {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function formatCnpj(value?: string | null) {
  if (!value) return "CNPJ não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function hexToRgb(hex: string) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function resolveColor(variable: string, alpha = 1) {
  const normalizedAlpha = Math.max(0, Math.min(1, alpha));
  const fallback = `hsl(var(${variable})${normalizedAlpha < 1 ? ` / ${normalizedAlpha}` : ""})`;
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  if (!raw) return fallback;
  if (raw.startsWith("#")) {
    if (normalizedAlpha >= 1) return raw;
    const { r, g, b } = hexToRgb(raw);
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
  }
  if (/^\d/.test(raw)) {
    return `hsl(${raw}${normalizedAlpha < 1 ? ` / ${normalizedAlpha}` : ""})`;
  }
  return raw;
}

function taxVarForSegment(segmentId: string) {
  switch (segmentId) {
    case "icms":
      return "--tax-icms";
    case "cofins":
      return "--tax-cofins";
    case "pis":
      return "--tax-pis";
    case "irpj":
      return "--tax-irpj";
    case "iss":
      return "--tax-iss";
    case "csll":
      return "--tax-csll";
    default:
      return "--primary";
  }
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  Tooltip,
  Legend,
);

export default function ReportsPage() {
  const { user, company, loading } = useCompanyPortal("/app/relatorios");
  const { resolvedTheme } = useTheme();
  const isLoading = loading || !user;

  const palette = useMemo(() => {
    const grid = resolveColor("--border", resolvedTheme === "dark" ? 0.18 : 0.3);
    return {
      grid,
      textMuted: resolveColor("--muted-foreground"),
      tooltipBg: resolvedTheme === "dark" ? "rgba(5, 10, 18, 0.92)" : "rgba(14, 23, 41, 0.88)",
      tooltipBorder: resolveColor("--border", resolvedTheme === "dark" ? 0.45 : 0.35),
      revenue: resolveColor("--chart-1"),
      revenueFill: resolveColor("--chart-1", 0.15),
      taxes: resolveColor("--tax-icms"),
      taxesFill: resolveColor("--tax-icms", 0.12),
      profit: resolveColor("--chart-2"),
      profitFill: resolveColor("--chart-2", 0.12),
    };
  }, [resolvedTheme]);

  const lineData = useMemo(() => {
    return {
      labels: revenueTrendData.months.map((month) => month.toUpperCase()),
      datasets: [
        {
          label: "Receita Bruta",
          data: revenueTrendData.grossRevenue,
          borderColor: palette.revenue,
          backgroundColor: palette.revenueFill,
          pointBackgroundColor: "#0f172a",
          pointBorderColor: palette.revenue,
          fill: true,
          tension: 0.35,
        },
        {
          label: "Total Impostos",
          data: revenueTrendData.totalTaxes,
          borderColor: palette.taxes,
          backgroundColor: palette.taxesFill,
          pointBackgroundColor: "#0f172a",
          pointBorderColor: palette.taxes,
          fill: false,
          borderDash: [6, 6],
          tension: 0.3,
        },
        {
          label: "Lucro Líquido",
          data: revenueTrendData.netProfit,
          borderColor: palette.profit,
          backgroundColor: palette.profitFill,
          pointBackgroundColor: "#0f172a",
          pointBorderColor: palette.profit,
          fill: false,
          tension: 0.3,
        },
      ],
    };
  }, [palette]);

  const lineOptions: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: palette.textMuted,
            usePointStyle: true,
            boxWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label ?? "";
              const value = ctx.parsed.y ?? 0;
              return `${label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      animation: {
        duration: 450,
        easing: "easeInOutQuart",
      },
      scales: {
        x: {
          grid: {
            color: palette.grid,
          },
          ticks: {
            color: palette.textMuted,
          },
        },
        y: {
          grid: {
            color: palette.grid,
          },
          ticks: {
            color: palette.textMuted,
            callback: (value) => formatCurrency(Number(value)),
          },
        },
      },
      elements: {
        line: {
          borderWidth: 2,
        },
        point: {
          radius: 3,
          hoverRadius: 6,
          borderWidth: 2,
        },
      },
    }),
    [palette],
  );

  const doughnutData = useMemo(() => {
    const alpha = resolvedTheme === "dark" ? 0.84 : 0.76;
    const backgroundColor = taxCompositionData.segments.map((segment) => resolveColor(taxVarForSegment(segment.id), alpha));
    const borderColor = taxCompositionData.segments.map((segment) => resolveColor(taxVarForSegment(segment.id)));

    return {
      labels: taxCompositionData.segments.map((segment) => segment.label),
      datasets: [
        {
          label: "Composição Tributária",
          data: taxCompositionData.segments.map((segment) => segment.value),
          backgroundColor,
          borderColor,
          borderWidth: 2,
          hoverOffset: 12,
        },
      ],
    };
  }, [resolvedTheme]);

  const doughnutOptions: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: palette.textMuted,
            padding: 18,
            usePointStyle: true,
            boxWidth: 10,
            generateLabels: (chart) => {
              const { data } = chart;
              if (!data.labels || !data.datasets.length) return [];
              const total = taxCompositionData.totalTaxes;
              return data.labels.map((label, index) => {
                const value = data.datasets[0].data[index] as number;
                const percent = total ? ((value / total) * 100).toFixed(1) : "0";
                return {
                  text: `${label}: ${formatCurrency(value)} (${percent}%)`,
                  fillStyle: (data.datasets[0].backgroundColor as string[])[index],
                  strokeStyle: (data.datasets[0].borderColor as string[])[index],
                  lineWidth: 2,
                  hidden: false,
                  index,
                };
              });
            },
          },
        },
        tooltip: {
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const label = ctx.label ?? "";
              const value = ctx.parsed ?? 0;
              const total = taxCompositionData.totalTaxes || 1;
              const revenue = taxCompositionData.grossRevenue || 1;
              const percentTaxes = ((value / total) * 100).toFixed(2);
              const percentRevenue = ((value / revenue) * 100).toFixed(2);
              return [
                label,
                `Valor: ${formatCurrency(value)}`,
                `% do Total de Impostos: ${percentTaxes}%`,
                `% da Receita Bruta: ${percentRevenue}%`,
              ];
            },
          },
        },
      },
      cutout: "64%",
      animation: {
        duration: 420,
      },
    }),
    [palette],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">Carregando relatórios...</p>
      </div>
    );
  }

  const companyName = company?.name ?? reportOverview.companyName;
  const cnpj = formatCnpj(company?.cnpj ?? reportOverview.cnpj);

  return (
    <div className="space-y-8 pb-20">
      <header className="rounded-2xl border-2 border-border/40 bg-transparent p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.7)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-8 border border-border/40 px-3" asChild>
                <Link href="/app">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Empresas
                </Link>
              </Button>
              <Badge variant="outline" className="border-border/50 bg-transparent/60 uppercase tracking-wide">
                Relatórios consolidados
              </Badge>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <h1 className="text-3xl font-semibold leading-tight">{companyName}</h1>
              <span className="text-sm text-muted-foreground">CNPJ: {cnpj}</span>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Acompanhe indicadores financeiros, distribuição de impostos e insights estratégicos para acelerar a tomada de decisão da diretoria.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" className="border border-border/40">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar Excel
            </Button>
            <Button size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Adicionar Cenário
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportKpis.map((kpi) => {
          const value =
            kpi.type === "currency"
              ? formatCurrency(kpi.value)
              : kpi.type === "percentage"
                ? formatPercent(kpi.value)
                : kpi.value.toLocaleString("pt-BR");

          let hint: string | null = null;
          if ("hint" in kpi && typeof kpi.hint === "string") {
            hint = kpi.hint;
          } else if ("hintValue" in kpi && typeof kpi.hintValue === "number") {
            const prefix = "hintLabel" in kpi && kpi.hintLabel ? `${kpi.hintLabel}: ` : "";
            const formatted = kpi.hintType === "currency"
              ? formatCurrency(kpi.hintValue)
              : kpi.hintValue.toLocaleString("pt-BR");
            hint = `${prefix}${formatted}`;
          }

          return (
            <Card key={kpi.id} className="border-2 border-border/40 bg-transparent">
              <CardHeader className="space-y-2">
                <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                  {kpi.label}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Card className="border-2 border-border/40 bg-transparent">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LineChart className="h-4 w-4 text-primary" /> Evolução Mensal - 2025
            </div>
            <CardTitle className="text-lg">Receita, impostos e margem ao longo do ano</CardTitle>
            <CardDescription>
              Acompanhe a evolução da receita bruta, carga tributária e lucro líquido mês a mês.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <Line data={lineData} options={lineOptions} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-2 border-border/40 bg-transparent">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Insights
              </div>
              <CardTitle className="text-lg">Análises automáticas dos seus cenários</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {reportInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-border/40 px-4 py-3 text-sm shadow-[inset_0_0_12px_rgba(15,23,42,0.25)]"
                  style={{
                    background:
                      insight.tone === "success"
                        ? "linear-gradient(135deg, hsl(var(--tax-pis) / 0.22), hsl(var(--background) / 0.4))"
                        : "linear-gradient(135deg, hsl(var(--tax-irpj) / 0.22), hsl(var(--background) / 0.35))",
                  }}
                >
                  <p className="font-semibold">{insight.title}</p>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-border/40 bg-transparent">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" /> Composição de Impostos
              </div>
              <CardTitle className="text-lg">Distribuição percentual sobre a receita</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2 border-border/40 bg-transparent">
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-lg">Como aproveitar os relatórios</CardTitle>
            <CardDescription>
              Selecione o formato ideal para compartilhar com diretoria, stakeholders e consultorias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pdf">
              <TabsList className="grid w-full grid-cols-3 text-xs">
                <TabsTrigger value="pdf">PDF</TabsTrigger>
                <TabsTrigger value="planilha">Planilha</TabsTrigger>
                <TabsTrigger value="link">Link seguro</TabsTrigger>
              </TabsList>
              <TabsContent value="pdf" className="space-y-2 text-sm text-muted-foreground">
                <p>• Geração com identidade visual da empresa.</p>
                <p>• Ideal para reuniões táticas e comitês executivos.</p>
                <p>• Inclui resumo executivo e indicadores prioritários.</p>
              </TabsContent>
              <TabsContent value="planilha" className="space-y-2 text-sm text-muted-foreground">
                <p>• Exporta tabelas detalhadas por fornecedor e segmento.</p>
                <p>• Ajuste filtros diretamente no Excel ou Google Sheets.</p>
                <p>• Mantém vínculos com o ERP para auditorias rápidas.</p>
              </TabsContent>
              <TabsContent value="link" className="space-y-2 text-sm text-muted-foreground">
                <p>• Compartilhamento em tempo real com controle granular de acesso.</p>
                <p>• Ideal para consultorias externas e contabilidade.</p>
                <p>• Notificações automáticas quando um cenário é atualizado.</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-2 border-border/40 bg-transparent">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle className="text-lg">Recomendações imediatas</CardTitle>
            <CardDescription>
              Combine relatórios e narrativas para comunicar impactos da CBS/IBS com clareza.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>• Apresente a evolução financeira junto dos riscos priorizados em reuniões mensais.</p>
            <p>• Destaque cenários com carga tributária acima de 30% para discussões rápidas.</p>
            <p>• Sincronize planilhas com o contador antes do fechamento da apuração.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm" className="gap-2">
              Agendar apresentação
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportQuickActions.map((item) => (
          <Card key={item.id} className="border-2 border-border/40 bg-transparent">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-2 text-primary">
                {item.action}
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
