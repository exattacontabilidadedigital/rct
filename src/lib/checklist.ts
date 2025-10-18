import type {
  ChecklistBoard,
  ChecklistNotification,
  ChecklistTask,
  ChecklistTaskStatus,
  ChecklistPhase,
  ChecklistPillar,
  ChecklistPriority,
  ChecklistTaskEvidence,
  ChecklistTaskNote,
  ChecklistTaskReference,
  NotificationSeverity,
} from "@/types/platform";

import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";

const severityWeight: Record<NotificationSeverity, number> = {
  verde: 1,
  laranja: 2,
  vermelho: 3,
};

const priorityWeight: Record<ChecklistPriority, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

export const checklistStatuses: ChecklistTaskStatus[] = ["todo", "doing", "done"];

const nowISO = () => new Date().toISOString();

type BlueprintTaskDefinition = {
  id: string;
  title: string;
  description: string;
  category: ChecklistTask["category"];
  severity: NotificationSeverity;
  owner: string;
  priority: ChecklistPriority;
  phase: ChecklistPhase;
  pillar: ChecklistPillar;
  dueInDays?: number;
  status?: ChecklistTaskStatus;
  references?: ChecklistTaskReference[];
  evidences?: ChecklistTaskEvidence[];
  tags?: string[];
};

type BlueprintPhaseDefinition = {
  id: string;
  phase: ChecklistPhase;
  title: string;
  summary: string;
  milestone: string;
  focus: string[];
  tasks: BlueprintTaskDefinition[];
};

export type ChecklistBlueprintTask = BlueprintTaskDefinition;
export type ChecklistBlueprintPhase = BlueprintPhaseDefinition;

const CRT3_BLUEPRINT: ChecklistBlueprintPhase[] = [
  {
    id: "fase-fundamentos",
    phase: "Fundamentos",
    title: "Fundamentos da Reforma",
    summary: "Estabeleça governança e entendimento do impacto financeiro.",
    milestone: "Comitê instituído e diagnóstico inicial concluído",
    focus: ["Governança", "Impacto financeiro", "Mapa de riscos"],
    tasks: [
      {
        id: "fundamentos-impacto-financeiro",
        title: "Quantificar impacto financeiro da CBS/IBS",
        description: "Consolide cenários de crédito, débito e regimes especiais para a transição.",
        category: "Planejamento",
        severity: "vermelho",
        owner: "Equipe Financeira",
        priority: "alta",
        phase: "Fundamentos",
        pillar: "Governança & Estratégia",
        dueInDays: 10,
        status: "todo",
        references: [
          {
            label: "Guia rápido da Reforma Tributária",
            type: "guia",
            url: "https://www.gov.br/economia/pt-br/assuntos/reforma-tributaria",
          },
          {
            label: "Modelo de simulação CBS/IBS",
            type: "template",
          },
        ],
        evidences: [
          {
            label: "Relatório de impacto financeiro",
            status: "pendente",
          },
        ],
        tags: ["crt3", "fundamentos", "financeiro"],
      },
      {
        id: "fundamentos-comite-reforma",
        title: "Formar comitê da Reforma Tributária",
        description: "Defina representantes de finanças, fiscal, tecnologia e jurídico para governança.",
        category: "Planejamento",
        severity: "laranja",
        owner: "Diretoria",
        priority: "media",
        phase: "Fundamentos",
        pillar: "Governança & Estratégia",
        dueInDays: 5,
        status: "doing",
        references: [
          {
            label: "Estrutura sugerida de comitê",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Ata de constituição do comitê",
            status: "em revisão",
          },
        ],
        tags: ["crt3", "fundamentos", "governanca"],
      },
      {
        id: "fundamentos-matriz-riscos",
        title: "Atualizar matriz de riscos tributários",
        description: "Mapeie riscos críticos e defina tolerâncias para a fase de implementação.",
        category: "Compliance",
        severity: "laranja",
        owner: "Consultoria",
        priority: "media",
        phase: "Fundamentos",
        pillar: "Processos & Obrigações",
        dueInDays: 14,
        status: "todo",
        references: [
          {
            label: "Checklist de riscos CRT-3",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Matriz de riscos validada",
            status: "pendente",
          },
        ],
        tags: ["crt3", "fundamentos", "riscos"],
      },
    ],
  },
  {
    id: "fase-planejamento",
    phase: "Planejamento",
    title: "Planejamento de Adequação",
    summary: "Priorize cadastros, processos e comunicação com stakeholders.",
    milestone: "Cadastros revisados e plano de comunicação aprovado",
    focus: ["Cadastros", "Processos", "Comunicação"],
    tasks: [
      {
        id: "planejamento-cadastros-ncm",
        title: "Revisar cadastros de produtos e NCM",
        description: "Atualize códigos fiscais, exceções e benefícios conforme regras da CBS/IBS.",
        category: "Operações",
        severity: "vermelho",
        owner: "Equipe Fiscal",
        priority: "alta",
        phase: "Planejamento",
        pillar: "Dados & Cadastros",
        dueInDays: 18,
        status: "todo",
        references: [
          {
            label: "Tabela NCM atualizada",
            type: "legislação",
            url: "https://www.gov.br/receitafederal/pt-br/assuntos/normas",
          },
        ],
        evidences: [
          {
            label: "Relatório de divergências de cadastro",
            status: "pendente",
          },
        ],
        tags: ["crt3", "planejamento", "cadastros"],
      },
      {
        id: "planejamento-relacionamento-fornecedores",
        title: "Alinhar fornecedores críticos",
        description: "Compartilhe mudanças de cobrança e requisitos de documentação com parceiros estratégicos.",
        category: "Operações",
        severity: "laranja",
        owner: "Compras",
        priority: "media",
        phase: "Planejamento",
        pillar: "Processos & Obrigações",
        dueInDays: 24,
        status: "doing",
        references: [
          {
            label: "Roteiro de comunicação CRT-3",
            type: "guia",
          },
        ],
        evidences: [
          {
            label: "Plano de comunicação aprovado",
            status: "em revisão",
          },
        ],
        tags: ["crt3", "planejamento", "fornecedores"],
      },
      {
        id: "planejamento-ajuste-precificacao",
        title: "Simular cenários de precificação",
        description: "Modelar margens antes/depois e sugerir ajustes diplomados pela diretoria.",
        category: "Planejamento",
        severity: "laranja",
        owner: "Financeiro",
        priority: "media",
        phase: "Planejamento",
        pillar: "Governança & Estratégia",
        dueInDays: 30,
        status: "done",
        references: [
          {
            label: "Template de simulação de margens",
            type: "template",
          },
        ],
        evidences: [
          {
            label: "Cenários aprovados",
            status: "concluída",
          },
        ],
        tags: ["crt3", "planejamento", "precificacao"],
      },
    ],
  },
  {
    id: "fase-implementacao",
    phase: "Implementação",
    title: "Implementação de Sistemas e Processos",
    summary: "Configure tecnologia e automatize obrigações operacionais.",
    milestone: "ERP ajustado e fluxos automatizados em produção",
    focus: ["ERP", "Automação", "Treinamentos"],
    tasks: [
      {
        id: "implementacao-config-erp",
        title: "Configurar ERP para novos tributos",
        description: "Parametrize regras de cálculo, creditamento e relatórios fiscais.",
        category: "Operações",
        severity: "vermelho",
        owner: "Tecnologia",
        priority: "alta",
        phase: "Implementação",
        pillar: "Tecnologia & Automação",
        dueInDays: 35,
        status: "todo",
        references: [
          {
            label: "Checklist técnico CRT-3",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Homologação do ERP",
            status: "pendente",
          },
        ],
        tags: ["crt3", "implementacao", "erp"],
      },
      {
        id: "implementacao-automacao-xml",
        title: "Automatizar captura de XML de notas fiscais",
        description: "Habilite integrações para entradas e saídas com alertas de divergência.",
        category: "Operações",
        severity: "laranja",
        owner: "Tecnologia",
        priority: "media",
        phase: "Implementação",
        pillar: "Tecnologia & Automação",
        dueInDays: 40,
        status: "doing",
        references: [
          {
            label: "Manual técnico de integração",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Logs de integração validados",
            status: "pendente",
          },
        ],
        tags: ["crt3", "implementacao", "automacao"],
      },
      {
        id: "implementacao-treinamento-times",
        title: "Treinar times operacionais",
        description: "Realize workshops sobre novos fluxos de compras, faturamento e fiscal.",
        category: "Operações",
        severity: "verde",
        owner: "RH",
        priority: "baixa",
        phase: "Implementação",
        pillar: "People & Change",
        dueInDays: 45,
        status: "done",
        references: [
          {
            label: "Apresentação padrão de treinamento",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Lista de presença consolidada",
            status: "concluída",
          },
        ],
        tags: ["crt3", "implementacao", "treinamento"],
      },
    ],
  },
  {
    id: "fase-monitoramento",
    phase: "Monitoramento",
    title: "Monitoramento e Ajustes",
    summary: "Valide obrigações, acompanhe indicadores e reporte resultados.",
    milestone: "Primeiro ciclo de monitoramento concluído",
    focus: ["Obrigações", "Auditoria", "Reporting"],
    tasks: [
      {
        id: "monitoramento-obrigacoes-acessorias",
        title: "Atualizar controles de obrigações acessórias",
        description: "Revise SPED, EFD e demais declarações impactadas pelo novo regime.",
        category: "Compliance",
        severity: "vermelho",
        owner: "Compliance",
        priority: "alta",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 52,
        status: "todo",
        references: [
          {
            label: "Checklist obrigações pós-reforma",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Cronograma de entregas atualizado",
            status: "pendente",
          },
        ],
        tags: ["crt3", "monitoramento", "compliance"],
      },
      {
        id: "monitoramento-auditoria-piloto",
        title: "Executar auditoria piloto de conformidade",
        description: "Conduza auditoria interna para validar regras e apontar ajustes.",
        category: "Compliance",
        severity: "laranja",
        owner: "Auditoria Interna",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Governança & Estratégia",
        dueInDays: 60,
        status: "doing",
        references: [
          {
            label: "Roteiro de auditoria CRT-3",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Relatório de auditoria",
            status: "em revisão",
          },
        ],
        tags: ["crt3", "monitoramento", "auditoria"],
      },
      {
        id: "monitoramento-report-executivo",
        title: "Apresentar resultados para diretoria",
        description: "Compartilhe indicadores de avanço, riscos e próximos passos.",
        category: "Planejamento",
        severity: "verde",
        owner: "Consultoria",
        priority: "baixa",
        phase: "Monitoramento",
        pillar: "Governança & Estratégia",
        dueInDays: 65,
        status: "done",
        references: [
          {
            label: "Template de dashboard executivo",
            type: "template",
          },
        ],
        evidences: [
          {
            label: "Ata de reunião executiva",
            status: "concluída",
          },
        ],
        tags: ["crt3", "monitoramento", "report"],
      },
    ],
  },
];

function futureDateISO(referenceDate: Date, daysFromToday: number) {
  return format(addDays(referenceDate, daysFromToday), "yyyy-MM-dd");
}

function cloneReferences(references?: ChecklistTaskReference[]): ChecklistTaskReference[] {
  return references?.map((reference) => ({ ...reference })) ?? [];
}

function cloneEvidences(evidences?: ChecklistTaskEvidence[]): ChecklistTaskEvidence[] {
  return evidences?.map((evidence) => ({ ...evidence })) ?? [];
}

function cloneTags(tags?: string[]): string[] {
  return tags ? [...tags] : [];
}

function cloneNotes(notes?: ChecklistTaskNote[]): ChecklistTaskNote[] {
  return notes?.map((note) => ({ ...note })) ?? [];
}

function instantiateBlueprintTask(
  task: ChecklistBlueprintTask,
  options: { checklistId: string; referenceDate: Date; timestamp: string }
): ChecklistTask {
  const { checklistId, referenceDate, timestamp } = options;
  const dueDate = typeof task.dueInDays === "number" ? futureDateISO(referenceDate, task.dueInDays) : undefined;

  return {
    id: task.id,
    checklistId,
    title: task.title,
    description: task.description,
    severity: task.severity,
    status: task.status ?? "todo",
    owner: task.owner,
    category: task.category,
    dueDate,
    phase: task.phase,
    pillar: task.pillar,
    priority: task.priority,
    references: cloneReferences(task.references),
    evidences: cloneEvidences(task.evidences),
    notes: [],
    tags: cloneTags(task.tags),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const crt3Blueprint: ChecklistBlueprintPhase[] = CRT3_BLUEPRINT;

export function instantiateChecklistBlueprint({
  blueprint = crt3Blueprint,
  checklistId,
  referenceDate = new Date(),
  timestamp,
}: {
  blueprint?: ChecklistBlueprintPhase[];
  checklistId: string;
  referenceDate?: Date;
  timestamp?: string;
}): ChecklistTask[] {
  const baseTimestamp = timestamp ?? nowISO();
  return blueprint.flatMap((phase) =>
    phase.tasks.map((task) => instantiateBlueprintTask(task, { checklistId, referenceDate, timestamp: baseTimestamp }))
  );
}

export const defaultChecklistTasks: ChecklistTask[] = instantiateChecklistBlueprint({ checklistId: "checklist-essencial" });

export function createDefaultChecklistBoard(companyId: string): ChecklistBoard {
  const timestamp = nowISO();
  const checklistId = `${companyId}-checklist-essencial`;

  return {
    id: checklistId,
    companyId,
    name: "Blueprint CRT-3 Essencial",
    description: "Sequência guiada para adequação à Reforma Tributária.",
    createdAt: timestamp,
    updatedAt: timestamp,
    tasks: instantiateChecklistBlueprint({ checklistId, timestamp }),
  };
}

export function cloneChecklistTask(task: ChecklistTask, overrides: Partial<ChecklistTask> = {}): ChecklistTask {
  const timestamp = nowISO();
  return {
    ...task,
    ...overrides,
    references: cloneReferences(overrides.references ?? task.references),
    evidences: cloneEvidences(overrides.evidences ?? task.evidences),
    notes: cloneNotes(overrides.notes ?? task.notes),
    tags: cloneTags(overrides.tags ?? task.tags),
    updatedAt: overrides.updatedAt ?? timestamp,
  };
}

export function calculateChecklistProgressFromBoard(board: ChecklistBoard): number {
  if (!board.tasks.length) return 0;
  const done = board.tasks.filter((task) => task.status === "done").length;
  return Math.round((done / board.tasks.length) * 100);
}

export function calculateChecklistProgressFromBoards(boards: ChecklistBoard[]): number {
  if (!boards.length) return 0;
  const allTasks = boards.flatMap((board) => board.tasks);
  if (!allTasks.length) return 0;
  const done = allTasks.filter((task) => task.status === "done").length;
  return Math.round((done / allTasks.length) * 100);
}

export type ChecklistMetrics = {
  totalChecklists: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  upcomingThreeDays: number;
  criticalTasks: number;
  attentionTasks: number;
};

export function analyzeChecklistBoards(boards: ChecklistBoard[]): ChecklistMetrics {
  const today = new Date();
  const allTasks = boards.flatMap((board) => board.tasks);

  return allTasks.reduce<ChecklistMetrics>(
    (acc, task) => {
      const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
      const isDone = task.status === "done";
      const isOverdue = !!dueDate && !isDone && isBefore(dueDate, today);
      const daysToDue = dueDate ? differenceInCalendarDays(dueDate, today) : null;

      acc.totalTasks += 1;
      if (isDone) {
        acc.completedTasks += 1;
      } else {
        acc.inProgressTasks += 1;
      }

      if (isOverdue) {
        acc.overdueTasks += 1;
      } else if (!isDone && daysToDue !== null && daysToDue <= 3 && daysToDue >= 0) {
        acc.upcomingThreeDays += 1;
      }

      if (task.severity === "vermelho" && !isDone) {
        acc.criticalTasks += 1;
      }
      if (task.severity === "laranja" && !isDone) {
        acc.attentionTasks += 1;
      }

      return acc;
    },
    {
      totalChecklists: boards.length,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      upcomingThreeDays: 0,
      criticalTasks: 0,
      attentionTasks: 0,
    }
  );
}

export function scoreBySeverity(task: ChecklistTask): number {
  const severityScore = severityWeight[task.severity] ?? 0;
  const priorityScore = task.priority ? priorityWeight[task.priority] ?? priorityWeight.media : priorityWeight.media;
  const base = severityScore + priorityScore;

  if (task.status === "done") return base / 2;
  if (!task.dueDate) return base;
  const due = parseISO(task.dueDate);
  const today = new Date();
  if (isBefore(due, today)) return base + 2;
  const days = differenceInCalendarDays(due, today);
  if (days <= 3) return base + 1;
  return base;
}

export function sortTasksByPriority(tasks: ChecklistTask[]): ChecklistTask[] {
  return [...tasks].sort((a, b) => {
    const severityDiff = scoreBySeverity(b) - scoreBySeverity(a);
    if (severityDiff !== 0) return severityDiff;
    if (a.dueDate && b.dueDate) {
      return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function formatDueDateLabel(dueDate?: string) {
  if (!dueDate) return "Sem prazo";
  const date = parseISO(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return format(date, "dd/MM");
}

export function groupTasksByStatus(tasks: ChecklistTask[]): Record<ChecklistTaskStatus, ChecklistTask[]> {
  return tasks.reduce<Record<ChecklistTaskStatus, ChecklistTask[]>>(
    (acc, task) => {
      acc[task.status] = [...(acc[task.status] ?? []), task];
      return acc;
    },
    { todo: [], doing: [], done: [] }
  );
}

export type CalendarEntry = {
  day: string;
  date: string;
  tasks: ChecklistTask[];
};

export function buildMonthlyCalendar(tasks: ChecklistTask[], baseDate = new Date()): CalendarEntry[] {
  const start = startOfMonth(baseDate);
  const end = endOfMonth(baseDate);
  const entries: CalendarEntry[] = [];
  let cursor = start;

  while (!isAfter(cursor, end)) {
    const iso = cursor.toISOString();
    entries.push({
      day: format(cursor, "dd"),
      date: iso,
      tasks: tasks.filter((task) => task.dueDate && isSameDayISO(task.dueDate, iso)),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  return entries;
}

function isSameDayISO(dateA: string, dateB: string) {
  const a = parseISO(dateA);
  const b = parseISO(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function resolveNotificationSeverity(task: ChecklistTask): NotificationSeverity {
  if (task.status === "done") return "verde";
  if (task.dueDate) {
    const due = parseISO(task.dueDate);
    const today = new Date();
    if (isBefore(due, today)) return "vermelho";
    const days = differenceInCalendarDays(due, today);
    if (days <= 3) return "laranja";
  }
  return task.severity;
}

export function buildChecklistNotifications(
  boards: ChecklistBoard[],
  previous: ChecklistNotification[] = []
): ChecklistNotification[] {
  const readMap = new Map(previous.map((notification) => [notification.id, notification.read]));

  return boards.flatMap((board) =>
    board.tasks
      .filter((task) => task.status !== "done")
      .map<ChecklistNotification>((task) => {
        const severity = resolveNotificationSeverity(task);
        const dueLabel = task.dueDate ? formatDueDateLabel(task.dueDate) : null;
        const message = task.dueDate
          ? severity === "vermelho"
            ? `Atrasado desde ${dueLabel}.`
            : `Vence em ${dueLabel}.`
          : "Sem prazo definido.";

        const id = `${board.id}-${task.id}`;

        return {
          id,
          checklistId: board.id,
          taskId: task.id,
          severity,
          title: task.title,
          message,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          read: readMap.get(id) ?? false,
          phase: task.phase,
          priority: task.priority,
          pillar: task.pillar,
        };
      })
  );
}

export function mergeNotifications(
  current: ChecklistNotification[],
  updated: ChecklistNotification[]
): ChecklistNotification[] {
  const readMap = new Map(current.map((notification) => [notification.id, notification.read]));
  return updated.map((notification) => ({
    ...notification,
    read: readMap.get(notification.id) ?? notification.read,
  }));
}

export function updateTaskStatus(task: ChecklistTask, status: ChecklistTaskStatus): ChecklistTask {
  return {
    ...task,
    status,
    updatedAt: nowISO(),
  };
}

export function upsertTask(tasks: ChecklistTask[], next: ChecklistTask): ChecklistTask[] {
  const existingIndex = tasks.findIndex((task) => task.id === next.id);
  if (existingIndex >= 0) {
    const copy = [...tasks];
    copy[existingIndex] = next;
    return copy;
  }
  return [...tasks, next];
}
