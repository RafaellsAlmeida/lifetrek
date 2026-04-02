import type { MonthlyReportKey } from "@/hooks/useMonthlyMarketingReport";

export type MonthlyReviewTaskKind = "manual" | "admin";
export type MonthlyReviewCadenceStatus = "upcoming" | "due_soon" | "overdue";

export interface MonthlyReviewTask {
  id: string;
  label: string;
  detail: string;
  kind: MonthlyReviewTaskKind;
}

export interface MonthlyReviewCadence {
  reviewPeriodKey: string;
  reviewPeriodLabel: string;
  reviewMonthLabel: string;
  dueDateIso: string;
  dueDateLabel: string;
  dueInDays: number;
  status: MonthlyReviewCadenceStatus;
  statusLabel: string;
  reminder: string;
  helperText: string;
  tasks: MonthlyReviewTask[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHLY_REVIEW_TASKS: MonthlyReviewTask[] = [
  {
    id: "linkedin-content-xls",
    label: "Exportar XLS de Content no LinkedIn",
    detail: "Company Page > Analytics > Content. Baixar o XLS do período fechado.",
    kind: "manual",
  },
  {
    id: "linkedin-followers-xls",
    label: "Exportar XLS de Followers",
    detail: "Company Page > Analytics > Followers. Garantir snapshot do fechamento mensal.",
    kind: "manual",
  },
  {
    id: "linkedin-visitors-xls",
    label: "Exportar XLS de Visitors",
    detail: "Company Page > Analytics > Visitors. Confirmar indústrias, funções e senioridade.",
    kind: "manual",
  },
  {
    id: "ga4-linkedin-review",
    label: "Revisar referral `linkedin.com` no admin",
    detail: "Conferir sessões e usuários vindos do LinkedIn no Monthly Report.",
    kind: "admin",
  },
  {
    id: "ga4-resources-review",
    label: "Revisar funil de recursos",
    detail: "Validar `resource_view`, desbloqueios e downloads para o mês revisado.",
    kind: "admin",
  },
  {
    id: "monthly-actions-log",
    label: "Registrar decisões operacionais do mês",
    detail: "Fechar aprendizados, ajustes de pauta e próximos testes antes do próximo ciclo.",
    kind: "admin",
  },
];

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatMonthKeyLabel(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  return formatMonthYear(new Date(year, monthIndex, 1));
}

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function getPreviousMonthKey(today: Date) {
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return toMonthKey(previousMonth);
}

function getFirstMonday(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const firstDayOfWeek = firstDay.getDay();
  const daysUntilMonday = (8 - firstDayOfWeek) % 7;
  return new Date(year, monthIndex, 1 + daysUntilMonday);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDueDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildReminder(reviewPeriodLabel: string, reviewMonthLabel: string, dueDateLabel: string, dueInDays: number) {
  if (dueInDays < 0) {
    const daysLate = Math.abs(dueInDays);
    return `A revisão de ${reviewPeriodLabel} venceu há ${daysLate} ${daysLate === 1 ? "dia" : "dias"} (${dueDateLabel}).`;
  }

  if (dueInDays === 0) {
    return `Hoje é a primeira segunda-feira para fechar ${reviewPeriodLabel}.`;
  }

  if (dueInDays <= 7) {
    return `Faltam ${dueInDays} ${dueInDays === 1 ? "dia" : "dias"} para fechar ${reviewPeriodLabel} na primeira segunda-feira de ${reviewMonthLabel}.`;
  }

  return `Reserve a primeira segunda-feira de ${reviewMonthLabel} para revisar ${reviewPeriodLabel}.`;
}

export function buildMonthlyReviewCadence(selectedMonth: MonthlyReportKey, today = new Date()): MonthlyReviewCadence {
  const reviewPeriodKey = selectedMonth === "all" ? getPreviousMonthKey(today) : selectedMonth;
  const [yearStr, monthStr] = reviewPeriodKey.split("-");
  const reviewYear = Number(yearStr);
  const reviewMonthIndex = Number(monthStr) - 1;
  const reviewPeriodDate = new Date(reviewYear, reviewMonthIndex, 1);
  const dueMonthDate = new Date(reviewYear, reviewMonthIndex + 1, 1);
  const dueDate = getFirstMonday(dueMonthDate.getFullYear(), dueMonthDate.getMonth());
  const dueInDays = Math.round((startOfDay(dueDate).getTime() - startOfDay(today).getTime()) / DAY_MS);
  const status: MonthlyReviewCadenceStatus =
    dueInDays < 0 ? "overdue" : dueInDays <= 7 ? "due_soon" : "upcoming";

  return {
    reviewPeriodKey,
    reviewPeriodLabel: formatMonthKeyLabel(reviewPeriodKey),
    reviewMonthLabel: formatMonthYear(dueMonthDate),
    dueDateIso: dueDate.toISOString().slice(0, 10),
    dueDateLabel: formatDueDateLabel(dueDate),
    dueInDays,
    status,
    statusLabel:
      status === "overdue"
        ? "Atrasado"
        : status === "due_soon"
          ? "Janela aberta"
          : "Próximo ciclo",
    reminder: buildReminder(
      formatMonthYear(reviewPeriodDate),
      formatMonthYear(dueMonthDate),
      formatDueDateLabel(dueDate),
      dueInDays,
    ),
    helperText:
      "Os exports do LinkedIn continuam manuais na Company Page. Use este checklist para fechar o ciclo no admin sem depender de memória.",
    tasks: MONTHLY_REVIEW_TASKS,
  };
}
