"use client";

import { useMemo } from "react";
import {
  Bell,
  BellRing,
  CalendarClock,
  Check,
  ClipboardList,
  ListChecks,
  Settings,
  Undo2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { severityConfig } from "@/lib/dashboard-data";
import { formatDueDateLabel } from "@/lib/checklist";
import { cn } from "@/lib/utils";
import type {
  ChecklistNotificationKind,
  ChecklistPriority,
  NotificationSeverity,
} from "@/types/platform";

const menuLinks = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/checklist", label: "Checklist" },
  { href: "/app/relatorios", label: "Relatórios" },
  { href: "/app/curadoria", label: "Curadoria" },
  { href: "/app/timeline", label: "Timeline" },
  { href: "/app/configuracoes", label: "Configurações" },
];

const severityOrder: Record<NotificationSeverity, number> = {
  vermelho: 0,
  laranja: 1,
  verde: 2,
};

const priorityConfig: Record<ChecklistPriority, { label: string; className: string }> = {
  alta: {
    label: "Prioridade alta",
    className: "bg-[#2d1519] text-[#f97066] border-[#f97066]/60",
  },
  media: {
    label: "Prioridade média",
    className: "bg-[#2b1e0b] text-[#f6c445] border-[#f6c445]/60",
  },
  baixa: {
    label: "Prioridade baixa",
    className: "bg-[#102824] text-[#63e2b4] border-[#63e2b4]/60",
  },
};

const notificationKindConfig: Record<ChecklistNotificationKind, { label: string; icon: LucideIcon; className: string }> = {
  task_deadline: {
    label: "Prazo",
    icon: CalendarClock,
    className: "border-amber-500/50 bg-amber-500/10 text-amber-500",
  },
  task_event: {
    label: "Tarefa",
    icon: ListChecks,
    className: "border-sky-500/50 bg-sky-500/10 text-sky-400",
  },
  board_event: {
    label: "Checklist",
    icon: ClipboardList,
    className: "border-violet-500/50 bg-violet-500/10 text-violet-300",
  },
};

const notificationActionStyles: Record<string, { label: string; className: string }> = {
  created: {
    label: "Novo",
    className: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
  },
  updated: {
    label: "Atualização",
    className: "border-sky-500/50 bg-sky-500/10 text-sky-400",
  },
  deleted: {
    label: "Removido",
    className: "border-destructive/60 bg-destructive/10 text-destructive",
  },
  completed: {
    label: "Concluído",
    className: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
  },
  reopened: {
    label: "Reaberto",
    className: "border-amber-500/60 bg-amber-500/10 text-amber-500",
  },
};

const changeLabels: Record<string, string> = {
  owner: "Responsável",
  dueDate: "Prazo",
  priority: "Prioridade",
  severity: "Severidade",
  category: "Categoria",
  pillar: "Pilar",
  phase: "Fase",
  name: "Nome",
  description: "Descrição",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChangeDetail(value: unknown): value is { from: unknown; to: unknown } {
  if (!isRecord(value)) return false;
  return "from" in value && "to" in value;
}

function extractChangeEntries(value: unknown): Array<{ key: string; from: unknown; to: unknown }> {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, detail]) =>
    isChangeDetail(detail) ? [{ key, from: detail.from, to: detail.to }] : []
  );
}

function readString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function formatChangeValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    if (key === "dueDate") return "Sem prazo";
    return "—";
  }

  if (typeof value === "string") {
    if (key === "dueDate") {
      return value ? formatDueDateLabel(value) : "Sem prazo";
    }
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([entryKey, entryValue]) => `${entryKey}: ${String(entryValue)}`)
      .join(", ");
  }

  return String(value);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { markNotificationRead, markAllNotificationsRead } = useAuth();
  const { user, loading, company, notifications } = useCompanyPortal(pathname ?? "/app/dashboard");

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const criticalUnread = useMemo(
    () =>
      notifications.filter((notification) => !notification.read && notification.severity === "vermelho").length,
    [notifications]
  );

  const severityTotals = useMemo(
    () =>
      notifications.reduce<Record<NotificationSeverity, number>>(
        (acc, notification) => {
          acc[notification.severity] += 1;
          return acc;
        },
        { vermelho: 0, laranja: 0, verde: 0 }
      ),
    [notifications]
  );

  const notificationsSorted = useMemo(
    () =>
      [...notifications].sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        if (aDue !== bDue) return aDue - bDue;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [notifications]
  );

  const alertDescription = useMemo(() => {
    if (!unreadCount) {
      return "Nenhum alerta pendente. Tudo em dia!";
    }
    const base = `Você tem ${unreadCount} ${unreadCount === 1 ? "alerta ativo" : "alertas ativos"}`;
    if (!criticalUnread) {
      return `${base}.`;
    }
    return `${base}, sendo ${criticalUnread} crítico${criticalUnread > 1 ? "s" : ""}.`;
  }, [criticalUnread, unreadCount]);

  const handleToggleNotification = (notificationId: string, nextReadState: boolean) => {
    if (!company) return;
    markNotificationRead(company.id, notificationId, nextReadState);
  };

  const handleMarkAllRead = () => {
    if (!company || !notifications.length || !unreadCount) return;
    markAllNotificationsRead(company.id);
  };

  const avatarInitials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return parts[0]!.slice(0, 2).toUpperCase();
      }
      const first = parts[0]?.[0] ?? "";
      const last = parts[parts.length - 1]?.[0] ?? "";
      const combined = `${first}${last}`.toUpperCase();
      return combined || (first || "U").toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "US";
  }, [user?.email, user?.name]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link href="/app/dashboard" className="flex items-center gap-2 text-sm font-semibold">
            RTC • Plataforma 2.0
          </Link>
          <nav className="flex items-center gap-2 overflow-x-auto">
            {menuLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/40"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={loading || !company}
                  className={cn(
                    "relative border border-border/60 bg-background/80 text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary focus-visible:ring-primary/40",
                    unreadCount > 0 && "text-primary"
                  )}
                  aria-label="Abrir centro de alertas CRT-3"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold leading-none text-primary-foreground shadow-md">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="border-border/60 bg-background/95 p-0 sm:max-w-md">
                <SheetHeader className="gap-3 border-b border-border/60 bg-background/95 p-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <SheetTitle className="text-base font-semibold">Centro de alertas CRT-3</SheetTitle>
                      <SheetDescription className="text-xs text-muted-foreground">{alertDescription}</SheetDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(severityTotals) as NotificationSeverity[]).map((severityKey) => {
                        const severity = severityConfig[severityKey] ?? severityConfig.laranja;
                        const total = severityTotals[severityKey];
                        return (
                          <Badge
                            key={severityKey}
                            variant="outline"
                            className={cn("text-[11px] font-semibold uppercase", severity.badge)}
                          >
                            {severity.label} • {total}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs font-semibold text-muted-foreground hover:text-primary"
                        onClick={handleMarkAllRead}
                        disabled={!company || !notifications.length || !unreadCount}
                      >
                        <Check className="size-4" />
                        Marcar tudo como lido
                      </Button>
                    </div>
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto space-y-3 px-4 pb-6 pt-4">
                  {notificationsSorted.length ? (
                    notificationsSorted.map((notification) => {
                      const severityStyle = severityConfig[notification.severity] ?? severityConfig.laranja;
                      const priorityKey = (notification.priority ?? "media") as ChecklistPriority;
                      const priorityStyle = priorityConfig[priorityKey];
                      const dueLabel = notification.dueDate ? formatDueDateLabel(notification.dueDate) : "Sem prazo";
                      const dueDateValue = notification.dueDate ? new Date(notification.dueDate).getTime() : null;
                      const isOverdue = typeof dueDateValue === "number" ? dueDateValue < Date.now() : false;
                      const isUnread = !notification.read;

                      const metadata = isRecord(notification.metadata) ? (notification.metadata as Record<string, unknown>) : ({} as Record<string, unknown>);
                      const kindStyle = notificationKindConfig[notification.kind] ?? {
                        label: "Alerta",
                        icon: Bell,
                        className: "border-border/60 bg-muted/40 text-muted-foreground",
                      };
                      const KindIcon = kindStyle.icon;

                      const actionKey = readString(metadata, "action");
                      const actionStyle = actionKey
                        ? notificationActionStyles[actionKey] ?? {
                            label: actionKey.charAt(0).toUpperCase() + actionKey.slice(1),
                            className: "border-border/60 bg-muted/40 text-muted-foreground",
                          }
                        : null;

                      const boardName = readString(metadata, "boardName");
                      const ownerName = readString(metadata, "owner");
                      const categoryName = readString(metadata, "category");
                      const changeEntries = extractChangeEntries(metadata["changes"]);

                      return (
                        <article
                          key={notification.id}
                          className={cn(
                            "rounded-lg border p-4 transition-colors",
                            isUnread
                              ? "border-primary/60 bg-primary/5 shadow-[0_0_32px_-22px_rgba(17,144,216,0.65)]"
                              : "border-border/60 bg-background/80"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn("text-[11px] font-semibold uppercase", severityStyle.badge)}
                                >
                                  {severityStyle.label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1 text-[11px] font-semibold uppercase",
                                    kindStyle.className
                                  )}
                                >
                                  <KindIcon className="size-3.5" />
                                  {kindStyle.label}
                                </Badge>
                                {actionStyle && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[11px] font-semibold uppercase", actionStyle.className)}
                                  >
                                    {actionStyle.label}
                                  </Badge>
                                )}
                                {notification.priority && (
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[11px] font-medium uppercase", priorityStyle.className)}
                                  >
                                    {priorityStyle.label}
                                  </Badge>
                                )}
                                {isUnread && (
                                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                    Pendente
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                {boardName && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    Checklist: {boardName}
                                  </Badge>
                                )}
                                {ownerName && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    Responsável: {ownerName}
                                  </Badge>
                                )}
                                {categoryName && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    Categoria: {categoryName}
                                  </Badge>
                                )}
                                {notification.phase && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    Fase: {notification.phase}
                                  </Badge>
                                )}
                                {notification.pillar && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    {notification.pillar}
                                  </Badge>
                                )}
                                {notification.dueDate && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "border-border/50 bg-muted/40 text-muted-foreground",
                                      isOverdue
                                        ? "border-destructive/60 bg-destructive/15 text-destructive"
                                        : "border-primary/40 bg-primary/10 text-primary"
                                    )}
                                  >
                                    {`${isOverdue ? "Atrasado" : "Prazo"}: ${dueLabel}`}
                                  </Badge>
                                )}
                                {!notification.dueDate && (
                                  <Badge
                                    variant="outline"
                                    className="border-border/50 bg-muted/40 text-muted-foreground"
                                  >
                                    Sem prazo definido
                                  </Badge>
                                )}
                              </div>
                              {changeEntries.length ? (
                                <div className="space-y-1 rounded-md border border-border/50 bg-muted/20 p-3 text-[11px] text-muted-foreground">
                                  <p className="text-[11px] font-semibold uppercase text-foreground/80">
                                    Alterações registradas
                                  </p>
                                  <ul className="ml-4 list-disc space-y-1">
                                    {changeEntries.map((change) => {
                                      const label = changeLabels[change.key] ?? change.key;
                                      return (
                                        <li key={`${notification.id}-${change.key}`}>
                                          <span className="font-medium text-foreground">{label}:</span>{" "}
                                          <span>
                                            {formatChangeValue(change.key, change.from)} → {formatChangeValue(change.key, change.to)}
                                          </span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className={cn(
                                "border border-transparent text-muted-foreground hover:text-primary",
                                isUnread ? "hover:bg-primary/10" : "hover:bg-accent"
                              )}
                              onClick={() => handleToggleNotification(notification.id, !notification.read)}
                              aria-label={notification.read ? "Marcar como não lido" : "Marcar como lido"}
                            >
                              {notification.read ? <Undo2 className="size-4" /> : <Check className="size-4" />}
                            </Button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                      <BellRing className="size-10 text-primary/70" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Nenhum alerta por aqui</p>
                        <p className="text-xs text-muted-foreground">
                          Monitore as tarefas da checklist CRT-3 para manter tudo em dia.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <SheetFooter className="border-t border-border/60 bg-background/95 p-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/app/checklist" className="flex w-full items-center justify-center gap-2">
                      <ClipboardList className="size-4" />
                      Abrir checklist CRT-3
                    </Link>
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="group size-10 rounded-full border border-border/60 p-0 transition hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-primary/30"
                  aria-label="Abrir menu da conta"
                  disabled={loading}
                >
                  <Avatar className="size-9 border border-transparent">
                    <AvatarFallback
                      className={cn(
                        "bg-primary/5 text-xs font-semibold uppercase text-primary",
                        loading && "animate-pulse text-primary/70"
                      )}
                    >
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Logado como</span>
                    <span className="text-sm font-semibold text-foreground">
                      {user?.name ?? user?.email ?? "Usuário RTC"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => router.push("/app/configuracoes")}
                  className="cursor-pointer"
                >
                  <Settings className="size-4" /> Configurações da empresa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => router.push("/app/configuracoes#usuarios")}
                  className="cursor-pointer"
                >
                  <UserPlus className="size-4" /> Adicionar usuário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 lg:px-8">{children}</main>
    </div>
  );
}
