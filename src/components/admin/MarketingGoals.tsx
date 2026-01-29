// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/layout/label"; // Check if this exists or use standard label
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Linkedin, Users } from "lucide-react";
import { toast } from "sonner";

interface DailyGoal {
    id: string;
    text: string;
    completed: boolean;
}

export function MarketingGoals() {
    // Persist state in localStorage for prototype functionality
    const [linkedinCount, setLinkedinCount] = useState(() => {
        return Number(localStorage.getItem("marketing_linkedin_count") || 0);
    });
    const [meetingCount, setMeetingCount] = useState(() => {
        return Number(localStorage.getItem("marketing_meeting_count") || 0);
    });
    
    const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => {
        const saved = localStorage.getItem("marketing_daily_goals");
        return saved ? JSON.parse(saved) : [
            { id: "1", text: "Verificar novos leads", completed: false },
            { id: "2", text: "Responder comentários LinkedIn", completed: false },
            { id: "3", text: "Follow-up propostas pendentes", completed: false },
            { id: "4", text: "Atualizar CRM", completed: false }
        ];
    });

    useEffect(() => {
        localStorage.setItem("marketing_linkedin_count", linkedinCount.toString());
    }, [linkedinCount]);

    useEffect(() => {
        localStorage.setItem("marketing_meeting_count", meetingCount.toString());
    }, [meetingCount]);

    useEffect(() => {
        localStorage.setItem("marketing_daily_goals", JSON.stringify(dailyGoals));
    }, [dailyGoals]);

    const toggleGoal = (id: string) => {
        setDailyGoals(goals => 
            goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
        );
    };

    const resetWeek = () => {
        setLinkedinCount(0);
        setMeetingCount(0);
        toast.success("Metas semanais resetadas!");
    };

    const resetDaily = () => {
        setDailyGoals(goals => goals.map(g => ({ ...g, completed: false })));
        toast.success("Metas diárias resetadas!");
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Weekly Targets - Takes up 3 columns */}
            <Card className="lg:col-span-3 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Metas Semanais
                            </CardTitle>
                            <CardDescription>Progresso da semana atual</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetWeek} className="h-8 text-xs text-muted-foreground">
                            Nova Semana
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* LinkedIn Goal */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                                <Linkedin className="h-4 w-4 text-primary" />
                                Posts LinkedIn
                            </span>
                            <span className="text-muted-foreground">{linkedinCount} / 3</span>
                        </div>
                        <Progress value={(linkedinCount / 3) * 100} className="h-2" />
                        <div className="flex gap-2 justify-end">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => setLinkedinCount(Math.max(0, linkedinCount - 1))}
                                disabled={linkedinCount === 0}
                            >
                                -
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                onClick={() => {
                                    setLinkedinCount(Math.min(3, linkedinCount + 1));
                                    if(linkedinCount + 1 === 3) toast.success("Meta de LinkedIn atingida! 🎉");
                                }}
                                disabled={linkedinCount >= 3}
                            >
                                + Registrar Post
                            </Button>
                        </div>
                    </div>

                    {/* Meeting Goal */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                                <Users className="h-4 w-4 text-purple-600" />
                                Reunião Semanal
                            </span>
                            <span className="text-muted-foreground">{meetingCount} / 1</span>
                        </div>
                        <Progress value={(meetingCount / 1) * 100} className="h-2" />
                        <div className="flex gap-2 justify-end">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => setMeetingCount(0)}
                                disabled={meetingCount === 0}
                            >
                                -
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                onClick={() => {
                                    setMeetingCount(1);
                                    toast.success("Reunião registrada! 👍");
                                }}
                                disabled={meetingCount >= 1}
                            >
                                + Registrar Reunião
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Goals - Takes up 4 columns */}
            <Card className="lg:col-span-4 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Metas Diárias - Engenheira de Vendas
                            </CardTitle>
                            <CardDescription>Checklist operacional diário</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetDaily} className="h-8 text-xs text-muted-foreground">
                            Novo Dia
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {dailyGoals.map((goal) => (
                            <div key={goal.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                <Checkbox 
                                    id={`goal-${goal.id}`} 
                                    checked={goal.completed}
                                    onCheckedChange={() => toggleGoal(goal.id)}
                                    className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                                <div className="grid gap-1.5 leading-none w-full">
                                    <label
                                        htmlFor={`goal-${goal.id}`}
                                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${
                                            goal.completed ? "line-through text-muted-foreground" : ""
                                        }`}
                                    >
                                        {goal.text}
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {dailyGoals.every(g => g.completed) && (
                        <div className="mt-6 p-3 bg-green-50 text-green-800 rounded-md text-center text-sm font-medium animate-in fade-in zoom-in duration-300 border border-green-200">
                            ✨ Todas as metas diárias concluídas! Bom trabalho!
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
