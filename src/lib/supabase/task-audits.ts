import type { SupabaseClient } from "@supabase/supabase-js";

import { nowISO } from "@/lib/checklist-normalizers";
import type {
  ChecklistTaskAuditEntry,
  ChecklistTaskAuditEvent,
  ChecklistTaskChangeSet,
  UserRole,
} from "@/types/platform";
import type { Database, Json } from "./types";

const VALID_AUDIT_EVENTS: ChecklistTaskAuditEvent[] = [
  "created",
  "updated",
  "completed",
  "reopened",
  "status_changed",
  "deleted",
];

const DEFAULT_EVENT: ChecklistTaskAuditEvent = "updated";

type TaskAuditRow = Database["public"]["Tables"]["checklist_task_audits"]["Row"];
type TaskAuditInsert = Database["public"]["Tables"]["checklist_task_audits"]["Insert"];

type PostgrestErrorLike = {
  code?: string;
  message?: string;
};

function sanitizeEvent(event: string | null | undefined): ChecklistTaskAuditEvent {
  if (!event) return DEFAULT_EVENT;
  const candidate = event as ChecklistTaskAuditEvent;
  return VALID_AUDIT_EVENTS.includes(candidate) ? candidate : DEFAULT_EVENT;
}

function normalizeChangeSet(value: Json | null): ChecklistTaskChangeSet {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries: ChecklistTaskChangeSet = {};
  for (const [field, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }

    const fromValue = Object.prototype.hasOwnProperty.call(raw, "from") ? (raw as { from: unknown }).from : undefined;
    const toValue = Object.prototype.hasOwnProperty.call(raw, "to") ? (raw as { to: unknown }).to : undefined;

    entries[field] = {
      from: fromValue ?? null,
      to: toValue ?? null,
    };
  }

  return entries;
}

function serializeChangeSet(changeSet: ChecklistTaskChangeSet): Json {
  return JSON.parse(JSON.stringify(changeSet)) as Json;
}

export function mapTaskAuditRow(row: TaskAuditRow): ChecklistTaskAuditEntry {
  return {
    id: row.id,
    companyId: row.company_id,
    checklistId: row.checklist_id,
    taskId: row.task_id,
    event: sanitizeEvent(row.event),
    summary: row.summary,
    changes: normalizeChangeSet(row.changes),
    actorId: row.actor_id,
    actorName: row.actor_name ?? undefined,
    actorRole: (row.actor_role as UserRole | null | undefined) ?? null,
    createdAt: row.created_at ?? nowISO(),
  };
}

export async function fetchSupabaseTaskAudits(
  client: SupabaseClient<Database>,
  companyId: string,
): Promise<ChecklistTaskAuditEntry[]> {
  const { data, error } = await client
    .from("checklist_task_audits")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isTaskAuditTableMissingError(error)) {
      return [];
    }
    throw error;
  }

  const rows = (data ?? []) as TaskAuditRow[];
  return rows.map((row) => mapTaskAuditRow(row));
}

export async function insertSupabaseTaskAudit(
  client: SupabaseClient<Database>,
  entry: ChecklistTaskAuditEntry,
): Promise<void> {
  const payload: TaskAuditInsert = {
    id: entry.id,
    company_id: entry.companyId,
    checklist_id: entry.checklistId,
    task_id: entry.taskId,
    actor_id: entry.actorId ?? null,
    actor_name: entry.actorName ?? null,
    actor_role: entry.actorRole ?? null,
    event: entry.event,
    summary: entry.summary,
    changes: serializeChangeSet(entry.changes),
    created_at: entry.createdAt,
    updated_at: nowISO(),
  };

  const { error } = await client.from("checklist_task_audits").insert(payload);
  if (error) {
    if (isTaskAuditTableMissingError(error)) {
      return;
    }
    throw error;
  }
}

export function groupTaskAuditsByTask(
  audits: ChecklistTaskAuditEntry[],
): Map<string, ChecklistTaskAuditEntry[]> {
  const map = new Map<string, ChecklistTaskAuditEntry[]>();
  audits.forEach((audit) => {
    const current = map.get(audit.taskId) ?? [];
    current.push(audit);
    map.set(audit.taskId, current);
  });
  return map;
}

export function isTaskAuditTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, message } = error as PostgrestErrorLike;
  if (code === "42P01" || code === "PGRST300") {
    return true;
  }

  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("checklist_task_audits") && normalized.includes("does not exist");
}
