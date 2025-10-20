import { NextResponse } from "next/server";

import { buildChecklistNotifications, calculateChecklistProgressFromBoards } from "@/lib/checklist";
import { fetchSupabaseCompanyBoards } from "@/lib/supabase/checklists";
import {
  fetchSupabaseChecklistNotifications,
  syncSupabaseChecklistNotifications,
} from "@/lib/supabase/notifications";
import { createSupabaseServiceClient } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";
import type {
  ChecklistBoard,
  ChecklistNotification,
  Company,
  NotificationSeverity,
  User,
  UserRole,
  MaturityLevel,
} from "@/types/platform";

const MATURITY_MAP: Record<Database["public"]["Enums"]["maturity_level"], MaturityLevel> = {
  inicial: "Inicial",
  em_adaptacao: "Em adaptação",
  avancado: "Avançado",
};

function mapMaturityLevel(value: Database["public"]["Enums"]["maturity_level"] | null | undefined): MaturityLevel {
  if (!value) return "Inicial";
  return MATURITY_MAP[value] ?? "Inicial";
}

function normalizeEmployeeIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function parseChecklistProgress(raw: unknown, fallback: number): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : fallback;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

type SerializedSupabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  status?: unknown;
};

function serializeSupabaseError(error: unknown): SerializedSupabaseError {
  if (!error || typeof error !== "object") {
    return {};
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
    status?: unknown;
  };

  return {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details ?? null,
    hint: candidate.hint ?? null,
    status: candidate.status,
  };
}

export async function GET(request: Request) {
  const authorization = extractBearerToken(request.headers.get("authorization") ?? request.headers.get("Authorization"));

  if (!authorization) {
    return NextResponse.json({ success: false, message: "Missing bearer token" }, { status: 401 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(authorization);
  if (userError || !userData?.user?.id) {
    console.error("[session-sync] Failed to validate token", serializeSupabaseError(userError));
    return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
  }

  const authUserId = userData.user.id;

  const { data: ownerRow, error: ownerError } = await supabase
    .from("app_users")
    .select("id, auth_user_id, company_id, email, full_name, role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (ownerError) {
    console.error("[session-sync] app_users lookup failed", serializeSupabaseError(ownerError));
    return NextResponse.json(
      { success: false, message: "Failed to load user", error: serializeSupabaseError(ownerError) },
      { status: 500 },
    );
  }

  if (!ownerRow) {
    return NextResponse.json({ success: false, message: "User record not found" }, { status: 404 });
  }

  const companyId = ownerRow.company_id ?? ownerRow.auth_user_id ?? ownerRow.id;

  type CompanyQueryResult = {
    id: string;
    name?: string | null;
    cnpj?: string | null;
    regime?: string | null;
    sector?: string | null;
    origin?: string | null;
    maturity?: Database["public"]["Enums"]["maturity_level"] | null;
    risk_level?: NotificationSeverity | null;
    checklist_progress?: string | number | null;
    metadata?: Record<string, unknown> | null;
    employees?: unknown;
    accountant_ids?: unknown;
  };

  const selectCompany = async (columns: string) =>
    supabase.from("companies").select(columns).eq("id", companyId).maybeSingle<CompanyQueryResult>();

  const companySelects = [
    "id, name, cnpj, regime, sector, origin, maturity, risk_level, checklist_progress, employees, accountant_ids, metadata",
    "id, name, cnpj, regime, sector, origin, maturity, risk_level, checklist_progress, metadata",
  ];

  let companyResult = await selectCompany(companySelects[0]);
  if (companyResult.error?.code === "42703") {
    companyResult = await selectCompany(companySelects[1]);
  }

  if (companyResult.error) {
    console.error("[session-sync] companies lookup failed", serializeSupabaseError(companyResult.error));
    return NextResponse.json(
      { success: false, message: "Failed to load company", error: serializeSupabaseError(companyResult.error) },
      { status: 500 },
    );
  }

  const companyRow = companyResult.data ?? { id: companyId };

  const { data: companyUsersData, error: companyUsersError } = await supabase
    .from("app_users")
    .select("id, auth_user_id, company_id, email, full_name, role")
    .eq("company_id", companyId);

  if (companyUsersError) {
    console.error("[session-sync] company users lookup failed", serializeSupabaseError(companyUsersError));
  }

  let boards: ChecklistBoard[] = [];
  let persistedNotifications: ChecklistNotification[] = [];
  try {
    boards = await fetchSupabaseCompanyBoards(supabase, companyId);
  } catch (error) {
    console.error("[session-sync] fetchSupabaseCompanyBoards failed", serializeSupabaseError(error));
    boards = [];
  }

  try {
    persistedNotifications = await fetchSupabaseChecklistNotifications(supabase, companyId);
  } catch (error) {
    console.error("[session-sync] fetchSupabaseChecklistNotifications failed", serializeSupabaseError(error));
    persistedNotifications = [];
  }

  const mappedUsers: User[] = (companyUsersData ?? []).map((row) => ({
    id: row.auth_user_id ?? row.id,
    name: row.full_name ?? row.email ?? "Usuário",
    email: row.email ?? "",
    role: (row.role as UserRole) ?? "empresa",
    companyId: row.company_id ?? undefined,
  }));

  const ownerUserId = ownerRow.auth_user_id ?? ownerRow.id;

  if (!mappedUsers.some((candidate) => candidate.id === ownerUserId)) {
    mappedUsers.push({
      id: ownerUserId,
      name: ownerRow.full_name ?? ownerRow.email ?? "Usuário",
      email: ownerRow.email ?? "",
      role: (ownerRow.role as UserRole) ?? "empresa",
      companyId: ownerRow.company_id ?? undefined,
    });
  }

  const employeeIds = new Set<string>(normalizeEmployeeIds(companyRow.employees));
  const accountantIds = new Set<string>(normalizeEmployeeIds(companyRow.accountant_ids));

  mappedUsers.forEach((candidate) => {
    if (candidate.role === "colaborador") {
      employeeIds.add(candidate.id);
    }
    if (candidate.role === "contador") {
      accountantIds.add(candidate.id);
    }
  });

  const progressFromBoards = boards.length ? calculateChecklistProgressFromBoards(boards) : 0;
  const storedProgress = parseChecklistProgress(companyRow.checklist_progress, progressFromBoards);
  const effectiveProgress = boards.length ? progressFromBoards : storedProgress;

  const notifications = buildChecklistNotifications(boards, persistedNotifications);

  void syncSupabaseChecklistNotifications(supabase, companyId, notifications).catch((error) => {
    console.error("[session-sync] syncSupabaseChecklistNotifications failed", serializeSupabaseError(error));
  });

  const company: Company = {
    id: companyRow.id,
    name: companyRow.name ?? ownerRow.full_name ?? "Empresa",
    cnpj: companyRow.cnpj ?? undefined,
    regime: companyRow.regime ?? "Simples Nacional",
    sector: companyRow.sector ?? "Indefinido",
    origin: companyRow.origin ?? undefined,
    ownerId: ownerUserId,
    maturity: mapMaturityLevel(companyRow.maturity ?? null),
    riskLevel: (companyRow.risk_level as NotificationSeverity) ?? "laranja",
    checklistProgress: effectiveProgress,
    employees: Array.from(employeeIds),
    accountantIds: Array.from(accountantIds),
    metadata: (companyRow.metadata as Record<string, unknown>) ?? {},
    checklists: boards,
    notifications,
  };

  const responseBody = {
    success: true,
    data: {
      sessionUserId: ownerUserId,
      users: mappedUsers,
      company,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
