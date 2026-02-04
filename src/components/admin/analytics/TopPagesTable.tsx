import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GA4PageData } from "@/hooks/useGA4Analytics";
import { ExternalLink } from "lucide-react";

interface TopPagesTableProps {
  data: GA4PageData[];
  loading?: boolean;
}

export function TopPagesTable({ data, loading }: TopPagesTableProps) {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getPageLabel = (path: string, title: string) => {
    // Clean up common patterns
    if (path === "/" || path === "/index") return "Página Inicial";
    if (path.includes("/blog/")) return title || "Blog Post";
    if (path.includes("/resources")) return "Recursos";
    if (path.includes("/contact")) return "Contato";
    if (path.includes("/about")) return "Sobre";
    return title || path;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Páginas Mais Visitadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted/20 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Páginas Mais Visitadas</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          Sem dados para o período selecionado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Páginas Mais Visitadas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Página</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Tempo</TableHead>
              <TableHead className="text-right hidden md:table-cell">Bounce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((page, index) => (
              <TableRow key={index}>
                <TableCell className="max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{index + 1}</span>
                    <div className="truncate">
                      <span className="font-medium text-sm">
                        {getPageLabel(page.pagePath, page.pageTitle)}
                      </span>
                      <p className="text-xs text-muted-foreground truncate">
                        {page.pagePath}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {page.pageViews.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                  {formatDuration(page.avgTimeOnPage)}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <span className={page.bounceRate > 0.7 ? "text-red-500" : page.bounceRate > 0.5 ? "text-amber-500" : "text-green-600"}>
                    {(page.bounceRate * 100).toFixed(0)}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
