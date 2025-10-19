"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { parseISO } from "date-fns";

import {
  buildChecklistNotifications,
  calculateChecklistProgressFromBoards,
  checklistStatuses,
  createDefaultChecklistBoard,
  inferBlueprintDueDate,
  instantiateChecklistBlueprint,
} from "@/lib/checklist";
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
  Company,
  NotificationSeverity,
  SessionState,
  User,
  UserRole,
} from "@/types/platform";

type PublicUser = Omit<User, "password">;

type CompanyProfileUpdate = Partial<
  Pick<Company, "name" | "regime" | "sector" | "origin" | "maturity" | "riskLevel" | "checklistProgress">
> & {
  metadata?: Record<string, unknown>;
};

type ChecklistBoardPayload = {
  name: string;
  description?: string;
  template?: "essencial" | "blank";
};

type ChecklistBoardUpdate = Partial<Pick<ChecklistBoard, "name" | "description">>;

type ChecklistTaskInput = {
  title: string;
  description?: string;
  severity: NotificationSeverity;
  owner: string;
  category: ChecklistTask["category"];
  dueDate?: string;
  status?: ChecklistTaskStatus;
  phase?: ChecklistTask["phase"];
  pillar?: ChecklistTask["pillar"];
  priority?: ChecklistTask["priority"];
  references?: ChecklistTask["references"];
  evidences?: ChecklistTask["evidences"];
  notes?: ChecklistTask["notes"];
  tags?: ChecklistTask["tags"];
};

type ChecklistTaskUpdate = Partial<ChecklistTaskInput>;

interface AuthContextValue {
  user: User | null;
  companies: Company[];
  loading: boolean;
  login: (params: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  registerCompany: (params: {
    name: string;
    email: string;
    password: string;
    regime: string;
    sector: string;
    cnpj?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  registerCollaborator: (params: {
    name: string;
    email: string;
    password: string;
    companyId: string;
  }) => Promise<{ success: boolean; message?: string }>;
  registerAccountant: (params: {
    name: string;
    email: string;
    password: string;
    companyIds?: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  attachCompanyToAccountant: (params: { accountantId: string; companyId: string }) => void;
  getAccessibleCompanies: (userId: string) => Company[];
  updateCompanyProfile: (companyId: string, updates: CompanyProfileUpdate) => void;
  allUsers: PublicUser[];
  getUserById: (userId: string) => PublicUser | null;
  createChecklistBoard: (companyId: string, payload: ChecklistBoardPayload) => void;
  updateChecklistBoard: (companyId: string, boardId: string, updates: ChecklistBoardUpdate) => void;
  removeChecklistBoard: (companyId: string, boardId: string) => void;
  createChecklistTask: (companyId: string, boardId: string, payload: ChecklistTaskInput) => void;
  updateChecklistTask: (
    companyId: string,
    boardId: string,
    taskId: string,
    updates: ChecklistTaskUpdate
  ) => void;
  deleteChecklistTask: (companyId: string, boardId: string, taskId: string) => void;
  updateChecklistTaskStatus: (
    companyId: string,
    boardId: string,
    taskId: string,
    status: ChecklistTaskStatus
  ) => void;
  markNotificationRead: (companyId: string, notificationId: string, read?: boolean) => void;
  markAllNotificationsRead: (companyId: string) => void;
}

interface StoredState {
  users: User[];
  companies: Company[];
  session: SessionState | null;
}

type LegacyChecklistItem = {
  id: string;
  title: string;
  description?: string;
  severity?: NotificationSeverity;
  category?: ChecklistTask["category"];
  owner?: string;
  dueDate?: string;
};

type LegacyChecklist = {
  items?: LegacyChecklistItem[];
  completedItems?: string[];
  lastUpdated?: string;
};

type LegacyCompany = Partial<Company> & {
  checklist?: LegacyChecklist;
  checklists?: Partial<ChecklistBoard>[];
  notifications?: ChecklistNotification[];
};

const STORAGE_KEY = "rtc-auth-state-v1";
const VALID_SEVERITIES: NotificationSeverity[] = ["verde", "laranja", "vermelho"];
const VALID_CATEGORIES: ChecklistTask["category"][] = ["Planejamento", "Operações", "Compliance"];
const VALID_PRIORITIES: ChecklistPriority[] = ["alta", "media", "baixa"];
const VALID_PHASES: ChecklistPhase[] = ["Fundamentos", "Planejamento", "Implementação", "Monitoramento"];
const VALID_PILLARS: ChecklistPillar[] = [
  "Governança & Estratégia",
  "Dados & Cadastros",
  "Processos & Obrigações",
  "Tecnologia & Automação",
  "People & Change",
];
const VALID_REFERENCE_TYPES: ChecklistTaskReference["type"][] = ["legislação", "guia", "material", "template"];
const VALID_EVIDENCE_STATUS: NonNullable<ChecklistTaskEvidence["status"]>[] = [
  "pendente",
  "em revisão",
  "concluída",
];

function nowISO() {
  return new Date().toISOString();
}

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeStatus(value: unknown): ChecklistTaskStatus {
  return checklistStatuses.includes(value as ChecklistTaskStatus) ? (value as ChecklistTaskStatus) : "todo";
}

function sanitizeSeverity(value: unknown): NotificationSeverity {
  return VALID_SEVERITIES.includes(value as NotificationSeverity)
    ? (value as NotificationSeverity)
    : "laranja";
}

function sanitizeCategory(value: unknown): ChecklistTask["category"] {
  return VALID_CATEGORIES.includes(value as ChecklistTask["category"])
    ? (value as ChecklistTask["category"])
    : "Planejamento";
}

function sanitizePriority(value: unknown): ChecklistPriority {
  return VALID_PRIORITIES.includes(value as ChecklistPriority) ? (value as ChecklistPriority) : "media";
}

function sanitizePhase(value: unknown): ChecklistPhase | undefined {
  return VALID_PHASES.includes(value as ChecklistPhase) ? (value as ChecklistPhase) : undefined;
}

function sanitizePillar(value: unknown): ChecklistPillar | undefined {
  return VALID_PILLARS.includes(value as ChecklistPillar) ? (value as ChecklistPillar) : undefined;
}

function sanitizeReferences(value: unknown): ChecklistTaskReference[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;
      const label = "label" in candidate && typeof candidate.label === "string" ? candidate.label.trim() : "";
      if (!label) return null;

      const reference: ChecklistTaskReference = {
        label,
      };

      if ("description" in candidate && typeof candidate.description === "string") {
        const description = candidate.description.trim();
        if (description) reference.description = description;
      }

      if ("url" in candidate && typeof candidate.url === "string") {
        const url = candidate.url.trim();
        if (url) reference.url = url;
      }

      if ("type" in candidate && typeof candidate.type === "string") {
        const type = candidate.type.trim() as ChecklistTaskReference["type"];
        if (VALID_REFERENCE_TYPES.includes(type)) {
          reference.type = type;
        }
      }

      return reference;
    })
    .filter((reference): reference is ChecklistTaskReference => Boolean(reference));
}

function sanitizeEvidences(value: unknown): ChecklistTaskEvidence[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;
      const label = "label" in candidate && typeof candidate.label === "string" ? candidate.label.trim() : "";
      if (!label) return null;

      const evidence: ChecklistTaskEvidence = {
        label,
      };

      if ("description" in candidate && typeof candidate.description === "string") {
        const description = candidate.description.trim();
        if (description) evidence.description = description;
      }

      if ("url" in candidate && typeof candidate.url === "string") {
        const url = candidate.url.trim();
        if (url) evidence.url = url;
      }

      if ("status" in candidate && typeof candidate.status === "string") {
        const status = candidate.status.trim() as ChecklistTaskEvidence["status"];
        if (VALID_EVIDENCE_STATUS.includes(status as NonNullable<ChecklistTaskEvidence["status"]>)) {
          evidence.status = status;
        }
      }

      return evidence;
    })
    .filter((evidence): evidence is ChecklistTaskEvidence => Boolean(evidence));
}

function sanitizeNotes(value: unknown): ChecklistTaskNote[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((candidate) => {
      if (!candidate || typeof candidate !== "object") return null;

      const content = "content" in candidate && typeof candidate.content === "string" ? candidate.content.trim() : "";
      if (!content) return null;

      const author =
        "author" in candidate && typeof candidate.author === "string" && candidate.author.trim()
          ? candidate.author.trim()
          : "Equipe";

      const createdAt =
        "createdAt" in candidate && typeof candidate.createdAt === "string" && candidate.createdAt.trim()
          ? candidate.createdAt
          : nowISO();

      const id =
        "id" in candidate && typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id
          : generateId("note");

      const note: ChecklistTaskNote = {
        id,
        author,
        content,
        createdAt,
      };

      return note;
    })
    .filter((note): note is ChecklistTaskNote => Boolean(note));
}

function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .filter((tag): tag is string => Boolean(tag));
}

function sanitizeTask(
  task: Partial<ChecklistTask>,
  boardId: string,
  fallbackTimestamp: string
): ChecklistTask {
  const createdAt = task.createdAt ?? fallbackTimestamp;
  const updatedAt = task.updatedAt ?? createdAt;
  const rawDueDate = typeof task.dueDate === "string" ? task.dueDate.trim() : task.dueDate;
  const hasManualUpdates = Boolean(task.updatedAt) && task.updatedAt !== task.createdAt;

  let dueDate = rawDueDate && rawDueDate.length ? rawDueDate : undefined;

  if (!dueDate && task.id) {
    const referenceDate = parseISO(createdAt);
    const inferred = inferBlueprintDueDate(task.id, referenceDate);
    if (inferred && !hasManualUpdates) {
      dueDate = inferred;
    }
  }

  return {
    id: task.id ?? generateId("task"),
    checklistId: boardId,
    title: task.title ?? "Tarefa sem título",
    description: task.description ?? "",
    severity: sanitizeSeverity(task.severity),
    status: sanitizeStatus(task.status),
    owner: task.owner ?? "Equipe",
    category: sanitizeCategory(task.category),
  dueDate,
    phase: sanitizePhase(task.phase),
    pillar: sanitizePillar(task.pillar),
    priority: sanitizePriority(task.priority),
    references: sanitizeReferences(task.references),
    evidences: sanitizeEvidences(task.evidences),
    notes: sanitizeNotes(task.notes),
    tags: sanitizeTags(task.tags),
    createdAt,
    updatedAt,
  };
}

function sanitizeBoard(board: Partial<ChecklistBoard>, companyId: string): ChecklistBoard {
  const reference = board.createdAt ?? nowISO();
  const boardId = board.id ?? generateId("checklist");
  const createdAt = board.createdAt ?? reference;
  const updatedAt = board.updatedAt ?? createdAt;

  const tasks = Array.isArray(board.tasks)
    ? board.tasks.map((task) => sanitizeTask(task, boardId, createdAt))
    : [];

  return {
    id: boardId,
    companyId: board.companyId ?? companyId,
    name: board.name ?? "Checklist",
    description: board.description,
    createdAt,
    updatedAt,
    tasks,
  };
}

function convertLegacyChecklist(companyId: string, legacy: LegacyChecklist): ChecklistBoard {
  const timestamp = legacy.lastUpdated ?? nowISO();
  const boardId = `${companyId}-checklist-essencial`;
  const completed = new Set(legacy.completedItems ?? []);

  const tasks = (legacy.items ?? []).map((item) => ({
    id: item.id ?? generateId("task"),
    checklistId: boardId,
    title: item.title ?? "Item sem título",
    description: item.description ?? "",
    severity: sanitizeSeverity(item.severity),
    status: sanitizeStatus(completed.has(item.id ?? "") ? "done" : "todo"),
    owner: item.owner ?? "Equipe",
    category: sanitizeCategory(item.category),
    dueDate: item.dueDate,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  return {
    id: boardId,
    companyId,
    name: "Checklist Essencial",
    description: "Plano base migrado da versão anterior",
    createdAt: timestamp,
    updatedAt: timestamp,
    tasks,
  };
}

function extractBoards(companyId: string, company: LegacyCompany): ChecklistBoard[] {
  if (Array.isArray(company.checklists) && company.checklists.length) {
    return company.checklists.map((board) => sanitizeBoard(board, companyId));
  }

  if (company.checklist) {
    const migrated = convertLegacyChecklist(companyId, company.checklist);
    return migrated.tasks.length ? [migrated] : [createDefaultChecklistBoard(companyId)];
  }

  return [createDefaultChecklistBoard(companyId)];
}

function normalizeCompanies(companies: LegacyCompany[]): Company[] {
  return companies.map((raw) => {
    const companyId = raw.id ?? generateId("company");
    const boards = extractBoards(companyId, raw);
    const notifications = buildChecklistNotifications(boards, raw.notifications);

    return {
      id: companyId,
      name: raw.name ?? "Empresa sem nome",
      cnpj: raw.cnpj,
      regime: raw.regime ?? "Simples Nacional",
      sector: raw.sector ?? "Indefinido",
      origin: raw.origin,
      ownerId: raw.ownerId ?? companyId,
      maturity: raw.maturity ?? "Inicial",
      riskLevel: raw.riskLevel ?? "laranja",
      checklistProgress: calculateChecklistProgressFromBoards(boards),
      employees: Array.isArray(raw.employees) ? raw.employees : [],
      accountantIds: raw.accountantIds ?? [],
      metadata: raw.metadata ?? {},
      checklists: boards,
      notifications,
    };
  });
}

function recalculateCompany(
  company: Company,
  nextBoards: ChecklistBoard[],
  previousNotifications?: ChecklistNotification[]
): Company {
  const notifications = buildChecklistNotifications(nextBoards, previousNotifications ?? company.notifications);
  return {
    ...company,
    checklists: nextBoards,
    notifications,
    checklistProgress: calculateChecklistProgressFromBoards(nextBoards),
  };
}

const demoBoard = createDefaultChecklistBoard("empresa-demo");
const demoCompany: Company = {
  id: "empresa-demo",
  name: "Mercado Luz",
  ownerId: "empresa-demo",
  regime: "Simples Nacional",
  sector: "Varejo Alimentício",
  cnpj: "12.345.678/0001-99",
  origin: "Indicação",
  maturity: "Em adaptação",
  riskLevel: "laranja",
  checklistProgress: calculateChecklistProgressFromBoards([demoBoard]),
  employees: ["colaborador-demo"],
  accountantIds: [],
  metadata: {
    revenueRange: "3-10mi",
    employeeSize: "21-50",
    mainGoal: "Rever precificação com a CBS",
    mainChallenge: "Centralizar obrigações acessórias em um só lugar",
  },
  checklists: [demoBoard],
  notifications: buildChecklistNotifications([demoBoard]),
};

const INITIAL_STATE: StoredState = {
  users: [
    {
      id: "empresa-demo",
      name: "Mercado Luz",
      email: "empresa@rtc.com",
      password: "demo123",
      role: "empresa",
    },
    {
      id: "colaborador-demo",
      name: "Ana Ribeiro",
      email: "colaborador@rtc.com",
      password: "demo123",
      role: "colaborador",
      companyId: "empresa-demo",
    },
    {
      id: "contador-demo",
      name: "Clínica Contábil",
      email: "contador@rtc.com",
      password: "demo123",
      role: "contador",
    },
  ],
  companies: [demoCompany],
  session: null,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStorage(): StoredState {
  if (typeof window === "undefined") {
    return INITIAL_STATE;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
      return INITIAL_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<StoredState> & { companies?: LegacyCompany[] };

    return {
      users: parsed.users && parsed.users.length ? parsed.users : INITIAL_STATE.users,
      companies:
        parsed.companies && parsed.companies.length
          ? normalizeCompanies(parsed.companies)
          : INITIAL_STATE.companies,
      session: parsed.session ?? null,
    };
  } catch (error) {
    console.error("Erro ao ler storage do AuthContext", error);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    return INITIAL_STATE;
  }
}

function saveStorage(state: StoredState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_STATE.users);
  const [companies, setCompanies] = useState<Company[]>(INITIAL_STATE.companies);
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStorage();
    setUsers(stored.users);
    setCompanies(stored.companies);
    setSession(stored.session);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    saveStorage({ users, companies, session });
  }, [users, companies, session, loading]);

  const currentUser = useMemo(() => {
    if (!session) return null;
    return users.find((user) => user.id === session.userId) ?? null;
  }, [session, users]);

  const publicUsers = useMemo<PublicUser[]>(
    () =>
      users.map(({ id, name, email, role }) => ({
        id,
        name,
        email,
        role,
      })),
    [users]
  );

  const getAccessibleCompanies = (userId: string): Company[] => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return [];

    switch (targetUser.role) {
      case "empresa":
        return companies.filter((company) => company.id === targetUser.id);
      case "colaborador":
        return companies.filter((company) => company.employees.includes(userId));
      case "contador":
        return companies.filter((company) => company.accountantIds?.includes(userId));
      default:
        return [];
    }
  };

  const login: AuthContextValue["login"] = async ({ email, password }) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      return { success: false, message: "Credenciais inválidas" };
    }
    setSession({ userId: user.id });
    return { success: true };
  };

  const logout = () => {
    setSession(null);
  };

  const isEmailInUse = (email: string) =>
    users.some((u) => u.email.toLowerCase() === email.toLowerCase());

  const registerCompany: AuthContextValue["registerCompany"] = async ({
    name,
    email,
    password,
    regime,
    sector,
    cnpj,
  }) => {
    if (isEmailInUse(email)) {
      return { success: false, message: "E-mail já cadastrado" };
    }

    const id = generateId("empresa");
    const board = createDefaultChecklistBoard(id);

    const user: User = {
      id,
      name,
      email,
      password,
      role: "empresa",
    };

    const company: Company = {
      id,
      ownerId: id,
      name,
      regime,
      sector,
      cnpj,
      origin: undefined,
      maturity: "Inicial",
      riskLevel: "verde",
      checklistProgress: calculateChecklistProgressFromBoards([board]),
      employees: [],
      accountantIds: [],
      metadata: {},
      checklists: [board],
      notifications: buildChecklistNotifications([board]),
    };

    setUsers((prev) => [...prev, user]);
    setCompanies((prev) => [...prev, company]);
    setSession({ userId: id });
    return { success: true };
  };

  const registerCollaborator: AuthContextValue["registerCollaborator"] = async ({
    name,
    email,
    password,
    companyId,
  }) => {
    if (isEmailInUse(email)) {
      return { success: false, message: "E-mail já cadastrado" };
    }

    const company = companies.find((c) => c.id === companyId);
    if (!company) {
      return { success: false, message: "Empresa não encontrada" };
    }

    const id = generateId("colaborador");
    const collaborator: User = {
      id,
      name,
      email,
      password,
      role: "colaborador",
      companyId,
    };

    setUsers((prev) => [...prev, collaborator]);
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, employees: [...new Set([...c.employees, id])] } : c))
    );
    setSession({ userId: id });
    return { success: true };
  };

  const registerAccountant: AuthContextValue["registerAccountant"] = async ({
    name,
    email,
    password,
    companyIds = [],
  }) => {
    const normalizedEmail = email.toLowerCase();
    const existingUser = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);

    if (existingUser) {
      if (existingUser.role !== "contador") {
        return { success: false, message: "E-mail já cadastrado para outro perfil" };
      }

      if (companyIds.length) {
        setCompanies((prev) =>
          prev.map((company) =>
            companyIds.includes(company.id)
              ? {
                  ...company,
                  accountantIds: [...new Set([...(company.accountantIds ?? []), existingUser.id])],
                }
              : company
          )
        );
      }

      return { success: true };
    }

    const id = generateId("contador");
    const accountant: User = {
      id,
      name,
      email,
      password,
      role: "contador",
    };

    setUsers((prev) => [...prev, accountant]);
    if (companyIds.length) {
      setCompanies((prev) =>
        prev.map((company) =>
          companyIds.includes(company.id)
            ? {
                ...company,
                accountantIds: [...new Set([...(company.accountantIds ?? []), id])],
              }
            : company
        )
      );
    }
    setSession({ userId: id });
    return { success: true };
  };

  const attachCompanyToAccountant: AuthContextValue["attachCompanyToAccountant"] = ({
    accountantId,
    companyId,
  }) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId
          ? {
              ...company,
              accountantIds: [...new Set([...(company.accountantIds ?? []), accountantId])],
            }
          : company
      )
    );
  };

  const updateCompanyProfile: AuthContextValue["updateCompanyProfile"] = (companyId, updates) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== companyId) return company;
        const { metadata, ...rest } = updates;
        return {
          ...company,
          ...rest,
          metadata: metadata ? { ...(company.metadata ?? {}), ...metadata } : company.metadata,
        };
      })
    );
  };

  const applyBoardUpdate = (
    companyId: string,
    updater: (boards: ChecklistBoard[]) => ChecklistBoard[]
  ) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== companyId) return company;
        const nextBoards = updater(company.checklists);
        return recalculateCompany(company, nextBoards, company.notifications);
      })
    );
  };

  const createChecklistBoard: AuthContextValue["createChecklistBoard"] = (companyId, payload) => {
    applyBoardUpdate(companyId, (boards) => {
      const timestamp = nowISO();
      if (payload.template === "essencial") {
        const template = createDefaultChecklistBoard(companyId);
        const baseId = generateId("checklist");
        return [
          ...boards,
          {
            id: baseId,
            companyId,
            name: payload.name ?? template.name,
            description: payload.description ?? template.description,
            createdAt: timestamp,
            updatedAt: timestamp,
            tasks: instantiateChecklistBlueprint({ checklistId: baseId, timestamp }),
          },
        ];
      }

      const newBoard: ChecklistBoard = {
        id: generateId("checklist"),
        companyId,
        name: payload.name,
        description: payload.description,
        createdAt: timestamp,
        updatedAt: timestamp,
        tasks: [],
      };
      return [...boards, newBoard];
    });
  };

  const updateChecklistBoard: AuthContextValue["updateChecklistBoard"] = (companyId, boardId, updates) => {
    applyBoardUpdate(companyId, (boards) =>
      boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              name: updates.name ?? board.name,
              description: updates.description ?? board.description,
              updatedAt: nowISO(),
            }
          : board
      )
    );
  };

  const removeChecklistBoard: AuthContextValue["removeChecklistBoard"] = (companyId, boardId) => {
    applyBoardUpdate(companyId, (boards) => {
      const filtered = boards.filter((board) => board.id !== boardId);
      if (filtered.length) return filtered;
      return [createDefaultChecklistBoard(companyId)];
    });
  };

  const createChecklistTask: AuthContextValue["createChecklistTask"] = (
    companyId,
    boardId,
    payload
  ) => {
    applyBoardUpdate(companyId, (boards) =>
      boards.map((board) => {
        if (board.id !== boardId) return board;
        const timestamp = nowISO();
        const newTask: ChecklistTask = {
          id: generateId("task"),
          checklistId: boardId,
          title: payload.title,
          description: payload.description ?? "",
          severity: sanitizeSeverity(payload.severity),
          status: sanitizeStatus(payload.status ?? "todo"),
          owner: payload.owner,
          category: sanitizeCategory(payload.category),
          dueDate: payload.dueDate,
          phase: sanitizePhase(payload.phase),
          pillar: sanitizePillar(payload.pillar),
          priority: sanitizePriority(payload.priority),
          references: sanitizeReferences(payload.references),
          evidences: sanitizeEvidences(payload.evidences),
          notes: sanitizeNotes(payload.notes),
          tags: sanitizeTags(payload.tags),
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        return {
          ...board,
          tasks: [...board.tasks, newTask],
          updatedAt: timestamp,
        };
      })
    );
  };

  const updateChecklistTask: AuthContextValue["updateChecklistTask"] = (
    companyId,
    boardId,
    taskId,
    updates
  ) => {
    applyBoardUpdate(companyId, (boards) =>
      boards.map((board) => {
        if (board.id !== boardId) return board;
        const timestamp = nowISO();
        return {
          ...board,
          tasks: board.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              title: updates.title ?? task.title,
              description: updates.description ?? task.description,
              severity: updates.severity ? sanitizeSeverity(updates.severity) : task.severity,
              status: updates.status ? sanitizeStatus(updates.status) : task.status,
              owner: updates.owner ?? task.owner,
              category: updates.category ? sanitizeCategory(updates.category) : task.category,
              dueDate: updates.hasOwnProperty("dueDate") ? updates.dueDate : task.dueDate,
              phase: updates.phase ? sanitizePhase(updates.phase) : task.phase,
              pillar: updates.pillar ? sanitizePillar(updates.pillar) : task.pillar,
              priority: updates.priority ? sanitizePriority(updates.priority) : task.priority,
              references: updates.hasOwnProperty("references")
                ? sanitizeReferences(updates.references)
                : task.references,
              evidences: updates.hasOwnProperty("evidences")
                ? sanitizeEvidences(updates.evidences)
                : task.evidences,
              notes: updates.hasOwnProperty("notes") ? sanitizeNotes(updates.notes) : task.notes,
              tags: updates.hasOwnProperty("tags") ? sanitizeTags(updates.tags) : task.tags,
              updatedAt: timestamp,
            };
          }),
          updatedAt: timestamp,
        };
      })
    );
  };

  const deleteChecklistTask: AuthContextValue["deleteChecklistTask"] = (companyId, boardId, taskId) => {
    applyBoardUpdate(companyId, (boards) =>
      boards.map((board) => {
        if (board.id !== boardId) return board;
        const timestamp = nowISO();
        return {
          ...board,
          tasks: board.tasks.filter((task) => task.id !== taskId),
          updatedAt: timestamp,
        };
      })
    );
  };

  const updateChecklistTaskStatus: AuthContextValue["updateChecklistTaskStatus"] = (
    companyId,
    boardId,
    taskId,
    status
  ) => {
    const sanitized = sanitizeStatus(status);
    applyBoardUpdate(companyId, (boards) =>
      boards.map((board) => {
        if (board.id !== boardId) return board;
        const timestamp = nowISO();
        return {
          ...board,
          tasks: board.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: sanitized,
                  updatedAt: timestamp,
                }
              : task
          ),
          updatedAt: timestamp,
        };
      })
    );
  };

  const markNotificationRead: AuthContextValue["markNotificationRead"] = (
    companyId,
    notificationId,
    read = true
  ) => {
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== companyId) return company;
        return {
          ...company,
          notifications: company.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read } : notification
          ),
        };
      })
    );
  };

  const markAllNotificationsRead: AuthContextValue["markAllNotificationsRead"] = (companyId) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId
          ? {
              ...company,
              notifications: company.notifications.map((notification) => ({
                ...notification,
                read: true,
              })),
            }
          : company
      )
    );
  };

  const getUserById: AuthContextValue["getUserById"] = (userId) =>
    publicUsers.find((candidate) => candidate.id === userId) ?? null;

  const value: AuthContextValue = {
    user: currentUser,
    companies,
    loading,
    login,
    logout,
    registerCompany,
    registerCollaborator,
    registerAccountant,
    attachCompanyToAccountant,
    getAccessibleCompanies,
    updateCompanyProfile,
    allUsers: publicUsers,
    getUserById,
    createChecklistBoard,
    updateChecklistBoard,
    removeChecklistBoard,
    createChecklistTask,
    updateChecklistTask,
    deleteChecklistTask,
    updateChecklistTaskStatus,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}

export function useRequireAuth(role?: UserRole) {
  const { user, loading } = useAuth();
  if (loading) return { status: "loading" as const };
  if (!user) return { status: "unauthenticated" as const };
  if (role && user.role !== role) return { status: "forbidden" as const };
  return { status: "authenticated" as const, user };
}
