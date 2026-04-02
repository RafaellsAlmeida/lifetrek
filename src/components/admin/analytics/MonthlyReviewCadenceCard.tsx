import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Download, RotateCcw } from "lucide-react";

import type { MonthlyReviewCadence } from "@/lib/monthlyReviewCadence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

interface MonthlyReviewCadenceCardProps {
  reviewCadence: MonthlyReviewCadence;
}

interface StoredChecklistProgress {
  completedAt: string | null;
  tasks: Record<string, boolean>;
  updatedAt: string | null;
}

type ChecklistStorage = Record<string, StoredChecklistProgress>;

const STORAGE_KEY = "lifetrek_monthly_review_checklist_v1";

function buildEmptyTaskState(reviewCadence: MonthlyReviewCadence) {
  return reviewCadence.tasks.reduce<Record<string, boolean>>((accumulator, task) => {
    accumulator[task.id] = false;
    return accumulator;
  }, {});
}

function readChecklistStorage(): ChecklistStorage {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as ChecklistStorage) : {};
  } catch {
    return {};
  }
}

function writeChecklistStorage(storage: ChecklistStorage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

function formatSavedAt(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClassName(status: MonthlyReviewCadence["status"]) {
  switch (status) {
    case "overdue":
      return "border-red-200 bg-red-50 text-red-700";
    case "due_soon":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-[#004F8F]/20 bg-[#004F8F]/10 text-[#004F8F]";
  }
}

export function MonthlyReviewCadenceCard({ reviewCadence }: MonthlyReviewCadenceCardProps) {
  const [taskState, setTaskState] = useState<Record<string, boolean>>(() => buildEmptyTaskState(reviewCadence));
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  useEffect(() => {
    const storage = readChecklistStorage();
    const saved = storage[reviewCadence.reviewPeriodKey];
    const emptyState = buildEmptyTaskState(reviewCadence);

    setTaskState({
      ...emptyState,
      ...(saved?.tasks || {}),
    });
    setUpdatedAt(saved?.updatedAt || null);
    setCompletedAt(saved?.completedAt || null);
  }, [reviewCadence]);

  const completedCount = useMemo(
    () => reviewCadence.tasks.filter((task) => taskState[task.id]).length,
    [reviewCadence.tasks, taskState],
  );
  const completionPct = reviewCadence.tasks.length > 0 ? (completedCount / reviewCadence.tasks.length) * 100 : 0;
  const allCompleted = completedCount === reviewCadence.tasks.length && reviewCadence.tasks.length > 0;

  const persistState = (nextTaskState: Record<string, boolean>) => {
    const now = new Date().toISOString();
    const isComplete = reviewCadence.tasks.every((task) => nextTaskState[task.id]);
    const storage = readChecklistStorage();

    storage[reviewCadence.reviewPeriodKey] = {
      tasks: nextTaskState,
      updatedAt: now,
      completedAt: isComplete ? now : null,
    };

    writeChecklistStorage(storage);
    setTaskState(nextTaskState);
    setUpdatedAt(now);
    setCompletedAt(isComplete ? now : null);
  };

  const toggleTask = (taskId: string) => {
    persistState({
      ...taskState,
      [taskId]: !taskState[taskId],
    });
  };

  const resetChecklist = () => {
    persistState(buildEmptyTaskState(reviewCadence));
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-[#004F8F]" />
              Cadência de Revisão Mensal
            </CardTitle>
            <CardDescription>
              Revisão de {reviewCadence.reviewPeriodLabel} com fechamento na primeira segunda-feira de{" "}
              {reviewCadence.reviewMonthLabel}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getStatusClassName(reviewCadence.status)}>
              {reviewCadence.statusLabel}
            </Badge>
            <Badge variant="outline">
              {completedCount}/{reviewCadence.tasks.length} concluídas
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">{reviewCadence.reminder}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Data-alvo</p>
                <p className="mt-1 text-sm font-semibold text-[#004F8F]">{reviewCadence.dueDateLabel}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Escopo</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{reviewCadence.reviewPeriodLabel}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{reviewCadence.helperText}</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Fechamento do ciclo</span>
              <span className="text-muted-foreground">{Math.round(completionPct)}%</span>
            </div>
            <Progress value={completionPct} className="mt-3 h-2.5" />

            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>Salvo localmente neste navegador.</p>
              {updatedAt && <p>Última atualização: {formatSavedAt(updatedAt)}</p>}
              {completedAt && <p>Checklist fechado em: {formatSavedAt(completedAt)}</p>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={resetChecklist}>
                <RotateCcw className="h-4 w-4" />
                Resetar checklist
              </Button>
            </div>

            {allCompleted && (
              <div className="mt-4 rounded-md border border-[#1A7A3E]/20 bg-[#1A7A3E]/10 p-3 text-sm text-[#155f31]">
                Revisão operacional concluída para {reviewCadence.reviewPeriodLabel}.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border">
          {reviewCadence.tasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-4 ${index < reviewCadence.tasks.length - 1 ? "border-b" : ""}`}
            >
              <Checkbox
                id={`monthly-review-${reviewCadence.reviewPeriodKey}-${task.id}`}
                checked={Boolean(taskState[task.id])}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-1"
              />

              <div className="flex-1">
                <label
                  htmlFor={`monthly-review-${reviewCadence.reviewPeriodKey}-${task.id}`}
                  className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span>{task.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      task.kind === "manual"
                        ? "border-[#F07818]/20 bg-[#F07818]/10 text-[#9a4d11]"
                        : "border-[#004F8F]/20 bg-[#004F8F]/10 text-[#004F8F]"
                    }
                  >
                    {task.kind === "manual" ? "Manual" : "Admin"}
                  </Badge>
                </label>
                <p className="mt-1 text-sm text-muted-foreground">{task.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed bg-background p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Download className="h-4 w-4 text-[#004F8F]" />
            Sequência operacional recomendada
          </div>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p>1. No LinkedIn Company Page, exporte os XLS de Content, Followers e Visitors do mês fechado.</p>
            <p>2. No admin, valide tráfego `linkedin.com`, top páginas públicas e o funil de `/resources`.</p>
            <p>3. Feche os aprendizados do mês antes de ajustar calendário, CTA de lead magnet e testes do próximo ciclo.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
