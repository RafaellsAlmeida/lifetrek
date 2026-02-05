import React, { useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApprovedContentItems } from "@/hooks/useLinkedInPosts";
import { Calendar as CalendarIcon, Linkedin, FileText, Instagram, Package, Clock, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ContentScheduler() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const { data: items, isLoading } = useApprovedContentItems();

    // Filter items that have a scheduled_date
    const scheduledItems = items?.filter(item => item.full_data.scheduled_date) || [];

    // Items for the selected day
    const dayItems = scheduledItems.filter(item => {
        if (!item.full_data.scheduled_date) return false;
        return isSameDay(parseISO(item.full_data.scheduled_date), selectedDate || new Date());
    });

    // Dates that have scheduled posts (for highlighting/modifiers)
    const scheduledDates = scheduledItems.map(item => parseISO(item.full_data.scheduled_date));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Calendar Section */}
            <Card className="lg:col-span-5 bg-background/50 backdrop-blur-sm border-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <CardTitle>Calendário Editorial</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border shadow-sm w-full h-full"
                        modifiers={{
                            scheduled: scheduledDates
                        }}
                        modifiersClassNames={{
                            scheduled: "bg-primary/20 font-bold text-primary border-b-2 border-primary"
                        }}
                    />
                </CardContent>
            </Card>

            {/* Daily View Section */}
            <Card className="lg:col-span-7 bg-background/50 backdrop-blur-sm border-primary/5 flex flex-col">
                <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy") : "Selecione uma data"}
                            </CardTitle>
                            <CardDescription>
                                {dayItems.length === 0 
                                    ? "Nenhuma publicação agendada" 
                                    : `${dayItems.length} publicação(ões) agendada(s)`}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-primary/5">
                            {dayItems.length} Posts
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                            {dayItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <Clock className="h-12 w-12 mb-4 opacity-20" />
                                    <p>Nada para este dia ainda.</p>
                                    <p className="text-xs">Acesse a aba 'Aprovados' para agendar novos posts.</p>
                                </div>
                            ) : (
                                dayItems.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center gap-4 p-4 rounded-lg border bg-background/40 hover:bg-background/60 transition-colors group"
                                    >
                                        <div className="p-3 rounded-full bg-muted">
                                            {item.type === 'linkedin' ? <Linkedin className="h-5 w-5 text-blue-600" /> : 
                                             item.type === 'instagram' ? <Instagram className="h-5 w-5 text-pink-600" /> :
                                             item.type === 'blog' ? <FileText className="h-5 w-5 text-blue-500" /> :
                                             <Package className="h-5 w-5 text-green-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                                                <Badge variant="secondary" className="text-[10px] h-4">
                                                    {format(parseISO(item.full_data.scheduled_date), "HH:mm")}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate italic">
                                                "{item.content_preview}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
