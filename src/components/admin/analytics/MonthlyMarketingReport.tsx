import { useMemo, useState } from "react";
import {
  MONTHLY_REPORT_OPTIONS,
  MonthlyReportKey,
  useMonthlyMarketingReport,
} from "@/hooks/useMonthlyMarketingReport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, BarChart3, Eye, MousePointerClick, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s`;
}

function formatMonthLabel(month: MonthlyReportKey) {
  return MONTHLY_REPORT_OPTIONS.find((option) => option.key === month)?.label ?? month;
}

export function MonthlyMarketingReport() {
  const [month, setMonth] = useState<MonthlyReportKey>("2026-02");
  const [followerDimension, setFollowerDimension] = useState<"industry" | "job_function">("industry");
  const { data, loading, error } = useMonthlyMarketingReport(month);

  const categoryChartData = useMemo(
    () =>
      (data?.linkedin.categories || []).map((row) => ({
        name: row.category.replace(" & ", "\n"),
        ctr: Number(row.weightedCtrPct.toFixed(2)),
        engagement: Number(row.avgEngagementRatePct.toFixed(2)),
      })),
    [data?.linkedin.categories],
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Report</CardTitle>
          <CardDescription>Carregando relatório mensal...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="h-20 rounded bg-muted/30 animate-pulse" />
          <div className="h-20 rounded bg-muted/30 animate-pulse" />
          <div className="h-20 rounded bg-muted/30 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Monthly Report
          </CardTitle>
          <CardDescription>
            Não foi possível carregar o relatório mensal.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {error?.message || "Sem dados disponíveis."}
        </CardContent>
      </Card>
    );
  }

  const followerRows =
    followerDimension === "industry" ? data.followers.industries : data.followers.jobFunctions;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">Monthly Report: LinkedIn + Website</CardTitle>
            <CardDescription>
              {formatMonthLabel(month)} • GA4 público (páginas `/admin` excluídas)
            </CardDescription>
          </div>
          <Select value={month} onValueChange={(value) => setMonth(value as MonthlyReportKey)}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHLY_REPORT_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LinkedIn Posts</CardDescription>
            <CardTitle className="text-2xl">{data.linkedin.summary.posts}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Posts com métricas no mês</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LinkedIn Impressions</CardDescription>
            <CardTitle className="text-2xl">{data.linkedin.summary.impressions.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Alcance orgânico registrado</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weighted CTR</CardDescription>
            <CardTitle className="text-2xl">{formatPct(data.linkedin.summary.weightedCtrPct)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Cliques / impressões do mês</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>GA4 Public Page Views</CardDescription>
            <CardTitle className="text-2xl">{data.ga4.publicPageViews.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Apenas páginas públicas (sem `/admin`)
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#004F8F]" />
              Topic Categories (5)
            </CardTitle>
            <CardDescription>Performance por categoria de conteúdo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="ctr" name="CTR (%)" fill="#004F8F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Engaj.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.linkedin.categories.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="font-medium">{row.category}</TableCell>
                      <TableCell className="text-right">{row.posts}</TableCell>
                      <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatPct(row.weightedCtrPct)}</TableCell>
                      <TableCell className="text-right">{formatPct(row.avgEngagementRatePct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ICP Breakdown</CardTitle>
            <CardDescription>Quais perfis responderam melhor por conteúdo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ICP Principal</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Engaj.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.linkedin.icps.map((row) => (
                    <TableRow key={row.icp}>
                      <TableCell className="font-medium">{row.icp}</TableCell>
                      <TableCell className="text-right">{row.posts}</TableCell>
                      <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatPct(row.weightedCtrPct)}</TableCell>
                      <TableCell className="text-right">{formatPct(row.avgEngagementRatePct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#004F8F]" />
              Follower Demographics
            </CardTitle>
            <CardDescription>
              Industry snapshot {data.followers.snapshotDate || "indisponível"}
            </CardDescription>
            <div className="pt-2">
              <Select value={followerDimension} onValueChange={(value) => setFollowerDimension(value as "industry" | "job_function")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="job_function">Job Function</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {followerRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados de follower demographics.</p>
            ) : (
              followerRows.map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.followers} ({row.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-[#004F8F]"
                      style={{ width: `${Math.min(100, row.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#004F8F]" />
              GA4 Public Traffic
            </CardTitle>
            <CardDescription>Páginas do usuário real (rotas admin removidas)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Public Pages Tracked</p>
                <p className="text-xl font-semibold">{data.ga4.publicPagesTracked}</p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Avg Time on Page</p>
                <p className="text-xl font-semibold">{formatDuration(data.ga4.avgTimeOnPageSeconds)}</p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Avg Bounce Rate</p>
                <p className="text-xl font-semibold">{(data.ga4.avgBounceRate * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Total Clicks (LinkedIn)</p>
                <p className="text-xl font-semibold">{data.linkedin.summary.clicks.toLocaleString()}</p>
              </div>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.ga4.dailyPublicViews}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="pageViews" name="Page Views" stroke="#004F8F" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-[#004F8F]" />
            Top Public Pages
          </CardTitle>
          <CardDescription>GA4 com exclusão de rotas admin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Página</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                  <TableHead className="text-right">Bounce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ga4.topPublicPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Sem dados de páginas públicas para este mês.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.ga4.topPublicPages.map((page) => (
                    <TableRow key={page.pagePath}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{page.pagePath}</Badge>
                          <span className="text-sm text-muted-foreground truncate">{page.pageTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{page.pageViews.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatDuration(page.avgTimeOnPageSeconds)}</TableCell>
                      <TableCell className="text-right">{(page.bounceRate * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
