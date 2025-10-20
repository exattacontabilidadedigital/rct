"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";

import {
  buildChecklistNotifications,
  calculateChecklistProgressFromBoards,
  createDefaultChecklistBoard,
  createChecklistEventNotification,
  formatDueDateLabel,
  instantiateChecklistBlueprint,
} from "@/lib/checklist";
import { generateUuid } from "@/lib/id";
import {
  INITIAL_STATE as DEMO_INITIAL_STATE,
} from "@/data/demo";
import {
  nowISO,
  sanitizeBoard,
  sanitizeCategory,
  sanitizeEvidences,
  sanitizeTask,
  sanitizeNotes,
  sanitizePhase,
  sanitizePillar,
  sanitizePriority,
  sanitizeReferences,
  sanitizeSeverity,
  sanitizeStatus,
  sanitizeTags,
  toSupabaseJson,
  toSupabaseTaskInsert,
} from "@/lib/checklist-normalizers";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fetchSupabaseCompanyBoards, insertSupabaseBoardWithTasks } from "@/lib/supabase/checklists";
import {
  fetchSupabaseChecklistNotifications,
  setSupabaseNotificationRead,
  setSupabaseNotificationsAllRead,
  syncSupabaseChecklistNotifications,
} from "@/lib/supabase/notifications";
import {
  fetchSupabaseTaskAudits,
  groupTaskAuditsByTask,
  insertSupabaseTaskAudit,
  isTaskAuditTableMissingError,
} from "@/lib/supabase/task-audits";
import type {
  ChecklistBoard,
  ChecklistNotification,
  ChecklistTaskAuditEntry,
  ChecklistTaskAuditEvent,
  ChecklistTaskChangeSet,
  ChecklistTask,
  ChecklistTaskStatus,
  Company,
  NotificationSeverity,
  SessionState,
  User,
  UserRole,
} from "@/types/platform";

const loggedCompaniesWithoutSession = new Set<string>();

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
  login: (
    params: { email: string; password: string },
  ) => Promise<{
    success: boolean;
    message?: string;
    code?: "invalid-credentials" | "network-error" | "unknown-error";
  }>;
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

const STORAGE_KEY = "rtc-auth-state-v2";
function toSupabaseTaskUpdatePayload(updates: ChecklistTaskUpdate | { status: ChecklistTaskStatus }) {
  const payload: Record<string, unknown> = {
    updated_at: nowISO(),
  };

  if ("title" in updates && updates.title !== undefined) {
    payload.title = updates.title;
  }

  if ("description" in updates && updates.description !== undefined) {
    payload.description = updates.description ?? "";
  }

  if ("severity" in updates && updates.severity !== undefined) {
    payload.severity = sanitizeSeverity(updates.severity);
  }

  if ("status" in updates && updates.status !== undefined) {
    payload.status = sanitizeStatus(updates.status);
  }

  if ("owner" in updates && updates.owner !== undefined) {
    payload.owner = updates.owner;
  }

  if ("category" in updates && updates.category !== undefined) {
    payload.category = sanitizeCategory(updates.category);
  }

  if ("dueDate" in updates && updates.dueDate !== undefined) {
    payload.due_date = updates.dueDate ?? null;
  }

  if ("phase" in updates) {
    const phase = updates.phase !== undefined ? sanitizePhase(updates.phase) ?? null : null;
    payload.phase = phase;
  }

  if ("pillar" in updates) {
    const pillar = updates.pillar !== undefined ? sanitizePillar(updates.pillar) ?? null : null;
    payload.pillar = pillar;
  }

  if ("priority" in updates && updates.priority !== undefined) {
    payload.priority = sanitizePriority(updates.priority);
  }

  if ("references" in updates) {
    payload.reference_items = toSupabaseJson(updates.references ?? null);
  }

  if ("evidences" in updates) {
    payload.evidence_items = toSupabaseJson(updates.evidences ?? null);
  }

  if ("notes" in updates) {
    payload.note_items = toSupabaseJson(updates.notes ?? null);
  }

  if ("tags" in updates) {
    payload.tags = updates.tags ?? null;
  }

  return payload;
}

function convertLegacyChecklist(companyId: string, legacy: LegacyChecklist): ChecklistBoard {
  const timestamp = legacy.lastUpdated ?? nowISO();
  const boardId = `${companyId}-checklist-essencial`;
  const completed = new Set(legacy.completedItems ?? []);

  const tasks = (legacy.items ?? []).map((item) =>
    sanitizeTask(
      {
        id: generateUuid(),
        blueprintId: item.id,
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
      },
      boardId,
      timestamp
    )
  );

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
    const companyId = raw.id ?? generateUuid();
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

function buildChecklistBoard(companyId: string, payload: ChecklistBoardPayload): ChecklistBoard {
  const timestamp = nowISO();
  const boardId = generateUuid();
  const useTemplate = payload.template !== "blank";

  const baseName = payload.template === "essencial" ? "Checklist Reforma Tributária 2026" : "Checklist";

  const board: ChecklistBoard = {
    id: boardId,
    companyId,
    name: payload.name?.trim() || baseName,
    description: payload.description?.trim() ||
      (payload.template === "essencial"
        ? "Sequência guiada para adaptação do CRT 3 ao IBS/CBS com obrigatoriedades de 2026."
        : undefined),
    createdAt: timestamp,
    updatedAt: timestamp,
    tasks: [],
  };

  if (useTemplate) {
    board.tasks = instantiateChecklistBlueprint({ checklistId: boardId, timestamp });
  }

  return board;
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function fetchSupabaseChecklists(companyId: string): Promise<ChecklistBoard[]> {
  if (!UUID_REGEX.test(companyId)) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[AuthContext] Pulando sincronização Supabase para empresa ${companyId} (ID não é UUID).`
      );
    }
    return [];
  }

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Supabase session check failed", sessionError);
    return [];
  }

  if (!session) {
    if (process.env.NODE_ENV === "development" && !loggedCompaniesWithoutSession.has(companyId)) {
      console.info(
        `[AuthContext] Nenhuma sessão Supabase ativa encontrada ao buscar checklists da empresa ${companyId}. Pulando sincronização.`
      );
      loggedCompaniesWithoutSession.add(companyId);
    }
    return [];
  }

  try {
    const boards = await fetchSupabaseCompanyBoards(supabase, companyId);
    let audits: ChecklistTaskAuditEntry[] = [];

    try {
      audits = await fetchSupabaseTaskAudits(supabase, companyId);
    } catch (auditError) {
      if (isTaskAuditTableMissingError(auditError)) {
        if (process.env.NODE_ENV === "development") {
          console.info(
            "[AuthContext] Tabela checklist_task_audits ausente. Execute a migração 202510200004_add_checklist_task_audits_table.sql para habilitar histórico."
          );
        }
      } else {
        console.error("Supabase fetchTaskAudits error", auditError);
      }
    }

    const auditsByTask = groupTaskAuditsByTask(audits);
    return boards.map((board) => ({
      ...board,
      tasks: board.tasks.map((task) => ({
        ...task,
        history: auditsByTask.get(task.id) ?? [],
      })),
    }));
  } catch (error) {
    console.error("Supabase fetchChecklists error", error);
    return [];
  }
}

async function updateSupabaseBoard(boardId: string, updates: ChecklistBoardUpdate) {
  const supabase = getSupabaseBrowserClient();
  const payload: Record<string, unknown> = { updated_at: nowISO() };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description ?? null;

  const { error } = await supabase
    .from("checklists")
    .update(payload)
    .eq("id", boardId);

  if (error) {
    throw error;
  }
}

async function deleteSupabaseBoard(boardId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", boardId);

  if (error) {
    throw error;
  }
}

async function insertSupabaseTask(task: ChecklistTask) {
  const supabase = getSupabaseBrowserClient();
  const payload = toSupabaseTaskInsert(task);
  const handleMissingBlueprintColumn = async () => {
    console.warn("[supabase] checklist_tasks missing blueprint_id column; retrying insert without it");
    const { blueprint_id: _legacyBlueprint, ...rest } = payload as Database["public"]["Tables"]["checklist_tasks"]["Insert"] & {
      blueprint_id?: unknown;
    };
    void _legacyBlueprint;
    const fallbackPayload = rest as Database["public"]["Tables"]["checklist_tasks"]["Insert"];
    const { error: fallbackError } = await supabase.from("checklist_tasks").insert(fallbackPayload);
    if (!fallbackError) {
      return;
    }
    throw fallbackError;
  };

  const { error } = await supabase.from("checklist_tasks").insert(payload);
  if (!error) {
    return;
  }

  if (error.code === "42703" || error.code === "PGRST204") {
    await handleMissingBlueprintColumn();
    return;
  }

  throw error;
}

async function updateSupabaseTask(boardId: string, taskId: string, updates: ChecklistTaskUpdate | { status: ChecklistTaskStatus }) {
  const supabase = getSupabaseBrowserClient();
  const payload = toSupabaseTaskUpdatePayload(updates);
  const { error } = await supabase
    .from("checklist_tasks")
    .update(payload)
    .eq("board_id", boardId)
    .eq("id", taskId);

  if (error) {
    throw error;
  }
}

async function deleteSupabaseTask(boardId: string, taskId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("checklist_tasks")
    .delete()
    .eq("board_id", boardId)
    .eq("id", taskId);

  if (error) {
    throw error;
  }
}

const INITIAL_STATE: StoredState = DEMO_INITIAL_STATE;

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
  const fetchedChecklistsRef = useRef<Set<string>>(new Set());
  const clearedStaleSessionRef = useRef(false);
  const realtimeNotificationChannelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const notificationFetchQueueRef = useRef<Map<string, Promise<void>>>(new Map());

  const hydrateFromSupabase = useCallback(
    async (nextSession: Session | null) => {
      // Validação defensiva para garantir que temos uma sessão válida
      if (!nextSession) {
        console.log("ℹ️ nextSession é null, limpando estado");
        fetchedChecklistsRef.current.clear();
        setSession(null);
        setUsers(INITIAL_STATE.users);
        setCompanies(INITIAL_STATE.companies);
        setLoading(false);
        return;
      }

      if (!nextSession.user) {
        console.log("ℹ️ nextSession.user é null, limpando estado");
        fetchedChecklistsRef.current.clear();
        setSession(null);
        setUsers(INITIAL_STATE.users);
        setCompanies(INITIAL_STATE.companies);
        setLoading(false);
        return;
      }

      if (!nextSession.user.id) {
        console.log("ℹ️ nextSession.user.id é vazio, limpando estado");
        fetchedChecklistsRef.current.clear();
        setSession(null);
        setUsers(INITIAL_STATE.users);
        setCompanies(INITIAL_STATE.companies);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      setLoading(true);

      if (clearedStaleSessionRef.current) {
        console.info("ℹ️ Sessão já foi sinalizada como inválida anteriormente. Aguardando novo login.");
        setLoading(false);
        return;
      }

      try {
        const authUserId = nextSession.user.id;
        console.log("🔄 Iniciando hydrate para userId:", authUserId);

        const accessToken = nextSession.access_token;
        if (!accessToken) {
          console.warn("⚠️ Sessão Supabase sem access_token. Abortando hydrate.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/auth/session", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Hydrate via /api/auth/session falhou", {
            status: response.status,
            statusText: response.statusText,
          });
          clearedStaleSessionRef.current = true;
          await supabase.auth.signOut({ scope: "local" }).catch((error) => {
            console.error("Falha ao encerrar sessão Supabase", error);
          });
          fetchedChecklistsRef.current.clear();
          setSession(null);
          setUsers(INITIAL_STATE.users);
          setCompanies(INITIAL_STATE.companies);
          setLoading(false);
          return;
        }

        type SessionHydrateSuccess = {
          success: true;
          data: {
            sessionUserId: string;
            users: User[];
            company: Company;
          };
        };

        type SessionHydrateError = {
          success: false;
          message?: string;
        };

        const payload = (await response.json()) as SessionHydrateSuccess | SessionHydrateError;

        if (!payload.success) {
          console.error("/api/auth/session retornou erro", payload);
          clearedStaleSessionRef.current = true;
          await supabase.auth.signOut({ scope: "local" }).catch((error) => {
            console.error("Falha ao encerrar sessão Supabase", error);
          });
          fetchedChecklistsRef.current.clear();
          setSession(null);
          setUsers(INITIAL_STATE.users);
          setCompanies(INITIAL_STATE.companies);
          setLoading(false);
          return;
        }

        const { company, users: nextUsers, sessionUserId } = payload.data;

        clearedStaleSessionRef.current = false;
        fetchedChecklistsRef.current.add(company.id);

        setUsers(nextUsers);
        setCompanies([company]);
        setSession({ userId: sessionUserId });
      } catch (error) {
        console.error("Falha ao sincronizar sessão Supabase", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshCompanyNotifications = useCallback(
    (companyId: string) => {
      if (!UUID_REGEX.test(companyId)) {
        return;
      }

      if (notificationFetchQueueRef.current.has(companyId)) {
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const pending = fetchSupabaseChecklistNotifications(supabase, companyId)
        .then((remoteNotifications) => {
          setCompanies((previous) =>
            previous.map((candidate) =>
              candidate.id === companyId
                ? recalculateCompany(candidate, candidate.checklists, remoteNotifications)
                : candidate
            )
          );
        })
        .catch((error) => {
          console.error("Supabase realtime notifications fetch failed", error);
        })
        .finally(() => {
          notificationFetchQueueRef.current.delete(companyId);
        });

      notificationFetchQueueRef.current.set(companyId, pending);
    },
    [setCompanies],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStorage();
    setUsers(stored.users);
    setCompanies(stored.companies);
    setSession(stored.session);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Recuperar sessão com validação
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.warn("⚠️ Erro ao recuperar sessão:", error);
          hydrateFromSupabase(null);
          return;
        }
        
        const session = data.session;
        // Validar se a sessão tem um usuário válido
        if (session && session.user && session.user.id) {
          console.log("✅ Sessão válida encontrada para:", session.user.id);
          hydrateFromSupabase(session);
        } else {
          console.log("ℹ️ Sessão inválida ou vazia, limpando");
          hydrateFromSupabase(null);
        }
      })
      .catch((error) => {
        console.error("❌ Falha crítica ao recuperar sessão Supabase:", error);
        hydrateFromSupabase(null);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      console.log("🔔 Auth state changed:", _event);
      hydrateFromSupabase(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [hydrateFromSupabase]);

  useEffect(() => {
    if (loading) return;
    saveStorage({ users, companies, session });
  }, [users, companies, session, loading]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channelMap = realtimeNotificationChannelsRef.current;

    if (!session) {
      channelMap.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
      channelMap.clear();
      return;
    }

    const trackableCompanies = new Set(
      companies
        .filter((company) => UUID_REGEX.test(company.id))
        .map((company) => company.id),
    );

    for (const [companyId, channel] of channelMap.entries()) {
      if (!trackableCompanies.has(companyId)) {
        void supabase.removeChannel(channel);
        channelMap.delete(companyId);
      }
    }

    companies.forEach((company) => {
      if (!UUID_REGEX.test(company.id)) return;
      if (channelMap.has(company.id)) return;

      const channel = supabase
        .channel(`checklist_notifications:${company.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "checklist_notifications",
            filter: `company_id=eq.${company.id}`,
          },
          () => {
            refreshCompanyNotifications(company.id);
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`Supabase realtime channel issue for company ${company.id}: ${status}`);
          }
        });

      channelMap.set(company.id, channel);
    });
  }, [companies, refreshCompanyNotifications, session]);

  useEffect(() => {
    const channelMap = realtimeNotificationChannelsRef.current;
    return () => {
      const supabase = getSupabaseBrowserClient();
      channelMap.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
      channelMap.clear();
    };
  }, []);

  useEffect(() => {
    companies.forEach((company) => {
      if (fetchedChecklistsRef.current.has(company.id)) return;

      fetchedChecklistsRef.current.add(company.id);
      fetchSupabaseChecklists(company.id)
        .then((remoteBoards) => {
          if (!remoteBoards.length) return;

          setCompanies((previous) =>
            previous.map((candidate) =>
              candidate.id === company.id
                ? recalculateCompany(candidate, remoteBoards, candidate.notifications)
                : candidate
            )
          );
        })
        .catch((error) => {
          console.error("Supabase fetchChecklists failed", error);
          fetchedChecklistsRef.current.delete(company.id);
        });
    });
  }, [companies]);

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
        return companies.filter(
          (company) =>
            company.ownerId === targetUser.id ||
            company.id === targetUser.companyId ||
            company.id === targetUser.id,
        );
      case "colaborador":
        return companies.filter((company) => company.employees.includes(userId));
      case "contador":
        return companies.filter((company) => company.accountantIds?.includes(userId));
      default:
        return [];
    }
  };

  const login: AuthContextValue["login"] = async ({ email, password }) => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        const status = (error as { status?: number } | null | undefined)?.status;
        if (status === 400) {
          return {
            success: false,
            code: "invalid-credentials",
            message: "E-mail ou senha incorretos. Verifique e tente novamente.",
          };
        }

        const fallbackMessage = error?.message ?? "Não foi possível autenticar. Tente novamente em instantes.";
        return { success: false, code: "unknown-error", message: fallbackMessage };
      }

      await hydrateFromSupabase(data.session);
      return { success: true };
    } catch (caughtError) {
      console.error("Supabase sign in threw an exception", caughtError);
      return {
        success: false,
        code: "network-error",
        message: "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.",
      };
    }
  };

  const logout = () => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.signOut().catch((error) => console.error("Falha ao encerrar sessão Supabase", error));
    void hydrateFromSupabase(null);
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
    const sanitized = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      regime,
      sector,
      cnpj: cnpj?.trim() ?? "",
    };

    if (!sanitized.email || !sanitized.password || !sanitized.name) {
      return { success: false, message: "Preencha nome, e-mail e senha para criar sua conta." };
    }

    let response: Response;
    try {
      response = await fetch("/api/register-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: sanitized.name,
          email: sanitized.email,
          password: sanitized.password,
          regime: sanitized.regime,
          sector: sanitized.sector,
          cnpj: sanitized.cnpj,
        }),
      });
    } catch (networkError) {
      console.error("Register company request failed", networkError);
      return { success: false, message: "Não foi possível conectar ao serviço de cadastro" };
    }

    type ApiSuccess = {
      success: true;
      data: {
        userId: string;
        companyId: string;
        board: ChecklistBoard;
      };
    };

    type ApiError = {
      success: false;
      message: string;
    };

    let payload: ApiSuccess | ApiError;
    try {
      payload = (await response.json()) as ApiSuccess | ApiError;
    } catch (parseError) {
      console.error("Failed to parse register company response", parseError);
      return { success: false, message: "Resposta inesperada do serviço de cadastro" };
    }

    if (!response.ok || !payload.success) {
      const message = payload.success ? "Falha ao cadastrar empresa" : payload.message;
      return { success: false, message };
    }

    const supabase = getSupabaseBrowserClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitized.email,
      password: sanitized.password,
    });

    if (signInError || !signInData.session) {
      console.error("Supabase sign in after register failed", signInError);
      return {
        success: false,
        message:
          "Conta criada, mas não foi possível autenticar automaticamente. Tente fazer login com seu e-mail e senha.",
      };
    }

    await hydrateFromSupabase(signInData.session);
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

  const id = generateUuid();
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

  const id = generateUuid();
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

  type TaskEventAction = "created" | "updated" | "deleted" | "completed" | "reopened";
  type BoardEventAction = "created" | "updated" | "deleted";

  const TASK_EVENT_TITLES: Record<TaskEventAction, string> = {
    created: "Nova tarefa cadastrada",
    updated: "Tarefa atualizada",
    deleted: "Tarefa removida",
    completed: "Tarefa concluída",
    reopened: "Tarefa reaberta",
  };

  const BOARD_EVENT_TITLES: Record<BoardEventAction, string> = {
    created: "Checklist criado",
    updated: "Checklist atualizado",
    deleted: "Checklist removido",
  };

  const TASK_STATUS_LABELS: Record<ChecklistTaskStatus, string> = {
    todo: "A fazer",
    doing: "Em andamento",
    done: "Concluída",
  };

  type TaskFieldKey = "owner" | "dueDate" | "priority" | "severity" | "category" | "pillar" | "phase";

  type TaskFieldChangeDescriptor = {
    key: TaskFieldKey;
    notificationMessage: string;
    auditMessage: string;
    change: { from: unknown; to: unknown };
  };

  type StatusChangeDescriptor = {
    summary: string;
    event: ChecklistTaskAuditEvent;
    change: { from: ChecklistTaskStatus; to: ChecklistTaskStatus };
  };

  function collectTaskFieldChanges(before: ChecklistTask, after: ChecklistTask): TaskFieldChangeDescriptor[] {
    const descriptors: TaskFieldChangeDescriptor[] = [];

    if (before.owner !== after.owner) {
      descriptors.push({
        key: "owner",
        notificationMessage: `responsável agora ${after.owner}`,
        auditMessage: `Responsável agora ${after.owner}.`,
        change: { from: before.owner, to: after.owner },
      });
    }

    if (before.dueDate !== after.dueDate) {
      const fromLabel = before.dueDate ? formatDueDateLabel(before.dueDate) : "sem prazo";
      const toLabel = after.dueDate ? formatDueDateLabel(after.dueDate) : "sem prazo";
      descriptors.push({
        key: "dueDate",
        notificationMessage: `prazo alterado de ${fromLabel} para ${toLabel}`,
        auditMessage: `Prazo alterado de ${fromLabel} para ${toLabel}.`,
        change: { from: before.dueDate ?? null, to: after.dueDate ?? null },
      });
    }

    if (before.priority !== after.priority) {
      const label = after.priority ?? "indefinida";
      descriptors.push({
        key: "priority",
        notificationMessage: `prioridade agora ${label}`,
        auditMessage: `Prioridade agora ${label}.`,
        change: { from: before.priority ?? null, to: after.priority ?? null },
      });
    }

    if (before.severity !== after.severity) {
      descriptors.push({
        key: "severity",
        notificationMessage: `severidade alterada para ${after.severity}`,
        auditMessage: `Severidade alterada para ${after.severity}.`,
        change: { from: before.severity, to: after.severity },
      });
    }

    if (before.category !== after.category) {
      descriptors.push({
        key: "category",
        notificationMessage: `categoria agora ${after.category}`,
        auditMessage: `Categoria agora ${after.category}.`,
        change: { from: before.category, to: after.category },
      });
    }

    if (before.pillar !== after.pillar) {
      const toLabel = after.pillar ?? "sem pilar";
      descriptors.push({
        key: "pillar",
        notificationMessage: `pilar agora ${toLabel}`,
        auditMessage: `Pilar agora ${toLabel}.`,
        change: { from: before.pillar ?? null, to: after.pillar ?? null },
      });
    }

    if (before.phase !== after.phase) {
      const toLabel = after.phase ?? "sem fase";
      descriptors.push({
        key: "phase",
        notificationMessage: `fase agora ${toLabel}`,
        auditMessage: `Fase agora ${toLabel}.`,
        change: { from: before.phase ?? null, to: after.phase ?? null },
      });
    }

    return descriptors;
  }

  function collectStatusChange(before: ChecklistTask, after: ChecklistTask): StatusChangeDescriptor | null {
    if (before.status === after.status) {
      return null;
    }

    if (after.status === "done") {
      return {
        summary: `“${after.title}” foi concluída.`,
        event: "completed",
        change: { from: before.status, to: after.status },
      };
    }

    if (before.status === "done") {
      return {
        summary: `“${after.title}” foi reaberta para acompanhamento.`,
        event: "reopened",
        change: { from: before.status, to: after.status },
      };
    }

    return {
      summary: `Status alterado de ${TASK_STATUS_LABELS[before.status]} para ${TASK_STATUS_LABELS[after.status]}.`,
      event: "status_changed",
      change: { from: before.status, to: after.status },
    };
  }

  type TaskAuditDetails = {
    summary: string;
    changeSet: ChecklistTaskChangeSet;
    event: ChecklistTaskAuditEvent;
  };

  function buildTaskAuditDetails(before: ChecklistTask, after: ChecklistTask): TaskAuditDetails | null {
    const fieldChanges = collectTaskFieldChanges(before, after);
    const changeSet: ChecklistTaskChangeSet = {};
    const summaryParts = fieldChanges.map((change) => {
      changeSet[change.key] = change.change;
      return change.auditMessage;
    });

    const statusChange = collectStatusChange(before, after);
    let primaryEvent: ChecklistTaskAuditEvent | null = null;
    if (statusChange) {
      changeSet.status = statusChange.change;
      summaryParts.unshift(statusChange.summary);
      primaryEvent = statusChange.event;
    }

    if (!summaryParts.length) {
      return null;
    }

    return {
      summary: summaryParts.join(" "),
      changeSet,
      event: primaryEvent ?? "updated",
    };
  }

  function buildTaskCreationAuditEntry(
    companyId: string,
    board: ChecklistBoard,
    task: ChecklistTask,
    actor: PublicUser | null,
    timestamp: string
  ): ChecklistTaskAuditEntry {
    const actorId = actor?.id ?? null;
    const actorName = actor?.name ?? "Sistema";
    const actorRole = actor?.role ?? null;

    const changeSet: ChecklistTaskChangeSet = {
      status: { from: null, to: task.status },
      owner: { from: null, to: task.owner },
      severity: { from: null, to: task.severity },
      category: { from: null, to: task.category },
    };

    if (task.dueDate) {
      changeSet.dueDate = { from: null, to: task.dueDate };
    }

    if (task.priority) {
      changeSet.priority = { from: null, to: task.priority };
    }

    if (task.phase) {
      changeSet.phase = { from: null, to: task.phase };
    }

    if (task.pillar) {
      changeSet.pillar = { from: null, to: task.pillar };
    }

    return {
      id: generateUuid(),
      companyId,
      checklistId: board.id,
      taskId: task.id,
      event: "created",
      summary: `“${task.title}” foi criada no checklist “${board.name}” por ${actorName}.`,
      changes: changeSet,
      actorId,
      actorName,
      actorRole,
      createdAt: timestamp,
    };
  }

  function buildTaskUpdateAuditEntry(
    companyId: string,
    board: ChecklistBoard,
    before: ChecklistTask,
    after: ChecklistTask,
    actor: PublicUser | null,
    timestamp: string
  ): ChecklistTaskAuditEntry | null {
    const details = buildTaskAuditDetails(before, after);
    if (!details) {
      return null;
    }

    return {
      id: generateUuid(),
      companyId,
      checklistId: board.id,
      taskId: after.id,
      event: details.event,
      summary: details.summary,
      changes: details.changeSet,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? "Sistema",
      actorRole: actor?.role ?? null,
      createdAt: timestamp,
    };
  }

  type BoardUpdateOptions = {
    notifications?:
      | ChecklistNotification[]
      | ((args: {
          company: Company;
          previousBoards: ChecklistBoard[];
          nextBoards: ChecklistBoard[];
        }) => ChecklistNotification[]);
  };

  const buildTaskEventNotification = (
    action: TaskEventAction,
    board: ChecklistBoard,
    task: ChecklistTask,
    severity: NotificationSeverity,
    message: string,
    metadata: Record<string, unknown> = {},
    overrideTitle?: string
  ) => {
    return createChecklistEventNotification({
      kind: "task_event",
      checklistId: board.id,
      taskId: task.id,
      severity,
      title: overrideTitle ?? TASK_EVENT_TITLES[action],
      message,
      dueDate: task.dueDate,
      phase: task.phase,
      priority: task.priority,
      pillar: task.pillar,
      metadata: {
        action,
        boardId: board.id,
        boardName: board.name,
        owner: task.owner,
        category: task.category,
        ...metadata,
      },
    });
  };

  const buildBoardEventNotification = (
    action: BoardEventAction,
    board: ChecklistBoard,
    severity: NotificationSeverity,
    message: string,
    metadata: Record<string, unknown> = {},
    overrideTitle?: string
  ) => {
    return createChecklistEventNotification({
      kind: "board_event",
      checklistId: board.id,
      taskId: null,
      severity,
      title: overrideTitle ?? BOARD_EVENT_TITLES[action],
      message,
      dueDate: undefined,
      metadata: {
        action,
        boardId: board.id,
        boardName: board.name,
        ...metadata,
      },
    });
  };

  const describeTaskUpdates = (
    board: ChecklistBoard,
    before: ChecklistTask,
    after: ChecklistTask
  ): ChecklistNotification[] => {
    const notifications: ChecklistNotification[] = [];

    const statusChange = collectStatusChange(before, after);
    if (statusChange?.event === "completed") {
      notifications.push(
        buildTaskEventNotification(
          "completed",
          board,
          after,
          "verde",
          statusChange.summary
        )
      );
    } else if (statusChange?.event === "reopened") {
      notifications.push(
        buildTaskEventNotification(
          "reopened",
          board,
          after,
          "laranja",
          statusChange.summary
        )
      );
    }

    const fieldChanges = collectTaskFieldChanges(before, after);
    if (!fieldChanges.length) {
      return notifications;
    }

    const metadataChanges: ChecklistTaskChangeSet = {};
    fieldChanges.forEach((change) => {
      metadataChanges[change.key] = change.change;
    });

    let severity: NotificationSeverity = "laranja";
    if (metadataChanges.severity) {
      severity = after.severity;
    } else if (statusChange?.change.from === "done" && statusChange.change.to !== "done") {
      severity = "laranja";
    }

    const message = `Atualizações em “${after.title}”: ${fieldChanges
      .map((change) => change.notificationMessage)
      .join("; ")}.`;

    notifications.push(
      buildTaskEventNotification(
        "updated",
        board,
        after,
        severity,
        message,
        {
          changes: metadataChanges,
        }
      )
    );

    return notifications;
  };

  const applyBoardUpdate = (
    companyId: string,
    updater: (boards: ChecklistBoard[]) => ChecklistBoard[],
    options: BoardUpdateOptions = {}
  ) => {
    let nextNotificationSnapshot: ChecklistNotification[] | null = null;
    setCompanies((prev) =>
      prev.map((company) => {
        if (company.id !== companyId) return company;
        const previousBoards = company.checklists;
        const nextBoards = updater(previousBoards);

        const computedNotifications = options.notifications
          ? typeof options.notifications === "function"
            ? options.notifications({ company, previousBoards, nextBoards })
            : options.notifications
          : [];

        const appendedNotifications = computedNotifications.length
          ? [...company.notifications, ...computedNotifications]
          : company.notifications;

        const recalculated = recalculateCompany(company, nextBoards, appendedNotifications);
        nextNotificationSnapshot = recalculated.notifications;
        return recalculated;
      })
    );

    if (nextNotificationSnapshot && UUID_REGEX.test(companyId)) {
      const supabase = getSupabaseBrowserClient();
      void syncSupabaseChecklistNotifications(supabase, companyId, nextNotificationSnapshot).catch((error) => {
        console.error("Supabase sync notifications failed", error);
      });
    }
  };

  const createChecklistBoard: AuthContextValue["createChecklistBoard"] = (companyId, payload) => {
    const board = buildChecklistBoard(companyId, payload);

    applyBoardUpdate(
      companyId,
      (boards) => [...boards, board],
      {
        notifications: [
          buildBoardEventNotification(
            "created",
            board,
            "verde",
            `Checklist “${board.name}” foi criado.`
          ),
        ],
      }
    );

    const supabase = getSupabaseBrowserClient();
    void insertSupabaseBoardWithTasks(supabase, board).catch((error) => {
      console.error("Supabase createChecklistBoard failed", error);
    });
  };

  const updateChecklistBoard: AuthContextValue["updateChecklistBoard"] = (companyId, boardId, updates) => {
    const timestamp = nowISO();
    let previousBoard: ChecklistBoard | null = null;
    let nextBoardSnapshot: ChecklistBoard | null = null;

    applyBoardUpdate(
      companyId,
      (boards) =>
        boards.map((board) => {
          if (board.id !== boardId) return board;
          previousBoard = board;
          const updatedBoard: ChecklistBoard = {
            ...board,
            name: updates.name ?? board.name,
            description: updates.description ?? board.description,
            updatedAt: timestamp,
          };
          nextBoardSnapshot = updatedBoard;
          return updatedBoard;
        }),
      {
        notifications: () => {
          if (!previousBoard || !nextBoardSnapshot) return [];

          const changes: string[] = [];
          const metadata: Record<string, { from: unknown; to: unknown }> = {};

          if (previousBoard.name !== nextBoardSnapshot.name) {
            changes.push(`nome alterado de “${previousBoard.name}” para “${nextBoardSnapshot.name}”`);
            metadata.name = { from: previousBoard.name, to: nextBoardSnapshot.name };
          }

          if ((previousBoard.description ?? "") !== (nextBoardSnapshot.description ?? "")) {
            changes.push("descrição atualizada");
            metadata.description = {
              from: previousBoard.description ?? null,
              to: nextBoardSnapshot.description ?? null,
            };
          }

          if (!changes.length) {
            return [];
          }

          const detail =
            changes.length === 1
              ? changes[0]
              : `atualizações: ${changes.join("; ")}`;

          return [
            buildBoardEventNotification(
              "updated",
              nextBoardSnapshot,
              "laranja",
              `Checklist “${nextBoardSnapshot.name}” ${detail}.`,
              { changes: metadata }
            ),
          ];
        },
      }
    );

    void updateSupabaseBoard(boardId, updates).catch((error) => {
      console.error("Supabase updateChecklistBoard failed", error);
    });
  };

  const removeChecklistBoard: AuthContextValue["removeChecklistBoard"] = (companyId, boardId) => {
    let removedBoard: ChecklistBoard | null = null;

    applyBoardUpdate(
      companyId,
      (boards) => {
        const filtered = boards.filter((board) => {
          if (board.id === boardId) {
            removedBoard = board;
            return false;
          }
          return true;
        });

        if (filtered.length) return filtered;

        const fallback = createDefaultChecklistBoard(companyId);
        const supabase = getSupabaseBrowserClient();
        void insertSupabaseBoardWithTasks(supabase, fallback).catch((error) => {
          console.error("Supabase create fallback checklist failed", error);
        });
        return [fallback];
      },
      {
        notifications: () =>
          removedBoard
            ? [
                buildBoardEventNotification(
                  "deleted",
                  removedBoard,
                  "vermelho",
                  `Checklist “${removedBoard.name}” foi removido.`
                ),
              ]
            : [],
      }
    );

    void deleteSupabaseBoard(boardId).catch((error) => {
      console.error("Supabase removeChecklistBoard failed", error);
    });
  };

  const createChecklistTask: AuthContextValue["createChecklistTask"] = (
    companyId,
    boardId,
    payload
  ) => {
    const timestamp = nowISO();
    let createdTask: ChecklistTask | null = null;
    let boardSnapshot: ChecklistBoard | null = null;
    let creationAudit: ChecklistTaskAuditEntry | null = null;
    const actor = currentUser;

    applyBoardUpdate(
      companyId,
      (boards) =>
        boards.map((board) => {
          if (board.id !== boardId) return board;
          const baseTask: ChecklistTask = {
            id: generateUuid(),
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
            history: [],
          };

          creationAudit = buildTaskCreationAuditEntry(companyId, board, baseTask, actor, timestamp);
          const newTask: ChecklistTask = {
            ...baseTask,
            history: creationAudit ? [creationAudit] : [],
          };
          createdTask = newTask;
          const nextBoard: ChecklistBoard = {
            ...board,
            tasks: [...board.tasks, newTask],
            updatedAt: timestamp,
          };
          boardSnapshot = nextBoard;
          return nextBoard;
        }),
      {
        notifications: () =>
          createdTask && boardSnapshot
            ? [
                buildTaskEventNotification(
                  "created",
                  boardSnapshot,
                  createdTask,
                  "verde",
                  `Tarefa “${createdTask.title}” foi cadastrada no checklist “${boardSnapshot.name}”.`
                ),
              ]
            : [],
      }
    );

    if (createdTask) {
      const taskToPersist = createdTask;
      const auditToPersist = creationAudit;
      void (async () => {
        try {
          await insertSupabaseTask(taskToPersist);
          await updateSupabaseBoard(boardId, {});
          if (auditToPersist) {
            const supabase = getSupabaseBrowserClient();
            await insertSupabaseTaskAudit(supabase, auditToPersist);
          }
        } catch (error) {
          console.error("Supabase createChecklistTask failed", error);
        }
      })();
    }
  };

  const updateChecklistTask: AuthContextValue["updateChecklistTask"] = (
    companyId,
    boardId,
    taskId,
    updates
  ) => {
    const timestamp = nowISO();
    let sanitizedUpdates: ChecklistTaskUpdate | null = null;
    let boardSnapshot: ChecklistBoard | null = null;
    let beforeTask: ChecklistTask | null = null;
    let afterTask: ChecklistTask | null = null;
    let pendingAuditEntry: ChecklistTaskAuditEntry | null = null;
    const actor = currentUser;

    applyBoardUpdate(
      companyId,
      (boards) =>
        boards.map((board) => {
          if (board.id !== boardId) return board;
          const nextTasks = board.tasks.map((task) => {
            if (task.id !== taskId) return task;
            beforeTask = task;
            sanitizedUpdates = {
              ...updates,
              severity: updates.severity ? sanitizeSeverity(updates.severity) : updates.severity,
              status: updates.status ? sanitizeStatus(updates.status) : updates.status,
              category: updates.category ? sanitizeCategory(updates.category) : updates.category,
              phase: updates.phase ? sanitizePhase(updates.phase) : updates.phase,
              pillar: updates.pillar ? sanitizePillar(updates.pillar) : updates.pillar,
              priority: updates.priority ? sanitizePriority(updates.priority) : updates.priority,
              references: updates.hasOwnProperty("references")
                ? sanitizeReferences(updates.references)
                : updates.references,
              evidences: updates.hasOwnProperty("evidences")
                ? sanitizeEvidences(updates.evidences)
                : updates.evidences,
              notes: updates.hasOwnProperty("notes")
                ? sanitizeNotes(updates.notes)
                : updates.notes,
              tags: updates.hasOwnProperty("tags") ? sanitizeTags(updates.tags) : updates.tags,
            } as ChecklistTaskUpdate;

            const candidateTask: ChecklistTask = {
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
              history: task.history,
            };

            const auditEntry = buildTaskUpdateAuditEntry(companyId, board, task, candidateTask, actor, timestamp);
            if (auditEntry) {
              pendingAuditEntry = auditEntry;
            }

            const nextTask: ChecklistTask = auditEntry
              ? {
                  ...candidateTask,
                  history: [...task.history, auditEntry],
                }
              : candidateTask;

            afterTask = nextTask;
            return nextTask;
          });

          const nextBoard: ChecklistBoard = {
            ...board,
            tasks: nextTasks,
            updatedAt: timestamp,
          };

          if (afterTask) {
            boardSnapshot = nextBoard;
          }

          return nextBoard;
        }),
      {
        notifications: () =>
          beforeTask && afterTask && boardSnapshot
            ? describeTaskUpdates(boardSnapshot, beforeTask, afterTask)
            : [],
      }
    );

    if (sanitizedUpdates) {
      const payload = sanitizedUpdates;
      const auditToPersist = pendingAuditEntry;
      void (async () => {
        try {
          await updateSupabaseTask(boardId, taskId, payload);
          await updateSupabaseBoard(boardId, {});
          if (auditToPersist) {
            const supabase = getSupabaseBrowserClient();
            await insertSupabaseTaskAudit(supabase, auditToPersist);
          }
        } catch (error) {
          console.error("Supabase updateChecklistTask failed", error);
        }
      })();
    }
  };

  const deleteChecklistTask: AuthContextValue["deleteChecklistTask"] = (companyId, boardId, taskId) => {
    const timestamp = nowISO();
    let removedTask: ChecklistTask | null = null;
    let boardSnapshot: ChecklistBoard | null = null;

    applyBoardUpdate(
      companyId,
      (boards) =>
        boards.map((board) => {
          if (board.id !== boardId) return board;
          removedTask = board.tasks.find((task) => task.id === taskId) ?? null;
          const nextTasks = board.tasks.filter((task) => task.id !== taskId);
          const nextBoard: ChecklistBoard = {
            ...board,
            tasks: nextTasks,
            updatedAt: timestamp,
          };
          boardSnapshot = nextBoard;
          return nextBoard;
        }),
      {
        notifications: () =>
          removedTask && boardSnapshot
            ? [
                buildTaskEventNotification(
                  "deleted",
                  boardSnapshot,
                  removedTask,
                  "vermelho",
                  `Tarefa “${removedTask.title}” foi removida do checklist “${boardSnapshot.name}”.`
                ),
              ]
            : [],
      }
    );

    void (async () => {
      try {
        await deleteSupabaseTask(boardId, taskId);
        await updateSupabaseBoard(boardId, {});
      } catch (error) {
        console.error("Supabase deleteChecklistTask failed", error);
      }
    })();
  };

  const updateChecklistTaskStatus: AuthContextValue["updateChecklistTaskStatus"] = (
    companyId,
    boardId,
    taskId,
    status
  ) => {
    const sanitized = sanitizeStatus(status);
    const timestamp = nowISO();
    let boardSnapshot: ChecklistBoard | null = null;
    let beforeTask: ChecklistTask | null = null;
    let afterTask: ChecklistTask | null = null;
    let pendingAuditEntry: ChecklistTaskAuditEntry | null = null;
    const actor = currentUser;

    applyBoardUpdate(
      companyId,
      (boards) =>
        boards.map((board) => {
          if (board.id !== boardId) return board;
          const nextTasks = board.tasks.map((task) => {
            if (task.id !== taskId) return task;
            beforeTask = task;
            const candidateTask: ChecklistTask = {
              ...task,
              status: sanitized,
              updatedAt: timestamp,
              history: task.history,
            };
            const auditEntry = buildTaskUpdateAuditEntry(companyId, board, task, candidateTask, actor, timestamp);
            if (auditEntry) {
              pendingAuditEntry = auditEntry;
            }

            const nextTask: ChecklistTask = auditEntry
              ? {
                  ...candidateTask,
                  history: [...task.history, auditEntry],
                }
              : candidateTask;

            afterTask = nextTask;
            return nextTask;
          });

          const nextBoard: ChecklistBoard = {
            ...board,
            tasks: nextTasks,
            updatedAt: timestamp,
          };

          if (afterTask) {
            boardSnapshot = nextBoard;
          }

          return nextBoard;
        }),
      {
        notifications: () =>
          beforeTask && afterTask && boardSnapshot
            ? describeTaskUpdates(boardSnapshot, beforeTask, afterTask)
            : [],
      }
    );

    const auditToPersist = pendingAuditEntry;
    void (async () => {
      try {
        await updateSupabaseTask(boardId, taskId, { status: sanitized });
        await updateSupabaseBoard(boardId, {});
        if (auditToPersist) {
          const supabase = getSupabaseBrowserClient();
          await insertSupabaseTaskAudit(supabase, auditToPersist);
        }
      } catch (error) {
        console.error("Supabase updateChecklistTaskStatus failed", error);
      }
    })();
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

    if (UUID_REGEX.test(companyId)) {
      const supabase = getSupabaseBrowserClient();
      void setSupabaseNotificationRead(supabase, companyId, notificationId, read).catch((error) => {
        console.error("Supabase setSupabaseNotificationRead failed", error);
      });
    }
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

    if (UUID_REGEX.test(companyId)) {
      const supabase = getSupabaseBrowserClient();
      void setSupabaseNotificationsAllRead(supabase, companyId).catch((error) => {
        console.error("Supabase setSupabaseNotificationsAllRead failed", error);
      });
    }
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
