import { useMemo, useState } from "react";
import {
  MONTHLY_REPORT_OPTIONS,
  MonthlyReportKey,
  useMonthlyMarketingReport,
} from "@/hooks/useMonthlyMarketingReport";
import { MonthlyReviewCadenceCard } from "@/components/admin/analytics/MonthlyReviewCadenceCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { buildMonthlyReviewCadence } from "@/lib/monthlyReviewCadence";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, BarChart3, Eye, FileText, MousePointerClick, TrendingUp, Users } from "lucide-react";
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

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function MonthlyMarketingReport() {
  const [month, setMonth] = useState<MonthlyReportKey>("all");
  type DemoDimension = "industry" | "job_function" | "seniority" | "location" | "company_size";
  const [followerDimension, setFollowerDimension] = useState<DemoDimension>("industry");
  const [visitorDimension, setVisitorDimension] = useState<DemoDimension>("industry");
  const { data, loading, error } = useMonthlyMarketingReport(month);
  const reviewCadence = useMemo(() => buildMonthlyReviewCadence(month), [month]);

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

  const toDemo = (rows: Array<{ label: string; followers: number; percentage: number }>) =>
    rows.map((r) => ({ label: r.label, value: r.followers, percentage: r.percentage }));

  const followerRows = (() => {
    switch (followerDimension) {
      case "industry": return toDemo(data.followers.industries);
      case "job_function": return toDemo(data.followers.jobFunctions);
      case "seniority": return data.followers.seniority;
      case "location": return data.followers.locations;
      case "company_size": return data.followers.companySizes;
    }
  })();

  const visitorRows = (() => {
    switch (visitorDimension) {
      case "industry": return data.visitors.industries;
      case "job_function": return data.visitors.jobFunctions;
      case "seniority": return data.visitors.seniority;
      case "location": return data.visitors.locations;
      case "company_size": return data.visitors.companySizes;
    }
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl">
              {month === "all" ? "Relatório Consolidado: LinkedIn + Website" : "Monthly Report: LinkedIn + Website"}
            </CardTitle>
            <CardDescription>
              {formatMonthLabel(month)}
              {month !== "all" && " • GA4 público (páginas `/admin` excluídas)"}
              {month === "all" && ` • ${data.linkedin.summary.posts} posts • Jan–Mar 2026`}
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

      <MonthlyReviewCadenceCard reviewCadence={reviewCadence} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LinkedIn Posts</CardDescription>
            <CardTitle className="text-2xl">{data.linkedin.summary.posts}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {month === "all" ? "Total de posts no período" : "Posts com métricas no mês"}
          </CardContent>
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
            <CardDescription>Total Reactions</CardDescription>
            <CardTitle className="text-2xl">
              {data.linkedin.posts.reduce((s, p) => s + p.reactions, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Avg {(data.linkedin.posts.reduce((s, p) => s + p.reactions, 0) / Math.max(1, data.linkedin.summary.posts)).toFixed(1)} por post
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weighted CTR</CardDescription>
            <CardTitle className="text-2xl">{formatPct(data.linkedin.summary.weightedCtrPct)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.linkedin.summary.clicks} cliques / {data.linkedin.summary.impressions.toLocaleString()} impressões
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Engagement Rate</CardDescription>
            <CardTitle className="text-2xl">{formatPct(data.linkedin.summary.avgEngagementRatePct)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Média simples entre posts</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Comments</CardDescription>
            <CardTitle className="text-2xl">{data.linkedin.posts.reduce((s, p) => s + p.comments, 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Interações de alto valor</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reposts</CardDescription>
            <CardTitle className="text-2xl">{data.linkedin.posts.reduce((s, p) => s + p.reposts, 0)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Amplificação orgânica</CardContent>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LinkedIn Referral Sessions</CardDescription>
            <CardTitle className="text-2xl">{data.ga4.linkedinReferral.sessions.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.ga4.linkedinReferral.users.toLocaleString()} usuários vindos de linkedin.com
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resources Funnel Views</CardDescription>
            <CardTitle className="text-2xl">{data.ga4.resourcesFunnel.views.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Eventos `resource_view`</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unlock Rate</CardDescription>
            <CardTitle className="text-2xl">{formatPct(data.ga4.resourcesFunnel.unlockRatePct)}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.ga4.resourcesFunnel.unlocks} desbloqueios
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Download / Unlock</CardDescription>
            <CardTitle className="text-2xl">
              {formatPct(data.ga4.resourcesFunnel.downloadRateFromUnlockPct)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {data.ga4.resourcesFunnel.downloads} downloads de recurso
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

      <Card>
        <CardHeader>
          <CardTitle>Format Mix</CardTitle>
          <CardDescription>Comparativo por formato de conteúdo (video/carousel/image/poll/text)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Engaj.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.linkedin.formats.map((row) => (
                  <TableRow key={row.format}>
                    <TableCell className="font-medium uppercase">{row.format}</TableCell>
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

      {data.linkedin.monthlyTrend && data.linkedin.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#004F8F]" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Comparativo mês a mês — Jan a Mar 2026</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.linkedin.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="impressions" name="Impressions" fill="#004F8F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reactions" name="Reactions" fill="#1A7A3E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" name="Clicks" fill="#F07818" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Reactions</TableHead>
                    <TableHead className="text-right">Avg React/Post</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead className="text-right">Reposts</TableHead>
                    <TableHead className="text-right">Avg Engaj.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.linkedin.monthlyTrend.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{row.posts}</TableCell>
                      <TableCell className="text-right">{row.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.clicks}</TableCell>
                      <TableCell className="text-right">{formatPct(row.weightedCtrPct)}</TableCell>
                      <TableCell className="text-right">{row.reactions}</TableCell>
                      <TableCell className="text-right">{row.avgReactionsPerPost.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{row.comments}</TableCell>
                      <TableCell className="text-right">{row.reposts}</TableCell>
                      <TableCell className="text-right">{formatPct(row.avgEngagementRatePct)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-semibold bg-muted/30">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{data.linkedin.summary.posts}</TableCell>
                    <TableCell className="text-right">{data.linkedin.summary.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{data.linkedin.summary.clicks}</TableCell>
                    <TableCell className="text-right">{formatPct(data.linkedin.summary.weightedCtrPct)}</TableCell>
                    <TableCell className="text-right">
                      {data.linkedin.posts.reduce((s, p) => s + p.reactions, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {(data.linkedin.posts.reduce((s, p) => s + p.reactions, 0) / data.linkedin.summary.posts).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.linkedin.posts.reduce((s, p) => s + p.comments, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.linkedin.posts.reduce((s, p) => s + p.reposts, 0)}
                    </TableCell>
                    <TableCell className="text-right">{formatPct(data.linkedin.summary.avgEngagementRatePct)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#004F8F]" />
            Todos os Posts ({data.linkedin.posts.length})
          </CardTitle>
          <CardDescription>
            Performance individual — ordenado por data (mais recente primeiro)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Data</TableHead>
                  <TableHead className="min-w-[200px]">Post</TableHead>
                  <TableHead className="min-w-[90px]">Categoria</TableHead>
                  <TableHead className="min-w-[80px]">Formato</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Reactions</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Reposts</TableHead>
                  <TableHead className="text-right">Engaj.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...data.linkedin.posts]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(post.date)}</TableCell>
                      <TableCell>
                        <span className="text-sm line-clamp-2">{post.title}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap uppercase">
                          {post.postFormat}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{post.impressions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{post.clicks}</TableCell>
                      <TableCell className="text-right">{formatPct(post.ctrPct)}</TableCell>
                      <TableCell className="text-right">{post.reactions}</TableCell>
                      <TableCell className="text-right">{post.comments}</TableCell>
                      <TableCell className="text-right">{post.reposts}</TableCell>
                      <TableCell className="text-right">{formatPct(post.engagementRatePct)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data.followers.growth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1A7A3E]" />
              Follower Growth
            </CardTitle>
            <CardDescription>
              {data.followers.totalFollowers} seguidores totais (snapshot {data.followers.snapshotDate || "indisponível"})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.followers.growth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="newFollowers" name="Novos Seguidores" fill="#1A7A3E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cumulative" name="Acumulado" fill="#004F8F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {data.followers.growth.map((row) => (
                <div key={row.month} className="rounded border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-xl font-semibold text-[#1A7A3E]">+{row.newFollowers}</p>
                  <p className="text-xs text-muted-foreground">acumulado: {row.cumulative}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#004F8F]" />
              Follower Demographics
            </CardTitle>
            <CardDescription>
              {data.followers.totalFollowers} seguidores — snapshot {data.followers.snapshotDate || "indisponível"}
            </CardDescription>
            <div className="pt-2">
              <Select value={followerDimension} onValueChange={(value) => setFollowerDimension(value as typeof followerDimension)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="job_function">Job Function</SelectItem>
                  <SelectItem value="seniority">Seniority</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="company_size">Company Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {followerRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.value} ({row.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-[#004F8F]"
                    style={{ width: `${Math.min(100, row.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#F07818]" />
              Page Visitors
            </CardTitle>
            <CardDescription>
              {data.visitors.totalViews} views ({data.visitors.uniqueViews} únicos) — Jan–Mar 2026
            </CardDescription>
            <div className="pt-2">
              <Select value={visitorDimension} onValueChange={(value) => setVisitorDimension(value as typeof visitorDimension)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry</SelectItem>
                  <SelectItem value="job_function">Job Function</SelectItem>
                  <SelectItem value="seniority">Seniority</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="company_size">Company Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {visitorRows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.value} ({row.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-[#F07818]"
                    style={{ width: `${Math.min(100, row.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
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
