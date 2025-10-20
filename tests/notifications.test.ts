import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/checklist-normalizers", async () => {
  const actual = await vi.importActual<typeof import("@/lib/checklist-normalizers")>("@/lib/checklist-normalizers");
  return {
    ...actual,
    nowISO: () => "2025-10-20T00:00:00.000Z",
  };
});

import {
  deleteSupabaseNotifications,
  fetchSupabaseChecklistNotifications,
  mapNotificationRow,
  setSupabaseNotificationsAllRead,
  syncSupabaseChecklistNotifications,
} from "@/lib/supabase/notifications";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["checklist_notifications"]["Row"];

describe("mapNotificationRow", () => {
  const baseRow: NotificationRow = {
    id: "notification-1",
    company_id: "company-1",
    checklist_id: null,
    task_id: null,
    kind: "task_deadline",
    severity: "laranja",
    title: "Título",
    message: "Mensagem",
    read: false,
    due_date: null,
    phase: null,
    priority: null,
    pillar: null,
    metadata: { foo: "bar" },
    created_at: "2025-10-19T00:00:00.000Z",
    updated_at: "2025-10-19T00:00:00.000Z",
  };

  it("retorna checklistId como undefined quando não houver valor", () => {
  const result = mapNotificationRow(baseRow);
    expect(result.checklistId).toBeUndefined();
  });

  it("sanitiza metadados que não são objetos", () => {
  const result = mapNotificationRow({ ...baseRow, metadata: "invalido" as unknown as Database["public"]["Tables"]["checklist_notifications"]["Row"]["metadata"] });
    expect(result.metadata).toEqual({});
  });
});

describe("Supabase RPC helpers", () => {
  it("sincroniza notificações convertendo checklistId vazio em null", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as Parameters<typeof syncSupabaseChecklistNotifications>[0];

    await syncSupabaseChecklistNotifications(client, "company-1", [
      {
        id: "notification-1",
        checklistId: undefined,
        taskId: null,
        severity: "laranja",
        title: "Título",
        message: "Mensagem",
        createdAt: "2025-10-18T00:00:00.000Z",
        read: false,
        kind: "task_deadline",
        metadata: { nested: { value: 1 } },
      },
    ]);

    expect(rpc).toHaveBeenCalledWith(
      "sync_company_notifications",
      expect.objectContaining({
        company_uuid: "company-1",
        remove_missing: true,
      }),
    );

    const [, params] = rpc.mock.calls[0];
    expect(params.notifications).toHaveLength(1);
    const [payload] = params.notifications as Array<Record<string, unknown>>;
    expect(payload.checklist_id).toBeNull();
    expect(payload.metadata).toEqual({ nested: { value: 1 } });
  });

  it("marca todas as notificações como lidas via RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as Parameters<typeof setSupabaseNotificationsAllRead>[0];

    await setSupabaseNotificationsAllRead(client, "company-1");

    expect(rpc).toHaveBeenCalledWith("mark_company_notifications_read", {
      company_uuid: "company-1",
      notification_ids: null,
      mark_read: true,
    });
  });

  it("usa RPC dedicada para deletar notificações", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = { rpc } as unknown as Parameters<typeof deleteSupabaseNotifications>[0];

    await deleteSupabaseNotifications(client, "company-1", ["a", "b"]);

    expect(rpc).toHaveBeenCalledWith("delete_company_notifications", {
      company_uuid: "company-1",
      notification_ids: ["a", "b"],
    });
  });
});

describe("fetchSupabaseChecklistNotifications", () => {
  it("mapeia registros retornados da tabela", async () => {
    const select = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const order = vi.fn().mockResolvedValue({ data: [
      {
        id: "notification-1",
        company_id: "company-1",
        checklist_id: null,
        task_id: null,
        kind: "task_deadline",
        severity: "laranja",
        title: "Título",
        message: "Mensagem",
        read: true,
        due_date: null,
        phase: null,
        priority: null,
        pillar: null,
        metadata: { ok: true },
        created_at: "2025-10-18T00:00:00.000Z",
        updated_at: "2025-10-19T00:00:00.000Z",
      },
    ], error: null });

    const client = {
      from: vi.fn().mockReturnValue({ select, eq, order }),
    } as unknown as Parameters<typeof fetchSupabaseChecklistNotifications>[0];

    const result = await fetchSupabaseChecklistNotifications(client, "company-1");

    expect(client.from).toHaveBeenCalledWith("checklist_notifications");
    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({ ok: true });
    expect(result[0].checklistId).toBeUndefined();
  });
});
