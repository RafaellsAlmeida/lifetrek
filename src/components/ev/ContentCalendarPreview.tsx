import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContentItem {
  id: string;
  title: string;
  category: string;
  status: string;
  updated_at: string;
}

export function ContentCalendarPreview() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: templates, isLoading } = useQuery({
    queryKey: ["content-templates-week"],
  queryFn: async () => {
      const { data, error } = await (supabase
        .from("content_templates" as any)
        .select("id, title, category, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10) as any);
      if (error) throw error;
      return data as ContentItem[];
    }
  });

  const { data: carousels } = useQuery({
    queryKey: ["linkedin-carousels-week"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linkedin_carousels")
        .select("id, topic, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    pending_review: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    published: "bg-purple-100 text-purple-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendário de Conteúdo
        </CardTitle>
        <CardDescription>
          Visão semanal de templates e carrosséis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Week Overview */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg ${
                isSameDay(day, today)
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted/50"
              }`}
            >
              <div className="font-medium">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div className="text-lg">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Recent Templates */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Templates Recentes
          </h4>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando...</div>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-2">
              {templates.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <Badge className={statusColors[item.status] || "bg-gray-100"}>
                    {item.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {item.status === "pending_review" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum template encontrado
            </div>
          )}
        </div>

        {/* Recent Carousels */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Carrosséis LinkedIn
          </h4>
          {carousels && carousels.length > 0 ? (
            <div className="space-y-2">
              {carousels.map((carousel) => (
                <div
                  key={carousel.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{carousel.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(carousel.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge className={statusColors[carousel.status || "draft"] || "bg-gray-100"}>
                    {carousel.status || "draft"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Nenhum carrossel gerado
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full" onClick={() => window.open("/admin/content-approval", "_self")}>
          Ver Todos os Templates
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
