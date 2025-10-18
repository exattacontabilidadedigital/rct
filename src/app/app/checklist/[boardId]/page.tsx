"use client";

import { use, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  KanbanSquare,
  ListChecks,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/context/auth-context";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { buildMonthlyCalendar, checklistStatuses, formatDueDateLabel, groupTasksByStatus } from "@/lib/checklist";
import { severityConfig } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import type { ChecklistBoard, ChecklistTask, ChecklistTaskStatus, NotificationSeverity } from "@/types/platform";

const statusLabels: Record<ChecklistTaskStatus, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluída",
};

const categoryOptions: ChecklistTask["category"][] = ["Planejamento", "Operações", "Compliance"];

function getSeverityBadge(severity: NotificationSeverity) {
  return severityConfig[severity] ?? severityConfig.laranja;
}

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

  const riskBadge = companySeverity ?? severityConfig.laranja;

  const groupedTasks = useMemo(() => {
    if (!board) return { todo: [], doing: [], done: [] };
    return groupTasksByStatus(board.tasks);
  }, [board]);

  const calendarEntries = useMemo(() => {
    if (!board) return [];
    return buildMonthlyCalendar(board.tasks);
  }, [board]);

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
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[36%]">Tarefa</TableHead>
                      <TableHead>Pilar</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.tasks.length ? (
                      board.tasks.map((task) => (
                        <TableRow key={task.id} className="border-muted/40">
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                <Badge
                                  variant="outline"
                                  className={cn("uppercase text-[10px]", getSeverityBadge(task.severity).badge)}
                                >
                                  {task.severity}
                                </Badge>
                              </div>
                              {task.description ? (
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{task.category}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{task.owner}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDueDateLabel(task.dueDate)}</TableCell>
                          <TableCell>
                            <Select
                              value={task.status}
                              onValueChange={(value) => handleStatusChange(task.id, value as ChecklistTaskStatus)}
                            >
                              <SelectTrigger className="h-8 text-xs capitalize">
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
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
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
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                          Nenhuma tarefa cadastrada ainda. Crie a primeira para iniciar o plano.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
                              <Select
                                value={task.status}
                                onValueChange={(value) => handleStatusChange(task.id, value as ChecklistTaskStatus)}
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs capitalize">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {checklistStatuses.map((candidate) => (
                                    <SelectItem key={candidate} value={candidate} className="capitalize">
                                      {statusLabels[candidate]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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

            <TabsContent value="calendario">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {calendarEntries.map((entry) => (
                  <div key={entry.date} className="rounded-lg border bg-background p-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-medium uppercase text-muted-foreground">
                      <span>
                        {new Date(entry.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.tasks.length}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-2">
                      {entry.tasks.length ? (
                        entry.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="rounded border border-primary/20 bg-primary/5 p-2">
                            <p className="text-xs font-medium text-foreground">{task.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {statusLabels[task.status]} • {task.owner}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Sem tarefas</p>
                      )}
                      {entry.tasks.length > 3 ? (
                        <p className="text-[11px] text-muted-foreground">+{entry.tasks.length - 3} tarefa(s)</p>
                      ) : null}
                    </div>
                  </div>
                ))}
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
