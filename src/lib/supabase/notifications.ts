import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { nowISO } from "@/lib/checklist-normalizers";
import type {
  ChecklistNotification,
  ChecklistPhase,
  ChecklistPillar,
  ChecklistPriority,
} from "@/types/platform";
import type { Database, Json } from "./types";

type NotificationRow = Database["public"]["Tables"]["checklist_notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["checklist_notifications"]["Insert"];

const NotificationMetadataSchema = z.record(z.unknown());

function normalizeMetadata(value: Json | null): Record<string, unknown> {
  const result = NotificationMetadataSchema.safeParse(value ?? {});
  if (!result.success) {
    return {};
  }
  return result.data;
}

function prepareMetadata(value: unknown): Json {
  const result = NotificationMetadataSchema.safeParse(value ?? {});
  if (!result.success) {
    return {};
  }

  return JSON.parse(JSON.stringify(result.data)) as Json;
}

export function mapNotificationRow(row: NotificationRow): ChecklistNotification {
  return {
    id: row.id,
    checklistId: row.checklist_id ?? undefined,
    taskId: row.task_id ?? null,
    severity: row.severity as ChecklistNotification["severity"],
    title: row.title,
    message: row.message,
    createdAt: row.created_at ?? nowISO(),
    read: row.read,
    dueDate: row.due_date ?? undefined,
    phase: (row.phase as ChecklistPhase | null | undefined) ?? undefined,
    priority: (row.priority as ChecklistPriority | null | undefined) ?? undefined,
    pillar: (row.pillar as ChecklistPillar | null | undefined) ?? undefined,
    kind: row.kind as ChecklistNotification["kind"],
    metadata: normalizeMetadata(row.metadata),
  };
}

function normalizeDateOnly(value?: string): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function notificationToInsert(companyId: string, notification: ChecklistNotification): NotificationInsert {
  return {
    id: notification.id,
    company_id: companyId,
    checklist_id: notification.checklistId ?? null,
    task_id: notification.taskId,
    kind: notification.kind,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    due_date: normalizeDateOnly(notification.dueDate),
    phase: (notification.phase as ChecklistPhase | null | undefined) ?? null,
    priority: (notification.priority as ChecklistPriority | null | undefined) ?? null,
  pillar: (notification.pillar as ChecklistPillar | null | undefined) ?? null,
  metadata: prepareMetadata(notification.metadata),
    created_at: notification.createdAt ?? nowISO(),
    updated_at: nowISO(),
  };
}

export async function fetchSupabaseChecklistNotifications(
  client: SupabaseClient<Database>,
  companyId: string,
): Promise<ChecklistNotification[]> {
  const { data, error } = await client
    .from("checklist_notifications")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as NotificationRow[];
  return rows.map((row) => mapNotificationRow(row));
}

export async function syncSupabaseChecklistNotifications(
  client: SupabaseClient<Database>,
  companyId: string,
  notifications: ChecklistNotification[],
): Promise<void> {
  const sanitizedNotifications = notifications.map((notification) => ({
    ...notification,
    checklistId: notification.checklistId ?? null,
  }));

  const payloads = sanitizedNotifications.map((notification) => notificationToInsert(companyId, notification));

  if (process.env.DEBUG_BACKFILL === "true" && payloads.length > 0) {
    console.log("🔍 Notification payload sample", payloads[0]);
  }

  const { error } = await client.rpc("sync_company_notifications", {
    company_uuid: companyId,
    notifications: payloads,
    remove_missing: true,
  });

  if (error) {
    throw error;
  }
}

export async function setSupabaseNotificationRead(
  client: SupabaseClient<Database>,
  companyId: string,
  notificationId: string,
  read: boolean,
): Promise<void> {
  const { error } = await client.rpc("mark_company_notifications_read", {
    company_uuid: companyId,
    notification_ids: [notificationId],
    mark_read: read,
  });

  if (error) {
    throw error;
  }
}

export async function setSupabaseNotificationsAllRead(
  client: SupabaseClient<Database>,
  companyId: string,
): Promise<void> {
  const { error } = await client.rpc("mark_company_notifications_read", {
    company_uuid: companyId,
    notification_ids: null,
    mark_read: true,
  });

  if (error) {
    throw error;
  }
}

export async function upsertSupabaseNotifications(
  client: SupabaseClient<Database>,
  companyId: string,
  notifications: ChecklistNotification[],
): Promise<void> {
  if (!notifications.length) return;

  const payloads = notifications.map((notification) => notificationToInsert(companyId, notification));
  const { error } = await client.rpc("sync_company_notifications", {
    company_uuid: companyId,
    notifications: payloads,
    remove_missing: false,
  });

  if (error) {
    throw error;
  }
}

export async function deleteSupabaseNotifications(
  client: SupabaseClient<Database>,
  companyId: string,
  notificationIds: string[],
): Promise<void> {
  if (!notificationIds.length) return;

  const { error } = await client.rpc("delete_company_notifications", {
    company_uuid: companyId,
    notification_ids: notificationIds,
  });

  if (error) {
    throw error;
  }
}
