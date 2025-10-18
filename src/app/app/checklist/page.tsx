"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ListChecks, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/context/auth-context";
import { useCompanyPortal } from "@/hooks/use-company-portal";
import { analyzeChecklistBoards, calculateChecklistProgressFromBoard } from "@/lib/checklist";
import { severityConfig } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";
import type { ChecklistBoard } from "@/types/platform";

type BoardDialogState =
  | { open: false }
  | {
      open: true;
      mode: "create" | "edit";
      board?: ChecklistBoard;
    };

type BoardFormState = {
  name: string;
  description: string;
  template: "essencial" | "blank";
};

const DEFAULT_BOARD_FORM: BoardFormState = {
  name: "Nova checklist",
  description: "",
  template: "essencial",
};

function formatUpdatedAt(value?: string) {
  if (!value) return "Atualização indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Atualização indisponível";
  return `Atualizado em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

export default function ChecklistPage() {
  const router = useRouter();
  const { createChecklistBoard, updateChecklistBoard, removeChecklistBoard } = useAuth();

  const {
    user,
    company,
    loading,
    severity: companySeverity,
    checklists,
  } = useCompanyPortal("/app/checklist");

  const boards = checklists;
  const [boardDialog, setBoardDialog] = useState<BoardDialogState>({ open: false });
  const [boardForm, setBoardForm] = useState<BoardFormState>(DEFAULT_BOARD_FORM);

  const riskBadge = companySeverity ?? severityConfig.laranja;

  const metrics = useMemo(() => analyzeChecklistBoards(boards), [boards]);
  const completionRate = metrics.totalTasks ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;

  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-content-center gap-3 text-center">
        <ListChecks className="mx-auto h-10 w-10 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Carregando espaço de trabalho</p>
          <p className="text-xs text-muted-foreground">Preparando suas checklists e alertas.</p>
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
          <p className="text-xs text-muted-foreground">Finalize o onboarding para acessar o checklist.</p>
        </div>
      </div>
    );
  }

  const metricsSummary = [
    {
      id: "checklists",
      icon: ListChecks,
      label: "Checklists ativas",
      value: boards.length,
      hint: "Boards prontos para acompanhamento",
    },
    {
      id: "progress",
      icon: TrendingUp,
      label: "Conclusão geral",
      value: `${completionRate}%`,
      hint: `${metrics.completedTasks}/${metrics.totalTasks || 0} tarefas concluídas`,
    },
    {
      id: "critical",
      icon: AlertTriangle,
      label: "Pendências críticas",
      value: metrics.criticalTasks,
      hint: "Severidade vermelha em aberto",
      accent: metrics.criticalTasks ? "text-destructive" : "text-muted-foreground",
    },
    {
      id: "upcoming",
      icon: CalendarClock,
      label: "Próximos 3 dias",
      value: metrics.upcomingThreeDays,
      hint: `${metrics.overdueTasks} vencidas`,
    },
  ];

  const closeBoardDialog = () => {
    setBoardDialog({ open: false });
    setBoardForm(DEFAULT_BOARD_FORM);
  };

  const handleOpenCreateBoard = () => {
    setBoardForm(DEFAULT_BOARD_FORM);
    setBoardDialog({ open: true, mode: "create" });
  };

  const handleOpenEditBoard = (board: ChecklistBoard) => {
    setBoardForm({ name: board.name, description: board.description ?? "", template: "blank" });
    setBoardDialog({ open: true, mode: "edit", board });
  };

  const handleBoardSubmit = () => {
    if (!company || !boardDialog.open) return;

    const name = boardForm.name.trim();
    const description = boardForm.description.trim();

    if (boardDialog.mode === "create") {
      createChecklistBoard(company.id, {
        name: name || "Checklist sem título",
        description: description || undefined,
        template: boardForm.template,
      });
    } else if (boardDialog.mode === "edit" && boardDialog.board) {
      updateChecklistBoard(company.id, boardDialog.board.id, {
        name: name || boardDialog.board.name,
        description: description || undefined,
      });
    }

    closeBoardDialog();
  };

  const handleRemoveBoard = (boardId: string) => {
    if (!company) return;
    removeChecklistBoard(company.id, boardId);
  };

  const handleNavigateToBoard = (boardId: string) => {
    router.push(`/app/checklist/${boardId}`);
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Checklists de acompanhamento</h1>
            <p className="text-sm text-muted-foreground">
              Coordene planos de ação com visão lista, kanban e calendário.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("uppercase text-xs", riskBadge.badge)}>
              {riskBadge.label}
            </Badge>
            <Button size="sm" className="gap-2" onClick={handleOpenCreateBoard}>
              <Plus className="h-4 w-4" /> Nova checklist
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricsSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="border-primary/20">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="space-y-1">
                <p className={cn("text-2xl font-semibold text-foreground", item.accent)}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4">
        <Card className="border-primary/20">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Checklist essencial</span>
              <Badge variant="outline" className="text-[11px] uppercase">
                {boards.length} {boards.length === 1 ? "ativo" : "ativos"}
              </Badge>
            </CardTitle>
            <CardDescription>Visualize todos os planos em andamento e acesse o painel dedicado de cada um.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {boards.length ? (
              <div className="space-y-3">
                {boards.map((board) => {
                  const progressValue = calculateChecklistProgressFromBoard(board);
                  const progress = Math.round(progressValue);
                  return (
                    <div
                      key={board.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleNavigateToBoard(board.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNavigateToBoard(board.id);
                        }
                      }}
                      className="group cursor-pointer rounded-md border border-muted/60 bg-background p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{board.name}</p>
                          {board.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2">{board.description}</p>
                          ) : null}
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {progress}% concluído
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <Progress value={progressValue} className="h-2" />
                        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
                          <span>{board.tasks.length} tarefa(s)</span>
                          <span>{formatUpdatedAt(board.updatedAt)}</span>
                        </div>
                      </div>
                      <div
                        className="mt-4 flex flex-wrap items-center justify-between gap-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleNavigateToBoard(board.id);
                            }}
                          >
                            Abrir plano
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEditBoard(board);
                            }}
                          >
                            Editar
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2 text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveBoard(board.id);
                          }}
                          disabled={boards.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" /> Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-primary/30 bg-muted/30 p-10 text-center text-sm text-muted-foreground">
                Nenhuma checklist cadastrada ainda. Crie um plano para começar.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button size="sm" className="gap-2" onClick={handleOpenCreateBoard}>
              <Plus className="h-4 w-4" /> Criar checklist
            </Button>
          </CardFooter>
        </Card>
      </section>

      <Dialog open={boardDialog.open} onOpenChange={(open) => (!open ? closeBoardDialog() : undefined)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{boardDialog.open && boardDialog.mode === "edit" ? "Editar checklist" : "Nova checklist"}</DialogTitle>
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
            {boardDialog.open && boardDialog.mode === "create" ? (
              <div className="space-y-2">
                <Label>Template inicial</Label>
                <Select
                  value={boardForm.template}
                  onValueChange={(value) => setBoardForm((prev) => ({ ...prev, template: value as BoardFormState["template"] }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essencial">Checklist essencial (tarefas padrão)</SelectItem>
                    <SelectItem value="blank">Começar do zero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeBoardDialog}>
              Cancelar
            </Button>
            <Button onClick={handleBoardSubmit}>
              {boardDialog.open && boardDialog.mode === "edit" ? "Salvar alterações" : "Criar checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
