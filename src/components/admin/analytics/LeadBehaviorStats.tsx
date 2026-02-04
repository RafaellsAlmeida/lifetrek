import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, Users, TrendingUp, TrendingDown, BookOpen, Calculator, MousePointerClick } from "lucide-react";
import type { InternalAnalyticsData } from "@/hooks/useInternalAnalytics";

interface LeadBehaviorStatsProps {
  data: InternalAnalyticsData | null;
  loading: boolean;
}

export function LeadBehaviorStats({ data, loading }: LeadBehaviorStatsProps) {
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { stats, statsGrowth, resources, leads } = data;

  const formatGrowth = (value: number | undefined) => {
    if (value === undefined) return null;
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(value).toFixed(0)}%
      </span>
    );
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "form_submission": return "Formulário";
      case "chatbot_lead_captured": return "Chatbot";
      case "lead_magnet_usage": return "Lead Magnet";
      default: return source;
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "form_submission": return "bg-blue-100 text-blue-800";
      case "chatbot_lead_captured": return "bg-purple-100 text-purple-800";
      case "lead_magnet_usage": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Capturados</CardTitle>
            <Users className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsCaptures}</div>
            <div className="flex items-center gap-2">
              {formatGrowth(statsGrowth.leadsCaptures)}
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos Visualizados</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resourceViews}</div>
            <div className="flex items-center gap-2">
              {formatGrowth(statsGrowth.resourceViews)}
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Chatbot</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.chatbotMessages}</div>
            <div className="flex items-center gap-2">
              {formatGrowth(statsGrowth.chatbotMessages)}
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques em CTAs</CardTitle>
            <MousePointerClick className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ctaClicks}</div>
            <p className="text-xs text-muted-foreground">
              Calculadora: {stats.calculatorCompletes}/{stats.calculatorStarts} completas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recursos Mais Acessados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum dado de recursos ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recurso</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Leituras</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.slice(0, 5).map((res) => (
                    <TableRow key={res.slug}>
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {res.title}
                      </TableCell>
                      <TableCell className="text-right">{res.views}</TableCell>
                      <TableCell className="text-right">
                        {res.reads}
                        {res.avgReadPercentage > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.round(res.avgReadPercentage)}%)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum lead capturado ainda
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Fonte</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.slice(0, 5).map((lead) => (
                    <TableRow key={lead.email}>
                      <TableCell>
                        <div>
                          <span className="font-medium truncate max-w-[150px] block">
                            {lead.email}
                          </span>
                          {lead.companyName && (
                            <span className="text-xs text-muted-foreground">
                              {lead.companyName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSourceBadgeColor(lead.source)} variant="secondary">
                          {getSourceLabel(lead.source)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
