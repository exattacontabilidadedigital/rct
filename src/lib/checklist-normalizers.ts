import { parseISO } from "date-fns";

import { buildChecklistNotifications as buildChecklistNotificationsCore, checklistStatuses, inferBlueprintDueDate } from "@/lib/checklist";
import { generateUuid } from "@/lib/id";
import type { Database, Json } from "@/lib/supabase/types";
import type {
  ChecklistBoard,
  ChecklistNotification,
  ChecklistPhase,
  ChecklistPillar,
  ChecklistPriority,
  ChecklistTask,
  ChecklistTaskAuditEntry,
  ChecklistTaskEvidence,
  ChecklistTaskNote,
  ChecklistTaskReference,
  ChecklistTaskStatus,
  NotificationSeverity,
} from "@/types/platform";

export const VALID_SEVERITIES: NotificationSeverity[] = ["verde", "laranja", "vermelho"];
export const VALID_CATEGORIES: ChecklistTask["category"][] = ["Planejamento", "Operações", "Compliance"];
export const VALID_PRIORITIES: ChecklistPriority[] = ["alta", "media", "baixa"];
export const VALID_PHASES: ChecklistPhase[] = ["Fundamentos", "Planejamento", "Implementação", "Monitoramento"];
export const VALID_PILLARS: ChecklistPillar[] = [
  "Governança & Estratégia",
  "Dados & Cadastros",
  "Processos & Obrigações",
  "Tecnologia & Automação",
  "People & Change",
];
export const VALID_REFERENCE_TYPES: ChecklistTaskReference["type"][] = ["legislação", "guia", "material", "template"];
export const VALID_EVIDENCE_STATUS: NonNullable<ChecklistTaskEvidence["status"]>[] = [
  "pendente",
  "em revisão",
  "concluída",
];

export type SupabaseChecklistTaskRow = {
  id: string;
  board_id: string;
  title: string;
  created_at: string;
  updated_at: string;
} & Partial<{
  blueprint_id: string | null;
  description: string;
  severity: NotificationSeverity;
  status: ChecklistTaskStatus;
  owner: string;
  category: ChecklistTask["category"];
  due_date: string | null;
  phase: ChecklistPhase | null;
  pillar: ChecklistPillar | null;
  priority: ChecklistPriority | null;
  reference_items: ChecklistTaskReference[] | null;
  evidence_items: ChecklistTaskEvidence[] | null;
  note_items: ChecklistTaskNote[] | null;
  tags: string[] | null;
}>;

export type SupabaseChecklistRow = {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
  updated_at: string;
} & Partial<{
  reference_date: string | null;
  description: string | null;
  checklist_tasks: SupabaseChecklistTaskRow[] | null;
}>;

export type SupabaseCompanyRow = Database["public"]["Tables"]["companies"]["Row"];
export type SupabaseCompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];

export const SUPABASE_CHECKLIST_SELECT = `
  id,
  reference_date,
  company_id,
  name,
  description,
  created_at,
  updated_at,
  checklist_tasks (
    id,
    blueprint_id,
    board_id,
    title,
    description,
    severity,
    status,
    owner,
    category,
    due_date,
    phase,
    pillar,
    priority,
    reference_items,
    evidence_items,
    note_items,
    tags,
    created_at,
    updated_at
  )
`;

export const SUPABASE_CHECKLIST_SELECT_LEGACY = `
  id,
  reference_date,
  company_id,
  name,
  description,
  created_at,
  updated_at,
  checklist_tasks (
    id,
    board_id,
    title,
    description,
    severity,
    status,
    owner,
    category,
    due_date,
    phase,
    pillar,
    priority,
    reference_items,
    evidence_items,
    note_items,
    tags,
    created_at,
    updated_at
  )
`;

export const SUPABASE_CHECKLIST_SELECT_MINIMAL = `
  id,
  company_id,
  name,
  description,
  created_at,
  updated_at,
  checklist_tasks (
    id,
    board_id,
    title,
    description,
    severity,
    status,
    owner,
    category,
    due_date,
    created_at,
    updated_at
  )
`;

export const nowISO = () => new Date().toISOString();

export function toSupabaseJson(value: unknown): Json | null {
  if (value === undefined) return null;
  return value as Json;
}

export function sanitizeStatus(value: unknown): ChecklistTaskStatus {
  return checklistStatuses.includes(value as ChecklistTaskStatus) ? (value as ChecklistTaskStatus) : "todo";
}

export function sanitizeSeverity(value: unknown): NotificationSeverity {
  return VALID_SEVERITIES.includes(value as NotificationSeverity)
    ? (value as NotificationSeverity)
    : "laranja";
}

export function sanitizeCategory(value: unknown): ChecklistTask["category"] {
  return VALID_CATEGORIES.includes(value as ChecklistTask["category"])
    ? (value as ChecklistTask["category"])
    : "Planejamento";
}

export function sanitizePriority(value: unknown): ChecklistPriority {
  return VALID_PRIORITIES.includes(value as ChecklistPriority) ? (value as ChecklistPriority) : "media";
}

export function sanitizePhase(value: unknown): ChecklistPhase | undefined {
  return VALID_PHASES.includes(value as ChecklistPhase) ? (value as ChecklistPhase) : undefined;
}

export function sanitizePillar(value: unknown): ChecklistPillar | undefined {
  return VALID_PILLARS.includes(value as ChecklistPillar) ? (value as ChecklistPillar) : undefined;
}

export function sanitizeReferences(value: unknown): ChecklistTaskReference[] {
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

export function sanitizeEvidences(value: unknown): ChecklistTaskEvidence[] {
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

export function sanitizeNotes(value: unknown): ChecklistTaskNote[] {
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
          : generateUuid();

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

export function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .filter((tag): tag is string => Boolean(tag));
}

export function sanitizeTask(
  task: Partial<ChecklistTask>,
  boardId: string,
  fallbackTimestamp: string
): ChecklistTask {
  const createdAt = task.createdAt ?? fallbackTimestamp;
  const updatedAt = task.updatedAt ?? createdAt;
  const rawDueDate = typeof task.dueDate === "string" ? task.dueDate.trim() : task.dueDate;
  const hasManualUpdates = Boolean(task.updatedAt) && task.updatedAt !== task.createdAt;

  let dueDate = rawDueDate && rawDueDate.length ? rawDueDate : undefined;

  if (!dueDate && (task.blueprintId || task.id)) {
    const referenceDate = parseISO(createdAt);
    const inferred = inferBlueprintDueDate(task.blueprintId ?? task.id ?? "", referenceDate);
    if (inferred && !hasManualUpdates) {
      dueDate = inferred;
    }
  }

  const history = Array.isArray(task.history)
    ? (task.history as ChecklistTaskAuditEntry[]).map((entry) => ({ ...entry }))
    : [];

  return {
    id: task.id ?? generateUuid(),
    blueprintId: task.blueprintId,
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
    history,
  };
}

export function sanitizeBoard(board: Partial<ChecklistBoard>, companyId: string): ChecklistBoard {
  const reference = board.createdAt ?? nowISO();
  const boardId = board.id ?? generateUuid();
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

export function mapSupabaseTaskRow(row: SupabaseChecklistTaskRow): ChecklistTask {
  const partialTask: Partial<ChecklistTask> = {
    id: row.id,
    blueprintId: row.blueprint_id ?? undefined,
    checklistId: row.board_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    owner: row.owner,
    category: row.category,
    dueDate: row.due_date ?? undefined,
    phase: row.phase ?? undefined,
    pillar: row.pillar ?? undefined,
    priority: row.priority ?? undefined,
    references: row.reference_items ?? undefined,
    evidences: row.evidence_items ?? undefined,
    notes: row.note_items ?? undefined,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return sanitizeTask(partialTask, row.board_id, row.created_at);
}

export function mapSupabaseChecklistRow(row: SupabaseChecklistRow): ChecklistBoard {
  const tasks = Array.isArray(row.checklist_tasks)
    ? row.checklist_tasks.map((taskRow) => mapSupabaseTaskRow(taskRow))
    : [];

  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tasks,
  };
}

export function toSupabaseBoardInsert(board: ChecklistBoard): Database["public"]["Tables"]["checklists"]["Insert"] {
  return {
    id: board.id,
    company_id: board.companyId,
    name: board.name,
    description: board.description ?? null,
    created_at: board.createdAt,
    updated_at: board.updatedAt,
  } as Database["public"]["Tables"]["checklists"]["Insert"];
}

export function toSupabaseTaskInsert(
  task: ChecklistTask
): Database["public"]["Tables"]["checklist_tasks"]["Insert"] {
  return {
    id: task.id,
    board_id: task.checklistId,
    title: task.title,
    description: task.description,
    severity: task.severity,
    status: task.status,
    owner: task.owner,
    category: task.category,
    due_date: task.dueDate ?? null,
    phase: task.phase ?? null,
    pillar: task.pillar ?? null,
    priority: task.priority ?? null,
    reference_items: toSupabaseJson(task.references),
    evidence_items: toSupabaseJson(task.evidences),
    note_items: toSupabaseJson(task.notes),
    tags: task.tags ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  } as Database["public"]["Tables"]["checklist_tasks"]["Insert"];
}

export function buildNotificationsForBoards(
  boards: ChecklistBoard[],
  previous: ChecklistNotification[] = []
): ChecklistNotification[] {
  return buildChecklistNotificationsCore(boards, previous);
}

export function formatDueDateLabel(dueDate?: string) {
  if (!dueDate) return "Sem prazo";
  const date = parseISO(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return formatDateLabel(date);
}

function formatDateLabel(date: Date) {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}/${month}`;
}
