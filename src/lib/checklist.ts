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

const REFORMA_2026_BLUEPRINT: ChecklistBlueprintPhase[] = [
  {
    id: "fase-fundamentos-reforma-2026",
    phase: "Fundamentos",
    title: "Conhecimento, Governança e Adequação Legal",
    summary:
      "Garante aderência aos princípios do novo STN (simplicidade, transparência, justiça e cooperação) e define governança para o IBS/CBS.",
    milestone: "CRT 3 confirmado, regimes especiais mapeados e cadastros oficiais habilitados",
    focus: ["CRT 3", "Regimes especiais", "Cadastros oficiais"],
    tasks: [
      {
        id: "fundamentos-regime-tributario",
        title: "Confirmação do regime tributário",
        description:
          "Verificar o CRT: confirmar se a empresa está no Regime Regular (CRT 3), com obrigação de informar IBS/CBS na NF-e a partir de 05/01/2026. Registrar o resultado e comunicar áreas afetadas. Observação: contribuintes do Simples Nacional (CRT 1, 2 ou 4) só informam IBS/CBS em 2027.",
        category: "Planejamento",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "alta",
        phase: "Fundamentos",
        pillar: "Governança & Estratégia",
        dueInDays: 5,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 46 e 47",
            type: "legislação",
          },
          {
            label: "EC 132/23 - Disposições transitórias",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Relatório de enquadramento CRT",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase1", "governanca"],
      },
      {
        id: "fundamentos-regimes-especiais",
        title: "Identificação de regimes especiais",
        description:
          "Definir a tributação: identificar produtos, serviços ou filiais enquadrados em regimes específicos ou diferenciados (reduções de 30% ou 60%, regime financeiro, imóveis, entre outros) previstos na LC 214/25.",
        category: "Compliance",
        severity: "vermelho",
        owner: "Consultoria Tributária",
        priority: "alta",
        phase: "Fundamentos",
        pillar: "Processos & Obrigações",
        dueInDays: 8,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Arts. 82 a 89",
            type: "legislação",
          },
          {
            label: "EC 132/23 - Regimes específicos",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Matriz de regimes especiais",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase1", "regimes"],
      },
      {
        id: "fundamentos-cadastro-unico",
        title: "Cadastro único (CPF/CNPJ)",
        description:
          "Garantir o registro obrigatório: confirmar que todas as pessoas físicas, jurídicas e entidades sujeitas ao IBS/CBS constam no cadastro com identificação única (CPF/CNPJ) administrado pela RFB, saneando eventuais inconsistências (Art. 59).",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Fundamentos",
        pillar: "Dados & Cadastros",
        dueInDays: 12,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 59",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Protocolo de atualização cadastral",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase1", "cadastro"],
      },
      {
        id: "fundamentos-dte-unificado",
        title: "Habilitação ao Domicílio Tributário Eletrônico",
        description:
          "Efetuar a habilitação no Domicílio Tributário Eletrônico (DTE) unificado, designar responsáveis e estabelecer rotina de monitoramento diário das comunicações oficiais.",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Fundamentos",
        pillar: "Processos & Obrigações",
        dueInDays: 14,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 61",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Comprovante de habilitação no DTE",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase1", "dte"],
      },
      {
        id: "fundamentos-codigos-oficiais",
        title: "Consulta de códigos oficiais IBS/CBS",
        description:
          "Obter e integrar ao ERP as tabelas oficiais publicadas no Portal Nacional da NF-e (cClassTrib e cCredPres), garantindo versionamento, rastreabilidade e atualização contínua.",
        category: "Operações",
        severity: "laranja",
        owner: "Tecnologia",
        priority: "media",
        phase: "Fundamentos",
        pillar: "Dados & Cadastros",
        dueInDays: 16,
        status: "todo",
        references: [
          {
            label: "Portal Nacional da NF-e - Tabelas IBS/CBS",
            type: "guia",
          },
          {
            label: "LC 214/25 - Art. 83",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Relatório de importação das tabelas",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase1", "dados"],
      },
    ],
  },
  {
    id: "fase-implementacao-reforma-2026",
    phase: "Implementação",
    title: "Adaptação de Sistemas e Tecnologia",
    summary:
      "Assegura a adequação dos DF-e, das integrações oficiais e do split payment para operar IBS, CBS e Imposto Seletivo.",
    milestone: "Leiaute NF-e homologado, plataformas unificadas conectadas e split payment testado",
    focus: ["NF-e", "Split payment", "Integrações oficiais"],
    tasks: [
      {
        id: "implementacao-leiaute-nfe",
        title: "Implementação do novo leiaute da NF-e",
        description:
          "Adaptar sistemas e aplicativos de DF-e para o leiaute padronizado que suporta IBS, CBS e Imposto Seletivo, obrigatório para empresas do CRT 3 a partir de 05/01/2026.",
        category: "Operações",
        severity: "vermelho",
        owner: "TI Fiscal",
        priority: "alta",
        phase: "Implementação",
        pillar: "Tecnologia & Automação",
        dueInDays: 20,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Leiaute NF-e",
            type: "material",
          },
          {
            label: "LC 214/25 - Art. 94",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Homologação do novo leiaute",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase2", "nfe"],
      },
      {
        id: "implementacao-split-payment",
        title: "Preparação para o split payment",
        description:
          "Preparar sistemas e conciliações financeiras, com PSPs e adquirentes, para segregar IBS e CBS no momento da liquidação financeira, sobretudo em operações com não contribuintes.",
        category: "Operações",
        severity: "laranja",
        owner: "Equipe Financeira",
        priority: "alta",
        phase: "Implementação",
        pillar: "Processos & Obrigações",
        dueInDays: 24,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 92",
            type: "legislação",
          },
          {
            label: "NT 2025.002-RTC - Orientações de split payment",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Plano de testes com PSP",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase2", "split"],
      },
      {
        id: "implementacao-plataformas-unificadas",
        title: "Integração com plataformas unificadas",
        description:
          "Preparar autenticação, perfis de acesso e APIs para a plataforma eletrônica compartilhada entre Comitê Gestor do IBS e RFB, garantindo também o canal de suporte ao contribuinte.",
        category: "Operações",
        severity: "laranja",
        owner: "Tecnologia",
        priority: "media",
        phase: "Implementação",
        pillar: "Tecnologia & Automação",
        dueInDays: 26,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 95",
            type: "legislação",
          },
        ],
        evidences: [
          {
            label: "Checklist de integração aprovado",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase2", "plataforma"],
      },
      {
        id: "implementacao-nfe-finalidades",
        title: "Implementação das novas finalidades da NF-e",
        description:
          "Adequar o ERP para incluir as novas finalidades da NF-e (5 = Nota de Crédito, 6 = Nota de Débito) destinadas a ajustes de IBS/CBS, lembrando que não se aplicam a ajustes de ICMS/IPI.",
        category: "Operações",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Implementação",
        pillar: "Processos & Obrigações",
        dueInDays: 28,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Finalidades NF-e",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Testes de emissão de notas 5 e 6",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase2", "nfe"],
      },
      {
        id: "implementacao-apuracao-assistida",
        title: "Desenvolvimento da apuração assistida",
        description:
          "Definir responsáveis e fluxos de validação para confirmar a apuração assistida do IBS/CBS baseada em DF-e e eventos de extinção. Destacar que a confirmação implica confissão de dívida e constituição do crédito tributário.",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Implementação",
        pillar: "Governança & Estratégia",
        dueInDays: 32,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 98",
            type: "legislação",
          },
          {
            label: "NT 2025.002-RTC - Apuração assistida",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Procedimento interno de validação",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase2", "apuracao"],
      },
    ],
  },
  {
    id: "fase-monitoramento-reforma-2026",
    phase: "Monitoramento",
    title: "Emissão e Obrigações Acessórias",
    summary:
      "Consolida o cumprimento das obrigações acessórias (NF-e e eventos), condição essencial para a dispensa do recolhimento em 2026.",
    milestone: "Grupo UB completo, eventos eletrônicos ativos e créditos controlados",
    focus: ["Grupo UB", "Eventos eletrônicos", "Gestão de créditos"],
    tasks: [
      {
        id: "monitoramento-grupo-ub",
        title: "Preenchimento detalhado por item (Grupo UB)",
        description:
          "Configurar CST e cClassTrib para cada item no Grupo UB da NF-e, validando notas piloto e assegurando vínculo com a legislação do IBS/CBS.",
        category: "Operações",
        severity: "vermelho",
        owner: "Equipe Fiscal",
        priority: "alta",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 35,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Grupo UB",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Relatório de notas validadas",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "ub"],
      },
      {
        id: "monitoramento-aliquotas-teste",
        title: "Cálculo de alíquotas e base (2026)",
        description:
          "Aplicar as alíquotas de teste de 2026 (pCBS 0,9%, pIBSUF 0,1%, pIBSMun 0%) validando a base de cálculo (vBC) e a totalização por operação.",
        category: "Operações",
        severity: "laranja",
        owner: "Equipe Financeira",
        priority: "alta",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 37,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Alíquotas de teste",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Planilha de validação de alíquotas",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "aliquotas"],
      },
      {
        id: "monitoramento-beneficios",
        title: "Gestão de benefícios (reduções e diferimentos)",
        description:
          "Implementar regras para preenchimento dos grupos gRed, gDif, gDevTrib e gIBSCredPres quando aplicável, documentando todas as justificativas legais.",
        category: "Compliance",
        severity: "laranja",
        owner: "Consultoria Tributária",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 39,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Arts. 82 a 89",
            type: "legislação",
          },
          {
            label: "NT 2025.002-RTC - Benefícios fiscais",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Checklist de benefícios configurados",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "beneficios"],
      },
      {
        id: "monitoramento-evento-imobilizado",
        title: "Registro de imobilização de itens (evento 211130)",
        description:
          "Definir gatilhos para que o destinatário registre o evento 211130 ao integrar bens ao ativo imobilizado e acompanhar os prazos de ressarcimento de créditos (Art. 40, I).",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 42,
        status: "todo",
        references: [
          {
            label: "LC 214/25 - Art. 40, I",
            type: "legislação",
          },
          {
            label: "NT 2025.002-RTC - Evento 211130",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Procedimento do evento 211130",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "eventos"],
      },
      {
        id: "monitoramento-evento-consumo",
        title: "Registro de consumo pessoal (evento 211120)",
        description:
          "Garantir que aquisições destinadas a uso ou consumo emitam o evento 211120, bloqueando créditos indevidos de IBS/CBS.",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 43,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Evento 211120",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Registro das operações classificadas",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "eventos"],
      },
      {
        id: "monitoramento-evento-pagamento",
        title: "Informação de pagamento integral (evento 112110)",
        description:
          "Estabelecer rotina para o emitente informar o pagamento integral das operações via evento 112110, liberando créditos presumidos aos adquirentes.",
        category: "Operações",
        severity: "laranja",
        owner: "Equipe Financeira",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 44,
        status: "todo",
        references: [
          {
            label: "NT 2025.002-RTC - Evento 112110",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Relatório de eventos 112110 emitidos",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "eventos"],
      },
      {
        id: "monitoramento-credito-presumido",
        title: "Uso de crédito presumido (evento 211110)",
        description:
          "Orientar destinatários internos sobre a solicitação de crédito presumido via evento 211110, validando o uso correto dos códigos cCredPres.",
        category: "Compliance",
        severity: "laranja",
        owner: "Equipe Fiscal",
        priority: "media",
        phase: "Monitoramento",
        pillar: "Processos & Obrigações",
        dueInDays: 45,
        status: "todo",
        references: [
          {
            label: "Portal Nacional da NF-e - Código de Crédito Presumido",
            type: "guia",
          },
          {
            label: "NT 2025.002-RTC - Evento 211110",
            type: "material",
          },
        ],
        evidences: [
          {
            label: "Checklist de créditos presumidos aprovados",
            status: "pendente",
          },
        ],
        tags: ["reforma-2026", "fase3", "creditos"],
      },
    ],
  },
];

const blueprintTaskIndex = new Map<string, ChecklistBlueprintTask>();

function indexBlueprintTasks(blueprint: ChecklistBlueprintPhase[]) {
  blueprint.forEach((phase) => {
    phase.tasks.forEach((task) => {
      blueprintTaskIndex.set(task.id, task);
    });
  });
}

indexBlueprintTasks(REFORMA_2026_BLUEPRINT);

export function getChecklistBlueprintTask(taskId: string): ChecklistBlueprintTask | undefined {
  return blueprintTaskIndex.get(taskId);
}

export function inferBlueprintDueDate(taskId: string, referenceDate: Date): string | undefined {
  if (Number.isNaN(referenceDate.getTime())) {
    return undefined;
  }

  const blueprintTask = getChecklistBlueprintTask(taskId);
  if (!blueprintTask || typeof blueprintTask.dueInDays !== "number") {
    return undefined;
  }

  return futureDateISO(referenceDate, blueprintTask.dueInDays);
}

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

export const reforma2026Blueprint: ChecklistBlueprintPhase[] = REFORMA_2026_BLUEPRINT;
export const crt3Blueprint: ChecklistBlueprintPhase[] = REFORMA_2026_BLUEPRINT;

export function instantiateChecklistBlueprint({
  blueprint = reforma2026Blueprint,
  checklistId,
  referenceDate = new Date(),
  timestamp,
}: {
  blueprint?: ChecklistBlueprintPhase[];
  checklistId: string;
  referenceDate?: Date;
  timestamp?: string;
}): ChecklistTask[] {
  indexBlueprintTasks(blueprint);
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
    name: "Checklist Reforma Tributária 2026",
    description: "Sequência guiada para adaptação do CRT 3 ao IBS/CBS com obrigatoriedades de 2026.",
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
