"use client";

import { use, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar as CalendarIcon, KanbanSquare, ListChecks, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ChecklistTaskCalendar } from "@/components/checklist-task-calendar";

import { useAuth } from "@/context/auth-context";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { checklistStatuses, formatDueDateLabel, groupTasksByStatus } from "@/lib/checklist";
import { severityConfig } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import type {
  ChecklistBoard,
  ChecklistPhase,
  ChecklistTask,
  ChecklistTaskStatus,
  NotificationSeverity,
} from "@/types/platform";
import type { CalendarEvent } from "@/calendar/interfaces";
import type { EventColor } from "@/calendar/types";

const statusLabels: Record<ChecklistTaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const PHASE_ORDER: ChecklistPhase[] = ["Fundamentos", "Planejamento", "Implementação", "Monitoramento"];

const phaseDescriptions: Partial<Record<ChecklistPhase, string>> = {
  Fundamentos:
    "Confirma governança, regimes tributários aplicáveis e habilitações obrigatórias para operar no IBS/CBS.",
  Planejamento:
    "Mapeia escopo de cadastros, comunicação e cenários financeiros antes da execução (quando aplicável).",
  Implementação:
    "Adequa sistemas, integrações oficiais e split payment para atender o leiaute NF-e do IBS/CBS.",
  Monitoramento:
    "Garante obrigações acessórias (NF-e, eventos e créditos) executadas em rotina para dispensa de recolhimento.",
};

const statusBadgeStyles: Record<ChecklistTaskStatus, string> = {
  todo: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/60 dark:bg-slate-500/10 dark:text-slate-200",
  doing: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-200",
  done: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-400/10 dark:text-emerald-200",
};

const TASKS_PER_PAGE_OPTIONS = [6, 9, 12];

function getSeverityBadge(severity: NotificationSeverity) {
  return severityConfig[severity] ?? severityConfig.laranja;
}

const categoryOptions: ChecklistTask["category"][] = ["Planejamento", "Operações", "Compliance"];

const COLOR_TO_SEVERITY: Record<EventColor, NotificationSeverity> = {
  red: "vermelho",
  orange: "laranja",
  green: "verde",
  yellow: "laranja",
  purple: "laranja",
  blue: "laranja",
  gray: "laranja",
};

function formatUpdatedAt(value?: string) {
  if (!value) return "Atualização indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Atualização indisponível";
  return `Atualizado em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

type ViewMode = "lista" | "kanban" | "calendario";

type TaskDialogState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      boardId: string;
      task?: ChecklistTask;
    };

type BoardDialogState =
  | { open: false }
  | {
      open: true;
      board: ChecklistBoard;
    };

type TaskFormState = {
  title: string;
  description: string;
  owner: string;
  severity: NotificationSeverity;
  category: ChecklistTask["category"];
  status: ChecklistTaskStatus;
  dueDate: string;
};

type BoardFormState = {
  name: string;
  description: string;
};

const DEFAULT_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  owner: "",
  severity: "laranja",
  category: "Planejamento",
  status: "todo",
  dueDate: "",
};

export default function ChecklistBoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  const router = useRouter();

  const {
    updateChecklistBoard,
    removeChecklistBoard,
    createChecklistTask,
    updateChecklistTask,
    deleteChecklistTask,
    updateChecklistTaskStatus,
  } = useAuth();

  const {
    user,
    company,
    loading,
    severity: companySeverity,
    checklists,
  } = useCompanyPortal(`/app/checklist/${boardId}`);

  const boards = checklists;
  const board = useMemo(() => boards.find((item) => item.id === boardId) ?? null, [boards, boardId]);

  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>({ open: false });
  const [boardDialog, setBoardDialog] = useState<BoardDialogState>({ open: false });
  const [taskForm, setTaskForm] = useState<TaskFormState>(DEFAULT_TASK_FORM);
  const [boardForm, setBoardForm] = useState<BoardFormState>({ name: "", description: "" });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedOverStatus, setDraggedOverStatus] = useState<ChecklistTaskStatus | null>(null);
  const [tasksPerPage, setTasksPerPage] = useState<number>(TASKS_PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const riskBadge = companySeverity ?? severityConfig.laranja;

  const groupedTasks = useMemo(() => {
    if (!board) return { todo: [], doing: [], done: [] };
    return groupTasksByStatus(board.tasks);
  }, [board]);

  const groupedTasksByPhase = useMemo(() => {
    if (!board) return [] as Array<{ phase: string; tasks: ChecklistTask[] }>;

    const groups = board.tasks.reduce<Map<string, ChecklistTask[]>>((acc, task) => {
      const key = task.phase ?? "Outros";
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key)?.push(task);
      return acc;
    }, new Map());

    const orderedPhases: Array<{ phase: string; tasks: ChecklistTask[] }> = [];

    PHASE_ORDER.forEach((phase) => {
      const items = groups.get(phase);
      if (items?.length) {
        orderedPhases.push({ phase, tasks: items });
        groups.delete(phase);
      }
    });

    groups.forEach((tasks, phase) => {
      orderedPhases.push({ phase, tasks });
    });

    return orderedPhases;
  }, [board]);

  const flattenedTasks = useMemo(
    () =>
      groupedTasksByPhase.flatMap(({ phase, tasks }) =>
        tasks.map((task) => ({ phase, task }))
      ),
    [groupedTasksByPhase]
  );

  const totalTasks = flattenedTasks.length;
  const totalPages = totalTasks ? Math.ceil(totalTasks / tasksPerPage) : 1;
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalTasks ? (effectiveCurrentPage - 1) * tasksPerPage : 0;
  const endIndex = startIndex + tasksPerPage;
  const currentItems = flattenedTasks.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasksPerPage, board?.id]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPhases = useMemo(() => {
    if (!currentItems.length) return [] as Array<{ phase: string; tasks: ChecklistTask[] }>;
    const map = new Map<string, ChecklistTask[]>();
    currentItems.forEach(({ phase, task }) => {
      if (!map.has(phase)) {
        map.set(phase, []);
      }
      map.get(phase)!.push(task);
    });

    return groupedTasksByPhase
      .filter(({ phase }) => map.has(phase))
      .map(({ phase }) => ({ phase, tasks: map.get(phase)! }));
  }, [currentItems, groupedTasksByPhase]);

  const pageRangeStart = totalTasks ? startIndex + 1 : 0;
  const pageRangeEnd = totalTasks ? startIndex + currentItems.length : 0;
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-content-center gap-3 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Carregando checklist</p>
          <p className="text-xs text-muted-foreground">Preparando planos de ação selecionados.</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="grid min-h-[60vh] place-content-center gap-2 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhuma empresa disponível</p>
          <p className="text-xs text-muted-foreground">Finalize o onboarding para acessar os planos.</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="grid min-h-[60vh] place-content-center gap-4 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground">Checklist não encontrado</p>
          <p className="text-sm text-muted-foreground">O checklist que você tentou acessar não existe ou foi removido.</p>
        </div>
        <Button onClick={() => router.push("/app/checklist")}>Voltar para checklists</Button>
      </div>
    );
  }

  const closeTaskDialog = () => {
    setTaskDialog({ open: false });
    setTaskForm(DEFAULT_TASK_FORM);
  };

  const closeBoardDialog = () => {
    setBoardDialog({ open: false });
  };

  const handleOpenEditBoard = () => {
    setBoardForm({ name: board.name, description: board.description ?? "" });
    setBoardDialog({ open: true, board });
  };

  const handleBoardSubmit = () => {
    if (!company || !boardDialog.open) return;

    const name = boardForm.name.trim();
    const description = boardForm.description.trim();

    updateChecklistBoard(company.id, board.id, {
      name: name || board.name,
      description: description || undefined,
    });

    closeBoardDialog();
  };

  const handleRemoveBoard = () => {
    if (!company) return;
    removeChecklistBoard(company.id, board.id);
    router.push("/app/checklist");
  };

  const handleOpenCreateTask = () => {
    setTaskForm({ ...DEFAULT_TASK_FORM, owner: user?.name ?? "Equipe" });
    setTaskDialog({ open: true, mode: "create", boardId: board.id });
  };

  const handleOpenEditTask = (task: ChecklistTask) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      owner: task.owner,
      severity: task.severity,
      category: task.category,
      status: task.status,
      dueDate: task.dueDate ?? "",
    });
    setTaskDialog({ open: true, mode: "edit", boardId: board.id, task });
  };

  const handleTaskSubmit = () => {
    if (!company || !taskDialog.open) return;

    const payload = {
      title: taskForm.title.trim() || "Tarefa sem título",
      description: taskForm.description.trim(),
      owner: taskForm.owner.trim() || "Equipe",
      severity: taskForm.severity,
      category: taskForm.category,
      status: taskForm.status,
      dueDate: taskForm.dueDate ? taskForm.dueDate : undefined,
    };

    if (taskDialog.mode === "create") {
      createChecklistTask(company.id, board.id, payload);
    } else if (taskDialog.task) {
      updateChecklistTask(company.id, board.id, taskDialog.task.id, payload);
    }

    closeTaskDialog();
  };

  const handleDeleteTask = (taskId: string) => {
    if (!company) return;
    deleteChecklistTask(company.id, board.id, taskId);
  };

  const handleStatusChange = (taskId: string, status: ChecklistTaskStatus) => {
    if (!company) return;
    updateChecklistTaskStatus(company.id, board.id, taskId, status);
  };

  const handleDropOnStatus = (status: ChecklistTaskStatus) => {
    if (!draggedTaskId) {
      setDraggedOverStatus(null);
      return;
    }

    const task = board.tasks.find((item) => item.id === draggedTaskId);
    setDraggedOverStatus(null);
    setDraggedTaskId(null);

    if (!task || task.status === status) {
      return;
    }

    handleStatusChange(draggedTaskId, status);
  };

  const mapEventToSeverity = (event: CalendarEvent): NotificationSeverity => {
    return COLOR_TO_SEVERITY[event.color] ?? "laranja";
  };

  const handleCalendarCreate = async (event: CalendarEvent) => {
    if (!company) return;
    const severity = mapEventToSeverity(event);
    const owner = event.user?.name?.trim() || "Equipe";

    createChecklistTask(company.id, board.id, {
      title: event.title.trim() || "Tarefa sem título",
      description: event.description?.trim() || undefined,
      owner,
      severity,
      category: "Planejamento",
      dueDate: event.startDate,
      status: "todo",
    });
  };

  const handleCalendarUpdate = async (event: CalendarEvent) => {
    if (!company) return;
    const severity = mapEventToSeverity(event);
    const owner = event.user?.name?.trim() || "Equipe";

    updateChecklistTask(company.id, board.id, event.id, {
      title: event.title?.trim() || undefined,
      description: event.description?.trim() || undefined,
      owner,
      severity,
      dueDate: event.startDate,
    });
  };

  const handleCalendarDelete = async (event: CalendarEvent) => {
    if (!company) return;
    deleteChecklistTask(company.id, board.id, event.id);
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => router.push("/app/checklist")}
              className="px-2 text-xs text-muted-foreground hover:text-foreground">
              ← Voltar para checklists
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">{board.name}</h1>
            <p className="text-sm text-muted-foreground">Acompanhe e atualize o plano de ação deste checklist.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("uppercase text-xs", riskBadge.badge)}>
              {riskBadge.label}
            </Badge>
            <Button size="sm" variant="outline" className="gap-2" onClick={handleOpenEditBoard}>
              Ajustar checklist
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 text-destructive"
              onClick={handleRemoveBoard}
            >
              <Trash2 className="h-4 w-4" /> Remover
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{board.tasks.length} tarefa(s)</span>
          <span>•</span>
          <span>{formatUpdatedAt(board.updatedAt)}</span>
        </div>
      </header>

      <section className="grid gap-4">
        <Card className="border-primary/30">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Planos de ação</CardTitle>
            <CardDescription>Gerencie as tarefas desta checklist em múltiplas visões.</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={handleOpenCreateTask}>
            <Plus className="h-4 w-4" /> Nova tarefa
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 md:w-fit">
              <TabsTrigger value="lista" className="gap-2">
                <ListChecks className="h-4 w-4" /> Lista
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <KanbanSquare className="h-4 w-4" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="calendario" className="gap-2">
                <CalendarIcon className="h-4 w-4" /> Calendário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lista" className="space-y-4">
              {board.tasks.length ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-muted/40 bg-muted/10 px-4 py-3">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Tarefas
                      </p>
                      <p>
                        Mostrando {pageRangeStart}-{pageRangeEnd} de {totalTasks} tarefas
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Páginas</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={effectiveCurrentPage === 1}
                            aria-label="Página anterior"
                          >
                            ←
                          </Button>
                          {pageNumbers.map((page) => (
                            <Button
                              key={page}
                              size="sm"
                              variant={page === effectiveCurrentPage ? "default" : "outline"}
                              className="h-8 w-8 p-0"
                              onClick={() => setCurrentPage(page)}
                              aria-label={`Ir para página ${page}`}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={effectiveCurrentPage === totalPages}
                            aria-label="Próxima página"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Por página</span>
                        <Select
                          value={String(tasksPerPage)}
                          onValueChange={(value) => setTasksPerPage(Number(value))}
                        >
                          <SelectTrigger className="h-8 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASKS_PER_PAGE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {paginatedPhases.map(({ phase, tasks }) => {
                    const phaseDescription = phaseDescriptions[phase as ChecklistPhase];
                    return (
                      <div key={phase} className="space-y-3 rounded-lg border border-muted/40 bg-muted/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold uppercase text-foreground">{phase}</h3>
                            {phaseDescription ? (
                              <p className="text-xs text-muted-foreground max-w-3xl">{phaseDescription}</p>
                            ) : null}
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {tasks.length} tarefa(s)
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="space-y-3 rounded-md border border-muted/50 bg-background/80 p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                                    <Badge
                                      variant="outline"
                                      className={cn("text-[10px] uppercase", getSeverityBadge(task.severity).badge)}
                                    >
                                      {task.severity}
                                    </Badge>
                                  </div>
                                  {task.description ? (
                                    <p className="text-xs text-muted-foreground max-w-3xl">{task.description}</p>
                                  ) : null}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] uppercase", statusBadgeStyles[task.status])}
                                >
                                  {statusLabels[task.status]}
                                </Badge>
                              </div>
                              <dl className="grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-foreground">Responsável</span>
                                  <span>{task.owner}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-foreground">Pilar</span>
                                  <span>{task.pillar ?? "—"}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-foreground">Prazo</span>
                                  <span>{formatDueDateLabel(task.dueDate)}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-foreground">Categoria</span>
                                  <span>{task.category}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="font-medium text-foreground">Tags</span>
                                  <span>{task.tags?.length ? task.tags.join(", ") : "—"}</span>
                                </div>
                              </dl>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => handleStatusChange(task.id, value as ChecklistTaskStatus)}
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs capitalize">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {checklistStatuses.map((status) => (
                                      <SelectItem key={status} value={status} className="capitalize">
                                        {statusLabels[status]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" className="text-xs" onClick={() => handleOpenEditTask(task)}>
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-destructive"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-primary/30 bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                  Nenhuma tarefa cadastrada ainda. Crie a primeira para iniciar o plano.
                </div>
              )}
            </TabsContent>

            <TabsContent value="kanban">
              <div className="grid gap-4 md:grid-cols-3">
                {checklistStatuses.map((status) => (
                  <div
                    key={status}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border bg-background p-4 transition",
                      draggedOverStatus === status && "border-primary/50 bg-primary/5"
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDraggedOverStatus(status);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDropOnStatus(status);
                    }}
                    onDragLeave={(event) => {
                      const relatedTarget = event.relatedTarget as HTMLElement | null;
                      if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
                        setDraggedOverStatus((current) => (current === status ? null : current));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase text-foreground">{statusLabels[status]}</h3>
                      <Badge variant="outline" className="text-[11px]">
                        {groupedTasks[status]?.length ?? 0}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {groupedTasks[status]?.length ? (
                        groupedTasks[status].map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(task.id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDraggedOverStatus(null);
                            }}
                            className={cn(
                              "rounded-md border border-muted bg-muted/30 p-3 transition",
                              draggedTaskId === task.id && "border-primary/60 opacity-80 shadow-sm"
                            )}
                            aria-grabbed={draggedTaskId === task.id}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">{task.title}</p>
                              <Badge
                                variant="outline"
                                className={cn("uppercase text-[10px]", getSeverityBadge(task.severity).badge)}
                              >
                                {task.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Responsável: {task.owner}</p>
                            <p className="text-xs text-muted-foreground">Prazo: {formatDueDateLabel(task.dueDate)}</p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase",
                                  statusBadgeStyles[task.status]
                                )}
                              >
                                {statusLabels[task.status]}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleOpenEditTask(task)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-destructive"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum item neste estágio.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendario" className="space-y-4">
              <ChecklistTaskCalendar
                tasks={board.tasks}
                onCreateEvent={handleCalendarCreate}
                onUpdateEvent={handleCalendarUpdate}
                onDeleteEvent={handleCalendarDelete}
              />
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Legenda</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f97066]/60 bg-[#2d1519]/70 px-2 py-0.5 text-[10px] uppercase text-[#f97066]">
                  Crítico
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#f6c445]/60 bg-[#2b1e0b]/70 px-2 py-0.5 text-[10px] uppercase text-[#f6c445]">
                  Atenção
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#1cbf93]/60 bg-[#0f2d22]/70 px-2 py-0.5 text-[10px] uppercase text-[#63e2b4]">
                  Monitorar
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>

      </section>

      <Dialog open={boardDialog.open} onOpenChange={(open) => (!open ? closeBoardDialog() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="board-name">Nome</Label>
              <Input
                id="board-name"
                value={boardForm.name}
                onChange={(event) => setBoardForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex: Sprint CBS Outubro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Descrição</Label>
              <Textarea
                id="board-description"
                value={boardForm.description}
                onChange={(event) => setBoardForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Adicione contexto, objetivos ou anotações para quem for executar."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeBoardDialog}>
              Cancelar
            </Button>
            <Button onClick={handleBoardSubmit}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialog.open} onOpenChange={(open) => (!open ? closeTaskDialog() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {taskDialog.open && taskDialog.mode === "edit" ? "Editar tarefa" : "Nova tarefa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ex: Revisar parametrização CBS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Detalhes, anexos ou orientações específicas."
                rows={4}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-owner">Responsável</Label>
                <Input
                  id="task-owner"
                  value={taskForm.owner}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, owner: event.target.value }))}
                  placeholder="Nome ou squad"
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Severidade</Label>
                <Select
                  value={taskForm.severity}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, severity: value as NotificationSeverity }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vermelho">Crítica</SelectItem>
                    <SelectItem value="laranja">Atenção</SelectItem>
                    <SelectItem value="verde">Monitorar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, status: value as ChecklistTaskStatus }))}
                >
                  <SelectTrigger className="text-sm capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pilar</Label>
                <Select
                  value={taskForm.category}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, category: value as ChecklistTask["category"] }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeTaskDialog}>
              Cancelar
            </Button>
            <Button onClick={handleTaskSubmit}>
              {taskDialog.open && taskDialog.mode === "edit" ? "Salvar alterações" : "Adicionar tarefa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
