import type { ComponentType } from "react";

import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flag,
  LineChart,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { Company } from "@/types/platform";

export const severityConfig: Record<
  string,
  { label: string; badge: string; description: string }
> = {
  verde: {
    label: "Saudável",
    badge: "bg-[#0f2d22] text-[#63e2b4] border border-[#1cbf93]/60",
    description: "Sem riscos críticos identificados. Mantenha as rotinas de acompanhamento.",
  },
  laranja: {
    label: "Atenção",
    badge: "bg-[#2b1e0b] text-[#f6c445] border border-[#f6c445]/65",
    description: "Riscos moderados. Priorize as ações sugeridas para evitar atrasos.",
  },
  vermelho: {
    label: "Crítico",
    badge: "bg-[#2d1519] text-[#f97066] border border-[#f97066]/65",
    description: "Riscos críticos identificados. Execute as tarefas críticas imediatamente.",
  },
};

export const defaultPillarBreakdown = [
  { id: "planejamento", label: "Planejamento", progress: 45, commentary: "Revisar cenários CBS/IBS." },
  { id: "operacoes", label: "Operações", progress: 32, commentary: "Padronizar notas e cadastros." },
  { id: "compliance", label: "Compliance", progress: 55, commentary: "Atualizar rotinas fiscais." },
];

export const defaultActions = [
  {
    id: "acao-1",
    title: "Conferir regime especial CBS com contador",
    dueIn: "4 dias",
    owner: "Você",
    severity: "laranja",
  },
  {
    id: "acao-2",
    title: "Validar XMLs com Conformidade Fácil",
    dueIn: "7 dias",
    owner: "Equipe Fiscal",
    severity: "vermelho",
  },
  {
    id: "acao-3",
    title: "Enviar briefing da reforma à diretoria",
    dueIn: "12 dias",
    owner: "Consultoria",
    severity: "verde",
  },
];

export const defaultAlerts = [
  {
    id: "alerta-1",
    source: "Checklist Essencial",
    title: "Pendência: Revisar créditos de insumos na CBS",
    severity: "laranja",
    actionableUntil: "20/10/2025",
  },
  {
    id: "alerta-2",
    source: "Atualização Legal",
    title: "Publicada nova nota técnica sobre regimes especiais",
    severity: "verde",
    actionableUntil: null,
  },
  {
    id: "alerta-3",
    source: "Simulador Tributário",
    title: "Cenário atual reduz margem em 1,8% sem reajuste",
    severity: "vermelho",
    actionableUntil: "18/10/2025",
  },
];

export const contentRecommendations = [
  {
    id: "content-1",
    title: "Mapa visual da CBS para empresas do Simples",
    type: "Mapa mental",
    actionLabel: "Abrir mapa",
    icon: FileText,
  },
  {
    id: "content-2",
    title: "Workshop: Preços 2026 sem perder competitividade",
    type: "Webinar",
    actionLabel: "Inscrever-se",
    icon: PlayCircle,
  },
  {
    id: "content-3",
    title: "Checklist de comunicação interna sobre a reforma",
    type: "Template",
    actionLabel: "Baixar template",
    icon: ClipboardList,
  },
];

export type ReportSummary = {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  highlights: string[];
  icon: ComponentType<{ className?: string }>;
};

export const reportSummaries: ReportSummary[] = [
  {
    id: "relatorio-progresso",
    title: "Resumo executivo",
    description: "Indicadores-chave de avanço do checklist com recomendações prioritárias.",
    updatedAt: "Atualizado hoje às 09h",
    highlights: ["48% concluído", "3 riscos críticos"],
    icon: LineChart,
  },
  {
    id: "relatorio-financeiro",
    title: "Simulações financeiras",
    description: "Comparativo de margens CBS/IBS e impacto em precificação.",
    updatedAt: "Atualizado em 15/10",
    highlights: ["Margem -1,8%", "Cenário otimista +2,3%"],
    icon: BarChart3,
  },
  {
    id: "relatorio-conformidade",
    title: "Relatório de conformidade",
    description: "Auditoria das obligations acessórias e status das automações fiscais.",
    updatedAt: "Atualizado em 12/10",
    highlights: ["12 pendências leves", "Automações em teste"],
    icon: FileText,
  },
];

export const reportOverview = {
  companyName: "RB ACESSORIOS",
  cnpj: "35496100000135",
  scenarios: 12,
  drafts: 0,
  revenueTotal: 2965000,
  taxLoad: 0.2719,
  netMargin: 0.1132,
  netProfit: 335657.5,
  totalTaxes: 993202.5,
};

export type ReportKpi = {
  id: string;
  label: string;
  type: "currency" | "percentage" | "number";
  value: number;
  hint?: string;
  hintValue?: number;
  hintType?: "currency" | "number";
  hintLabel?: string;
};

export const reportKpis: ReportKpi[] = [
  {
    id: "revenue-total",
    label: "Receita Total (Ano)",
    type: "currency" as const,
    value: reportOverview.revenueTotal,
    hint: `${reportOverview.scenarios} cenários`,
  },
  {
    id: "tax-load",
    label: "Carga Tributária",
    type: "percentage" as const,
    value: reportOverview.taxLoad,
    hint: "Moderada",
  },
  {
    id: "net-margin",
    label: "Margem Líquida",
    type: "percentage" as const,
    value: reportOverview.netMargin,
    hintValue: reportOverview.netProfit,
    hintType: "currency" as const,
    hintLabel: "Lucro",
  },
  {
    id: "scenarios",
    label: "Total de Cenários",
    type: "number" as const,
    value: reportOverview.scenarios,
    hint: `${reportOverview.drafts} rascunhos`,
  },
];

export const revenueTrendData = {
  months: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  grossRevenue: [230000, 240000, 250000, 180000, 190000, 205000, 215000, 220000, 240000, 280000, 320000, 360000],
  totalTaxes: [160000, 170000, 180000, 150000, 145000, 155000, 150000, 152000, 165000, 190000, 210000, 235000],
  netProfit: [-20000, -15000, -10000, 5000, 12000, -80000, 3000, 5000, 7000, 15000, 18000, 20000],
};

export const taxCompositionData = {
  grossRevenue: reportOverview.revenueTotal,
  totalTaxes: reportOverview.totalTaxes,
  segments: [
    { id: "icms", label: "ICMS", value: 566125.425 },
    { id: "cofins", label: "COFINS", value: 188708.475 },
    { id: "iss", label: "ISS", value: 139048.35 },
    { id: "pis", label: "PIS", value: 49660.125 },
    { id: "irpj", label: "IRPJ", value: 29796.075 },
    { id: "csll", label: "CSLL", value: 19864.05 },
  ],
};

export const reportInsights = [
  {
    id: "total",
    tone: "success" as const,
    title: "Receita total: R$ 2.965.000,00",
    description: "Performance sólida",
  },
  {
    id: "best-scenario",
    tone: "warning" as const,
    title: "Melhor cenário: Abril (10.7% impostos)",
    description: "Use como referência",
  },
];

export const reportQuickActions = [
  {
    id: "cenarios",
    title: "Cenários",
    description: "Gerencie e crie novos cenários de planejamento",
    action: "Acessar cenários",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Visualize análises e gráficos consolidados",
    action: "Abrir relatórios",
  },
  {
    id: "comparativos",
    title: "Comparativos",
    description: "Compare cenários e analise variações",
    action: "Explorar comparativos",
  },
];

export type TimelineStatus = "em-andamento" | "prevista" | "proxima";

export const transitionTimeline = [
  {
    id: "fase-planejamento",
    icon: CalendarDays,
    period: "Agosto - Dezembro 2025",
    title: "Planejamento estratégico",
    description: "Mapear impactos da CBS/IBS, revisar contratos-chave e aprovar orçamento de ajuste.",
    status: "em-andamento" as TimelineStatus,
  },
  {
    id: "fase-implantacao",
    icon: Sparkles,
    period: "Janeiro - Junho 2026",
    title: "Implantação operacional",
    description: "Adequar sistemas fiscais, treinar equipe interna e garantir integração com o contador.",
    status: "prevista" as TimelineStatus,
  },
  {
    id: "fase-monitoramento",
    icon: Flag,
    period: "Julho - Dezembro 2026",
    title: "Monitoramento e otimização",
    description: "Acompanhar indicadores de margem, revisar cadastros e documentar ganhos recorrentes.",
    status: "proxima" as TimelineStatus,
  },
];

export const timelineStatusConfig: Record<
  TimelineStatus,
  { label: string; badge: string }
> = {
  "em-andamento": {
    label: "Em andamento",
    badge: "bg-primary/10 text-primary border border-primary/40",
  },
  prevista: {
    label: "Prevista",
    badge: "bg-amber-500/10 text-amber-500 border border-amber-500/40",
  },
  proxima: {
    label: "Próxima fase",
    badge: "bg-slate-500/10 text-slate-500 border border-slate-500/40",
  },
};

export const focusRecommendations = [
  "Revisar plano de comunicação com diretoria e fornecedores.",
  "Finalizar parametrização fiscal no ERP para CBS.",
  "Agendar sessão de alinhamento com contador sobre regimes especiais.",
];

export const maturityTabs = [
  {
    id: "analise",
    title: "Insights",
    icon: LineChart,
    content: [
      "Conclua a trilha de Planejamento para desbloquear recomendações avançadas de preço.",
      "Considere habilitar automações de XML para reduzir riscos de conformidade.",
    ],
  },
  {
    id: "tarefas",
    title: "Tarefas",
    icon: ClipboardList,
    content: [
      "Validar notas fiscais dos últimos 3 meses.",
      "Revisar contratos com fornecedores sob nova alíquota CBS.",
      "Agendar workshop interno sobre reforma com stakeholders-chave.",
    ],
  },
  {
    id: "notas",
    title: "Alertas",
    icon: BellRing,
    content: [
      "Duas notificações críticas aguardando revisão.",
      "Próxima atualização da Calculadora CBS em 3 dias úteis.",
    ],
  },
];

export function formatCompanySummary(company: Company | null) {
  if (!company) return null;
  const metadata = (company.metadata as Record<string, unknown>) ?? {};
  return {
    revenueRange: (metadata.revenueRange as string) ?? "Não informado",
    employeeSize: (metadata.employeeSize as string) ?? "Equipe não definida",
    mainGoal: (metadata.mainGoal as string) ?? "Defina o principal objetivo no onboarding",
    mainChallenge:
      (metadata.mainChallenge as string) ?? "Compartilhe seu maior desafio para recomendações mais precisas",
    automation: Boolean(metadata.automation),
    advisorSupport: metadata.advisorSupport === undefined ? true : Boolean(metadata.advisorSupport),
  };
}

export const dashboardHighlights = [
  {
    id: "progresso",
    title: "Progresso geral",
    valueKey: "checklistProgress",
    icon: CheckCircle2,
    description: "Checklist Essencial",
  },
  {
    id: "risco",
    title: "Risco atual",
    icon: ShieldCheck,
  },
  {
    id: "revisao",
    title: "Próxima revisão",
    icon: CalendarClock,
  },
  {
    id: "cenario",
    title: "Cenário de margem",
    icon: BarChart3,
  },
];

export const quickTips = [
  {
    id: "tip-1",
    icon: AlertTriangle,
    title: "Compartilhe o painel",
    description:
      "Convide sua equipe e contador. Cada usuário verá tarefas e alertas segmentados de acordo com o perfil.",
  },
];
