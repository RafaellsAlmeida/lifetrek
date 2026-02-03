import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Clock, ArrowRight, BarChart3, PieChart as PieChartIcon, TrendingUp, ListChecks } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface DashboardStats {
    totalLeads: number;
    newLeads: number;
    highPriorityLeads: number;
    pendingApprovals: number;
    funnelData: any[];
    projectData: any[];
}

const COLORS = ['#0EA5E9', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export function SuperAdminDashboard({ userName }: { userName: string }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalLeads: 0,
        newLeads: 0,
        highPriorityLeads: 0,
        pendingApprovals: 0,
        funnelData: [],
        projectData: []
    });

    const [tasks] = useState<string[]>([
        "Finalizar vídeo da fábrica/sala limpa (1.5 min)",
        "Preparar recursos de IG para Vanessa",
        "Follow-up com Márcio (Logo, Fotos, Docs)",
        "Melhorar Design do Sales Deck do Márcio",
        "Compartilhar link do One-Pager com Vanessa",
        "Criar vídeos 'how-to' do website para Vanessa"
    ]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch leads
            const { data: leads } = await supabase
                .from("contact_leads")
                .select("*");

            if (!leads) return;

            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const newLeadsCount = leads.filter(l => new Date(l.created_at) >= yesterday).length;
            const highPriority = leads.filter(l => l.priority === 'high').length;

            // Process Funnel Data
            const statusCounts: Record<string, number> = {};
            leads.forEach(l => {
                statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
            });
            const funnelData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

            // Process Project Type Data
            const projectCounts: Record<string, number> = {};
            leads.forEach(l => {
                if (l.project_type) {
                    projectCounts[l.project_type] = (projectCounts[l.project_type] || 0) + 1;
                }
            });
            const projectData = Object.entries(projectCounts)
                .map(([name, value]) => ({
                    name: name.replace(/_/g, ' ').toUpperCase(),
                    value
                }))
                .slice(0, 5);

            // Fetch pending content approvals
            const { data: pendingTemplates } = await (supabase
                .from("content_templates" as any)
                .select("id")
                .eq("status", "pending_approval") as any);

            setStats({
                totalLeads: leads.length,
                newLeads: newLeadsCount,
                highPriorityLeads: highPriority,
                pendingApprovals: pendingTemplates?.length || 0,
                funnelData,
                projectData
            });
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Welcome */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 italic">
                        LIFETREK INSIGHTS
                        <Badge className="bg-primary text-xs uppercase tracking-widest font-bold">Admin</Badge>
                    </h2>
                    <p className="text-muted-foreground font-medium">Análise de performance para {userName}.</p>
                </div>
                <Button onClick={() => navigate('/admin/leads')} className="gap-2 shadow-lg shadow-primary/20">
                    Ver Todos os Leads <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            {/* High-Level Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Leads", val: stats.totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50", detail: `+${stats.newLeads} úteis 24h` },
                    { label: "Alta Prioridade", val: stats.highPriorityLeads, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", detail: "Ação imediata" },
                    { label: "Conteúdos", val: stats.pendingApprovals, icon: Clock, color: "text-amber-600", bg: "bg-amber-100", detail: "Aguardando review" },
                    { label: "Meta Mensal", val: "72%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", detail: "vs. mês anterior" }
                ].map((s, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-3xl font-black mt-1">{s.val}</h3>
                                </div>
                                <div className={`p-2 ${s.bg} rounded-xl`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                            </div>
                            <p className="mt-3 text-[10px] font-bold text-muted-foreground/60 uppercase">{s.detail}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Chart */}
                <Card className="lg:col-span-2 shadow-lg border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Funil de Vendas (Status)
                        </CardTitle>
                        <CardDescription>Distribuição de leads por estágio do pipeline.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.funnelData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#666' }} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Executive To-Do */}
                <Card className="shadow-lg border-none bg-gradient-to-br from-slate-50 to-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ListChecks className="h-5 w-5 text-primary" />
                            To-Do Executivo
                        </CardTitle>
                        <CardDescription>Ações estratégicas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4 pt-2">
                            {tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-4 p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                                    <span className="text-xs font-bold text-slate-600 leading-tight">{task}</span>
                                </li>
                            ))}
                        </ul>
                        <Button variant="ghost" size="sm" className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => navigate('/admin/content-approval')}>
                            Review Aprovações <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Distribution Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                {/* Pie Chart for Project Types */}
                <Card className="shadow-lg border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            Distribuição por Segmento
                        </CardTitle>
                        <CardDescription>Tipos de projetos mais requisitados.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.projectData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.projectData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* HUD Technical Status */}
            <Card className="bg-slate-950 text-slate-50 border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
                <CardContent className="pt-8 pb-8 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="space-y-2">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none animate-pulse">SYSTEM HEALTH: OPTIMAL</Badge>
                        <h4 className="text-2xl font-bold">Orquestrador Inteligente Ativo</h4>
                        <p className="text-slate-400 max-w-md">Todos os agentes (P&D, Vendas, Qualidade) estão operacionais e processando leads em tempo real.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-l border-slate-800 pl-8">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Uptime</p>
                            <p className="text-2xl font-black">99.9%</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">API Latency</p>
                            <p className="text-2xl font-black">240ms</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
