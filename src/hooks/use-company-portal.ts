"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";
import { formatCompanySummary, severityConfig } from "@/lib/dashboard-data";

export function useCompanyPortal(currentPath: string) {
  const router = useRouter();
  const { user, loading, getAccessibleCompanies } = useAuth();

  const company = useMemo(() => {
    if (!user) return null;
    const accessible = getAccessibleCompanies(user.id);
    return accessible.length ? accessible[0] : null;
  }, [getAccessibleCompanies, user]);

  const companySummary = useMemo(() => formatCompanySummary(company), [company]);
  const severity = company ? severityConfig[company.riskLevel] ?? severityConfig.laranja : null;
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (user.role === "contador") {
      router.replace("/app/contador");
      return;
    }
    if (user.role === "colaborador") {
      router.replace("/app/equipe");
      return;
    }
    if (!company) {
      router.replace("/onboarding");
    }
  }, [company, currentPath, loading, router, user]);

  return {
    user,
    company,
    loading,
    companySummary,
    severity,
    checklists: company?.checklists ?? [],
    notifications: company?.notifications ?? [],
  } as const;
}
