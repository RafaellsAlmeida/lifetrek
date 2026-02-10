// @ts-nocheck
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, isSameDay, parseISO, isWithinInterval, endOfDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, GripVertical,
    Linkedin, FileText, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult
} from '@hello-pangea/dnd';

// Types
interface CalendarItem {
    id: string;
    title: string;
    type: 'linkedin' | 'blog';
    status: 'draft' | 'scheduled' | 'published' | 'approved';
    scheduled_for: string | null;
    author?: string;
}

export default function ContentCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [filterScope, setFilterScope] = useState<'mine' | 'company'>('company');

    const queryClient = useQueryClient();

    // Calculate week range
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart]
    );

    // Fetch items
    const { data: items, isLoading } = useQuery({
        queryKey: ['calendar_items', filterScope],
        queryFn: async () => {
            // Fetch Schedule LinkedIn Posts
            const { data: linkedinData, error: linkedinError } = await supabase
                .from('linkedin_carousels')
                .select('*')
                .not('status', 'eq', 'archived');

            if (linkedinError) throw linkedinError;

            // Fetch Scheduled Blogs
            const { data: blogData, error: blogError } = await supabase
                .from('blog_posts')
                .select('*')
                .not('status', 'eq', 'rejected');

            if (blogError) throw blogError;

            // Normalize
            const linkedinItems: CalendarItem[] = (linkedinData || []).map(item => ({
                id: item.id,
                title: item.topic,
                type: 'linkedin',
                status: item.status as any,
                scheduled_for: item.scheduled_for || item.created_at // fallback for demo
            }));

            const blogItems: CalendarItem[] = (blogData || []).map(item => ({
                id: item.id,
                title: item.title,
                type: 'blog',
                status: item.status as any,
                scheduled_for: item.scheduled_for || item.published_at || item.created_at // fallback
            }));

            return [...linkedinItems, ...blogItems];
        }
    });

    // Scheduling Mutation
    const scheduleMutation = useMutation({
        mutationFn: async ({ id, date, type }: { id: string, date: string, type: 'linkedin' | 'blog' }) => {
            if (type === 'linkedin') {
                const { error } = await supabase
                    .from('linkedin_carousels')
                        .update({
                            scheduled_for: date,
                            status: 'scheduled'
                        })
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('blog_posts')
                        .update({
                            scheduled_for: date,
                            status: 'scheduled'
                        })
                    .eq('id', id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendar_items'] });
            toast.success("Conteúdo agendado com sucesso!");
        },
        onError: () => toast.error("Erro ao agendar conteúdo")
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, draggableId, type } = result;
        if (!destination) return;

        // Dropped outside or same place
        if (destination.droppableId === result.source.droppableId && destination.index === result.source.index) {
            return;
        }

        // Determine target date
        // Format: `day-${dateISO}`
        if (destination.droppableId.startsWith('day-')) {
            const dateStr = destination.droppableId.replace('day-', '');
            // We know the draggableId is "type-id" or just "id" depending on implementation
            // Let's assume draggableId is the ITEM ID, but we need the type.
            // We can encode type in draggableId for better handling: "linkedin:ID"
            const [itemType, itemId] = draggableId.split(':');

            scheduleMutation.mutate({
                id: itemId,
                date: new Date(dateStr).toISOString(),
                type: itemType as 'linkedin' | 'blog'
            });
        }
    };

    const getItemsForDay = (date: Date) => {
        if (!items) return [];
        return items.filter(item =>
            item.scheduled_for && isSameDay(parseISO(item.scheduled_for), date)
        );
    };

    const unscheduledItems = useMemo(() => {
        if (!items) return [];
        // Just a mocked check for "unscheduled" or "draft" that hasn't been placed yet
        // In reality, we'd check for null scheduled_for
        return items.filter(item =>
            (item.status === 'draft' || item.status === 'pending_review') &&
            (!item.scheduled_for || new Date(item.scheduled_for).getFullYear() < 2024)
            // Logic to define "backlog" items
        );
    }, [items]);

    const handlePrevWeek = () => setCurrentDate(d => addDays(d, -7));
    const handleNextWeek = () => setCurrentDate(d => addDays(d, 7));
    const handleToday = () => setCurrentDate(new Date());

    return (
        <div className="container mx-auto max-w-7xl py-8 h-[calc(100vh-100px)] flex flex-col gap-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-[200px] text-center capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={handleNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={handleToday}>Hoje</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Conteúdo
                    </Button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 h-full overflow-hidden">
                    {/* Calendar Grid */}
                    <div className="flex-1 grid grid-cols-7 gap-4 h-full overflow-y-auto pr-2">
                        {weekDays.map((day, i) => (
                            <div key={day.toISOString()} className="flex flex-col gap-2 min-h-[500px]">
                                <div className={`p-3 rounded-lg text-center border ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                                    }`}>
                                    <div className="text-sm font-medium uppercase">{format(day, 'EEE', { locale: ptBR })}</div>
                                    <div className="text-2xl font-bold">{format(day, 'd')}</div>
                                </div>

                                <Droppable droppableId={`day-${day.toISOString()}`}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 rounded-lg border-2 border-dashed transition-colors p-2 space-y-2 ${snapshot.isDraggingOver ? 'bg-accent/50 border-primary' : 'border-transparent bg-muted/20'
                                                }`}
                                        >
                                            {getItemsForDay(day).map((item, index) => (
                                                <Draggable key={item.id} draggableId={`${item.type}:${item.id}`} index={index}>
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                                        >
                                                            <CardContent className="p-3 space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                    <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 ${item.type === 'linkedin' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                                                                        }`}>
                                                                        {item.type === 'linkedin' ? <Linkedin className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                                                                        {item.type}
                                                                    </Badge>
                                                                    <div className={`w-2 h-2 rounded-full ${item.status === 'published' ? 'bg-green-500' :
                                                                            item.status === 'scheduled' ? 'bg-blue-500' :
                                                                                'bg-yellow-500'
                                                                        }`} />
                                                                </div>
                                                                <p className="text-xs font-medium line-clamp-3">{item.title}</p>
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>

                    {/* Backlog Sidebar */}
                    <div className="w-80 flex flex-col gap-4 border-l pl-6">
                        <div className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold">Backlog</h3>
                            <Badge variant="secondary" className="ml-auto">{unscheduledItems.length}</Badge>
                        </div>
                        <Droppable droppableId="backlog">
                            {(provided) => (
                                <ScrollArea className="h-full pr-4">
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-3 pb-4"
                                    >
                                        {unscheduledItems.map((item, index) => (
                                            <Draggable key={item.id} draggableId={`${item.type}:${item.id}`} index={index}>
                                                {(provided) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card"
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {item.type === 'linkedin' ?
                                                                    <Linkedin className="h-4 w-4 text-blue-600" /> :
                                                                    <FileText className="h-4 w-4 text-orange-600" />
                                                                }
                                                                <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
                                                            </div>
                                                            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </ScrollArea>
                            )}
                        </Droppable>
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
}
