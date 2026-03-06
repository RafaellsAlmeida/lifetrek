import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportedLinkedInAnalytics } from "@/hooks/useImportedLinkedInAnalytics";
import { BarChart3, ExternalLink, Loader2, MousePointerClick, MessageCircleHeart, TrendingUp } from "lucide-react";

function formatPeriod(period: string) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

export function ImportedAnalyticsSummary() {
  const { data, loading, error, hasData } = useImportedLinkedInAnalytics();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle>Analytics importados</CardTitle>
          <CardDescription>
            Não foi possível carregar os dados importados de LinkedIn.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!hasData || !data.latestPeriod) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics importados</CardTitle>
          <CardDescription>
            Nenhum dado importado.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Faça o upload do CSV acima para visualizar dados importados.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#0A66C2]" />
                Analytics importados
              </CardTitle>
              <CardDescription>
                Resumo do período mais recente disponível para planejamento editorial.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              Período: {formatPeriod(data.latestPeriod)}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Comentários: {data.summary.totalComments.toLocaleString("pt-BR")} | Compartilhamentos:{" "}
            {data.summary.totalShares.toLocaleString("pt-BR")} | Posts no período:{" "}
            {data.latestPeriodRows.length.toLocaleString("pt-BR")}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impressões</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.totalImpressions.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cliques</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.totalClicks.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reações</CardTitle>
                <MessageCircleHeart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.totalReactions.toLocaleString("pt-BR")}
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engajamento médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercent(data.summary.averageEngagementRate)}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top posts importados</CardTitle>
          <CardDescription>
            Maiores posts do período {formatPeriod(data.latestPeriod)} por impressões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>URL do post</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">Reações</TableHead>
                  <TableHead className="text-right">Engajamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(post.posted_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <a
                        href={post.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 truncate text-[#0A66C2] hover:underline"
                      >
                        <span className="truncate">{post.post_url}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      {post.impressions.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {post.clicks.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {post.reactions.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPercent(post.engagement_rate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
