import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, CalendarIcon, Linkedin, FileText, Clock, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type CalendarScope = 'company' | 'mine';

interface ScheduledItem {
  id: string;
  type: 'linkedin' | 'blog';
  title: string;
  status: string;
  scheduled_for: string | null;
  created_at: string;
  full_data?: any;
}

export default function ContentCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<ScheduledItem | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scope, setScope] = useState<CalendarScope>('company');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
    },
  });

  // Fetch approved/draft content that can be scheduled
  const { data: linkedInItems, isLoading: loadingLinkedIn } = useQuery({
    queryKey: ['calendar-linkedin', scope, me?.id],
    queryFn: async () => {
      let q = supabase
        .from('linkedin_carousels')
        .select('id, topic, status, scheduled_date, created_at, admin_user_id')
        .in('status', ['draft', 'approved', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (scope === 'mine' && me?.id) {
        q = q.eq('admin_user_id', me.id);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        type: 'linkedin' as const,
        title: item.topic,
        status: item.status || 'draft',
        scheduled_for: item.scheduled_date,
        created_at: item.created_at,
        full_data: item,
      }));
    }
  });

  const { data: blogItems, isLoading: loadingBlogs } = useQuery({
    queryKey: ['calendar-blogs', scope, me?.email],
    queryFn: async () => {
      let q = supabase
        .from('blog_posts')
        .select('id, title, status, metadata, created_at, author_name')
        .in('status', ['draft', 'pending_review', 'approved', 'scheduled', 'published'])
        .order('created_at', { ascending: false });

      if (scope === 'mine' && me?.email) {
        q = q.eq('author_name', me.email);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        type: 'blog' as const,
        title: item.title,
        status: item.status,
        scheduled_for: (item as any)?.metadata?.target_date || null,
        created_at: item.created_at,
        full_data: item,
      }));
    }
  });

  // Mutation to schedule content
  const scheduleMutation = useMutation({
    mutationFn: async ({ item, date }: { item: ScheduledItem; date: Date | null }) => {
      if (item.type === 'linkedin') {
        const { error } = await supabase
          .from('linkedin_carousels')
          .update({ scheduled_date: date?.toISOString() || null } as any)
          .eq('id', item.id);
        if (error) throw error;
        return;
      }

      // blog_posts does not have scheduled_date in prod yet; store schedule in metadata.target_date.
      const currentMetadata = (item.full_data as any)?.metadata || {};
      const nextMetadata = {
        ...currentMetadata,
        target_date: date?.toISOString() || null,
      };

      const { error } = await supabase
        .from('blog_posts')
        .update({ metadata: nextMetadata } as any)
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-linkedin'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-blogs'] });
      toast.success("Agendamento atualizado!");
      setSelectedItem(null);
      setIsScheduling(false);
    },
    onError: (error) => {
      toast.error("Erro ao agendar: " + (error as Error).message);
    }
  });

  // Combine all items
  const allItems = useMemo(() => {
    return [...(linkedInItems || []), ...(blogItems || [])];
  }, [linkedInItems, blogItems]);

  // Items without schedule (backlog)
  const unscheduledItems = useMemo(() => {
    return allItems.filter(item => !item.scheduled_for);
  }, [allItems]);

  // Get week days
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get items for a specific day
  const getItemsForDay = (day: Date) => {
    return allItems.filter(item => {
      if (!item.scheduled_for) return false;
      return isSameDay(parseISO(item.scheduled_for), day);
    });
  };

  const handleSchedule = (item: ScheduledItem, date: Date) => {
    scheduleMutation.mutate({ item, date });
  };

  const handleUnschedule = (item: ScheduledItem) => {
    scheduleMutation.mutate({ item, date: null });
  };

  const isLoading = loadingLinkedIn || loadingBlogs;

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário de Conteúdo</h1>
            <p className="text-muted-foreground">
              Organize quando publicar cada conteúdo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={scope} onValueChange={(v) => setScope(v as CalendarScope)}>
            <TabsList>
              <TabsTrigger value="company">Empresa</TabsTrigger>
              <TabsTrigger value="mine">Meu</TabsTrigger>
            </TabsList>
          </Tabs>

          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Clock className="h-4 w-4 mr-2" />
            {unscheduledItems.length} não agendado(s)
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Backlog - Unscheduled Items */}
        <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Backlog</CardTitle>
              <p className="text-sm text-muted-foreground">Clique no item para agendar</p>
            </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : unscheduledItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum conteúdo pendente
              </div>
            ) : (
              unscheduledItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                    selectedItem?.id === item.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedItem(item)}
                >
                    <div className="flex items-start gap-2">
                      {item.type === 'linkedin' ? (
                        <Linkedin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selectedItem?.id === item.id && (
                    <div className="mt-3 pt-3 border-t">
                      <Popover open={isScheduling} onOpenChange={setIsScheduling}>
                        <PopoverTrigger asChild>
                          <Button size="sm" className="w-full">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Agendar
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={undefined}
                              onSelect={(date) => date && handleSchedule(item, date)}
                              locale={ptBR}
                            />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Semana de {format(weekStart, "d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                  Hoje
                </Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {weekDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "text-center p-2 rounded-t-lg font-medium text-sm",
                    isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
                  )}
                >
                  <div>{format(day, "EEE", { locale: ptBR })}</div>
                  <div className="text-lg">{format(day, "d")}</div>
                </div>
              ))}

              {/* Day Content */}
              {weekDays.map(day => {
                const dayItems = getItemsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date() && !isToday;
                
                return (
                  <div
                    key={`content-${day.toISOString()}`}
                    className={cn(
                      "min-h-[150px] border rounded-b-lg p-2 space-y-1",
                      isToday && "border-primary bg-primary/5",
                      isPast && "opacity-60"
                    )}
                  >
                    {dayItems.map(item => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className={cn(
                          "p-2 rounded text-xs group relative",
                          "bg-muted text-foreground"
                        )}
                      >
                        <div className="flex items-start gap-1">
                          {item.type === 'linkedin' ? (
                            <Linkedin className="h-3 w-3 mt-0.5 shrink-0" />
                          ) : (
                            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          )}
                          <span className="truncate flex-1">{item.title}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleUnschedule(item)}
                          >
                            <span className="sr-only">Remover do dia</span>
                            <span aria-hidden>×</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {dayItems.length === 0 && !isPast && (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                        Vazio
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Items Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allItems
              .filter(item => item.scheduled_for && parseISO(item.scheduled_for) >= new Date())
              .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())
              .slice(0, 6)
              .map(item => (
                <div
                  key={`scheduled-${item.type}-${item.id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {item.type === 'linkedin' ? (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Linkedin className="h-5 w-5 text-foreground" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(item.scheduled_for!), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnschedule(item)}
                    className="shrink-0"
                  >
                    <span className="sr-only">Remover agendamento</span>
                    <span aria-hidden>×</span>
                  </Button>
                </div>
              ))}
            {allItems.filter(item => item.scheduled_for && parseISO(item.scheduled_for) >= new Date()).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Nenhum conteúdo agendado ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
