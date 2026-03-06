// @ts-nocheck
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, FileText, GripVertical, Linkedin, Plus } from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useNavigate } from "react-router-dom";

interface CalendarItem {
  id: string;
  title: string;
  type: "linkedin" | "blog";
  status: string;
  scheduled_for: string | null;
  thumbnailUrl: string | null;
  isBacklog: boolean;
}

function getLinkedInThumbnail(item: { image_urls?: unknown; slides?: unknown }) {
  if (Array.isArray(item.image_urls)) {
    const firstUrl = item.image_urls.find((value) => typeof value === "string" && value.length > 0);
    if (typeof firstUrl === "string") return firstUrl;
  }

  if (Array.isArray(item.slides)) {
    const firstSlide = item.slides[0];
    if (firstSlide && typeof firstSlide === "object") {
      const slide = firstSlide as Record<string, unknown>;
      const imageUrl = slide.image_url || slide.imageUrl;
      if (typeof imageUrl === "string" && imageUrl.length > 0) return imageUrl;
    }
  }

  return null;
}

export default function ContentCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const calendarDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }),
      }),
    [monthStart],
  );

  const weekdayHeaders = useMemo(
    () => Array.from({ length: 7 }, (_, index) => format(calendarDays[index], "EEE", { locale: ptBR })),
    [calendarDays],
  );

  const { data: items, isLoading } = useQuery({
    queryKey: ["calendar_items_monthly"],
    queryFn: async () => {
      const [linkedinRes, blogRes] = await Promise.all([
        supabase
          .from("linkedin_carousels")
          .select("id, topic, status, created_at, scheduled_date, image_urls, slides")
          .not("status", "eq", "archived"),
        supabase
          .from("blog_posts")
          .select("id, title, status, created_at, published_at, metadata, featured_image, hero_image_url")
          .not("status", "eq", "rejected"),
      ]);

      if (linkedinRes.error) throw linkedinRes.error;
      if (blogRes.error) throw blogRes.error;

      const linkedinItems: CalendarItem[] = (linkedinRes.data || []).map((item) => ({
        id: item.id,
        title: item.topic,
        type: "linkedin",
        status: item.status || "draft",
        scheduled_for: item.scheduled_date || null,
        thumbnailUrl: getLinkedInThumbnail(item),
        isBacklog: !item.scheduled_date,
      }));

      const blogItems: CalendarItem[] = (blogRes.data || []).map((item) => {
        const metadata = (item.metadata || {}) as Record<string, unknown>;
        const targetDate = typeof metadata.target_date === "string" ? metadata.target_date : null;

        return {
          id: item.id,
          title: item.title,
          type: "blog",
          status: item.status || "draft",
          scheduled_for: targetDate || item.published_at || null,
          thumbnailUrl: item.featured_image || item.hero_image_url || null,
          isBacklog: !targetDate && !item.published_at,
        };
      });

      return [...linkedinItems, ...blogItems];
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({
      id,
      date,
      type,
      action,
    }: {
      id: string;
      date: string | null;
      type: "linkedin" | "blog";
      action: "schedule" | "unschedule";
    }) => {
      if (type === "linkedin") {
        const { data: current, error: fetchError } = await supabase
          .from("linkedin_carousels")
          .select("status")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const currentStatus = current?.status || null;
        const nextStatus =
          currentStatus === "published"
            ? currentStatus
            : date
              ? currentStatus === "approved" || currentStatus === "scheduled"
                ? "scheduled"
                : currentStatus
              : currentStatus === "scheduled"
                ? "approved"
                : currentStatus;

        const patch: Record<string, unknown> = { scheduled_date: date };
        if (nextStatus && nextStatus !== currentStatus) {
          patch.status = nextStatus;
        }

        const { error } = await supabase
          .from("linkedin_carousels")
          .update(patch as never)
          .eq("id", id);

        if (error) throw error;
        return;
      }

      const { data: current, error: fetchError } = await supabase
        .from("blog_posts")
        .select("metadata, status")
        .eq("id", id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentMetadata = ((current as { metadata?: Record<string, unknown> } | null)?.metadata || {}) as Record<
        string,
        unknown
      >;

      const nextMetadata = { ...currentMetadata } as Record<string, unknown>;
      if (date) {
        nextMetadata.target_date = date;
      } else {
        delete nextMetadata.target_date;
      }

      const currentStatus = current?.status || null;
      const nextStatus =
        currentStatus === "published"
          ? currentStatus
          : date
            ? currentStatus === "approved" || currentStatus === "scheduled"
              ? "scheduled"
              : currentStatus
            : currentStatus === "scheduled"
              ? "approved"
              : currentStatus;

      const patch: Record<string, unknown> = { metadata: nextMetadata };
      if (nextStatus && nextStatus !== currentStatus) {
        patch.status = nextStatus;
      }

      const { error } = await supabase.from("blog_posts").update(patch as never).eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["calendar_items_monthly"] });
      toast.success(variables.action === "unschedule" ? "Conteúdo movido para backlog." : "Conteúdo reagendado.");
    },
    onError: () => {
      toast.error("Não foi possível atualizar o calendário.");
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const [itemType, itemId] = draggableId.split(":");
    if (!itemType || !itemId) return;

    if (destination.droppableId === "backlog") {
      scheduleMutation.mutate({
        id: itemId,
        date: null,
        type: itemType as "linkedin" | "blog",
        action: "unschedule",
      });
      return;
    }

    if (!destination.droppableId.startsWith("day-")) return;

    const targetDateKey = destination.droppableId.replace("day-", "");
    const [year, month, day] = targetDateKey.split("-").map((value) => Number(value));
    if (!year || !month || !day) return;
    // Use midday local time to avoid DST edge cases shifting the calendar day.
    const scheduledDate = new Date(year, month - 1, day, 12, 0, 0);

    scheduleMutation.mutate({
      id: itemId,
      date: scheduledDate.toISOString(),
      type: itemType as "linkedin" | "blog",
      action: "schedule",
    });
  };

  const scheduledItems = useMemo(() => (items || []).filter((item) => item.scheduled_for), [items]);
  const backlogItems = useMemo(() => (items || []).filter((item) => item.isBacklog), [items]);

  const getItemsForDay = (day: Date) =>
    scheduledItems.filter((item) => item.scheduled_for && isSameDay(parseISO(item.scheduled_for), day));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Visão mensal com thumbnail dos posts de social.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate((prev) => addMonths(prev, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px] text-center text-sm font-medium capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate((prev) => addMonths(prev, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
          <Button onClick={() => navigate("/admin/orchestrator")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo conteúdo
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-3">
              {weekdayHeaders.map((label) => (
                <div key={label} className="px-2 text-center text-xs font-semibold uppercase text-muted-foreground">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day) => {
                const dayItems = getItemsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const dayKey = format(day, "yyyy-MM-dd");

                return (
                  <Droppable key={dayKey} droppableId={`day-${dayKey}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[190px] rounded-2xl border bg-card p-2 ${
                          snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-border"
                        } ${!isCurrentMonth ? "opacity-45" : ""}`}
                      >
                        <div className="mb-2 flex items-center justify-between px-1">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                          {dayItems.length > 0 ? <Badge variant="secondary">{dayItems.length}</Badge> : null}
                        </div>

                        <div className="space-y-2">
                          {dayItems.map((item, index) => (
                            <Draggable key={`${item.type}:${item.id}`} draggableId={`${item.type}:${item.id}`} index={index}>
                              {(draggableProvided) => (
                                <Card
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className="overflow-hidden border shadow-none"
                                >
                                  <CardContent className="p-2">
                                    <div className="flex gap-2">
                                      {item.type === "linkedin" && item.thumbnailUrl ? (
                                        <img
                                          src={item.thumbnailUrl}
                                          alt={item.title}
                                          className="h-14 w-14 rounded-md object-cover"
                                        />
                                      ) : null}
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                          {item.type === "linkedin" ? (
                                            <Linkedin className="h-3.5 w-3.5 text-sky-600" />
                                          ) : (
                                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                                          )}
                                          <span className="capitalize">{item.type}</span>
                                        </div>
                                        <p className="line-clamp-2 text-xs font-medium leading-snug">{item.title}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>

          <Card className="h-fit">
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">Backlog</h2>
                <Badge variant="secondary" className="ml-auto">
                  {backlogItems.length}
                </Badge>
              </div>

              <Droppable droppableId="backlog">
                {(provided) => (
                  <ScrollArea className="h-[720px] pr-4">
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {isLoading ? (
                        <p className="text-sm text-muted-foreground">Carregando calendário...</p>
                      ) : backlogItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem itens no backlog.</p>
                      ) : (
                        backlogItems.map((item, index) => (
                          <Draggable key={`${item.type}:${item.id}`} draggableId={`${item.type}:${item.id}`} index={index}>
                            {(draggableProvided) => (
                              <Card
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                              >
                                <CardContent className="p-3">
                                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    {item.type === "linkedin" ? (
                                      <Linkedin className="h-3.5 w-3.5 text-sky-600" />
                                    ) : (
                                      <FileText className="h-3.5 w-3.5 text-amber-600" />
                                    )}
                                    <span className="capitalize">{item.type}</span>
                                  </div>
                                  {item.type === "linkedin" && item.thumbnailUrl ? (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.title}
                                      className="mb-3 h-28 w-full rounded-lg object-cover"
                                    />
                                  ) : null}
                                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
    </div>
  );
}
