import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Building,
  Calendar,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  LogOut,
  LayoutGrid,
  MessageSquare,
  Briefcase,
  Lightbulb,
  FileText,
  Search,
  ListTodo,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import UnifiedInbox from "@/pages/UnifiedInbox";
import { WeeklyReportDashboard } from "@/components/WeeklyReportDashboard";
import { Input } from "@/components/ui/input";

// --- Types ---
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  status: string;
  priority: string;
  lead_score: number | null;
  created_at: string;
  source: string | null;
}

interface SalesTask {
    id: string;
    text: string;
    completed: boolean;
}

// --- Status Config ---
// Minimalist status colors (subtle backgrounds, dark text)
const statusStyles: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-100",
  contacted: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-100",
  quoted: "bg-purple-50 text-purple-700 border-purple-100",
  closed: "bg-green-50 text-green-700 border-green-100",
  rejected: "text-gray-400 decoration-line-through decoration-gray-400"
};

export function SalesDashboard({ userName }: { userName?: string }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("crm");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<SalesTask[]>(() => {
      const saved = localStorage.getItem("sales_daily_tasks");
      return saved ? JSON.parse(saved) : [
          { id: "1", text: "Triagem técnica (Novos Leads)", completed: false },
          { id: "2", text: "Responder mensagens Inbox", completed: false },
          { id: "3", text: "Follow-up propostas pendentes", completed: false },
      ];
  });

  useEffect(() => {
    fetchLeads();
    // Real-time subscription could go here
    return () => {}; 
  }, []);

  useEffect(() => {
    localStorage.setItem("sales_daily_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_leads")
        .select("id, name, email, phone, company, status, priority, lead_score, created_at, source")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Metrics
  const newLeadsCount = leads.filter(l => l.status === "new").length;
  const highPriorityCount = leads.filter(l => l.priority === "high" && l.status !== "closed").length;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* --- Minimal Header --- */}
      <header className="bg-white border-b sticky top-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
           <div className="bg-slate-900 text-white p-1.5 rounded-md">
             <Building className="h-4 w-4" />
           </div>
           <h1 className="font-semibold text-sm tracking-tight">Lifetrek <span className="text-slate-400">|</span> CRM</h1>
        </div>
        
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button 
            variant={activeTab === "crm" ? "white" : "ghost"} 
            size="sm" 
            onClick={() => setActiveTab("crm")}
            className={`text-xs px-3 h-7 ${activeTab === 'crm' ? 'shadow-sm font-medium' : 'text-slate-500'}`}
          >
            Workplace
          </Button>
          <Button 
            variant={activeTab === "tools" ? "white" : "ghost"} 
            size="sm" 
            onClick={() => setActiveTab("tools")}
            className={`text-xs px-3 h-7 ${activeTab === 'tools' ? 'shadow-sm font-medium' : 'text-slate-500'}`}
          >
             Tools & Resources
          </Button>
        </nav>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
             <Search className="h-4 w-4" />
           </Button>
           <div className="h-4 w-px bg-slate-200" />
           <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-600">
              {userName || "Engenheiro"}
           </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto p-6">
        
        {/* --- CRM WORKPLACE VIEW --- */}
        {activeTab === "crm" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* KPI Strip - Plain text, no cards */}
            <div className="flex items-center gap-8 pl-1">
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Novos Leads</p>
                  <p className="text-2xl font-semibold tracking-tight">{newLeadsCount}</p>
               </div>
               <div className="h-8 w-px bg-slate-200" />
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Alta Prioridade</p>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">{highPriorityCount}</p>
               </div>
               <div className="h-8 w-px bg-slate-200" />
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Tasks Hoje</p>
                  <p className="text-2xl font-semibold tracking-tight">{tasks.filter(t => !t.completed).length}</p>
               </div>
               <div className="ml-auto">
                 <Button size="sm" variant="outline" className="h-8 text-xs gap-2" onClick={fetchLeads}>
                   <RefreshCw className="h-3 w-3" /> Sync
                 </Button>
               </div>
            </div>

            <Separator className="bg-slate-200" />

            <div className="grid grid-cols-12 gap-6">
               
               {/* Left Col: Inbox & Tasks (60%) */}
               <div className="col-span-12 lg:col-span-7 space-y-6">
                  
                  {/* Daily Focus - Simple List */}
                  <Card className="shadow-sm border-slate-200">
                     <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                       <h3 className="font-semibold text-sm flex items-center gap-2">
                         <ListTodo className="h-4 w-4 text-slate-500" />
                         Daily Focus
                       </h3>
                       <span className="text-xs text-slate-400">
                         {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
                       </span>
                     </CardHeader>
                     <div className="px-4 pb-4 space-y-1">
                        {tasks.map(task => (
                          <div 
                             key={task.id} 
                             className={`flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors group ${task.completed ? 'opacity-50' : ''}`}
                             onClick={() => toggleTask(task.id)}
                          >
                             <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}`}>
                               {task.completed && <Check className="h-3 w-3 text-white" />}
                             </div>
                             <span className={`text-sm ${task.completed ? 'line-through' : 'text-slate-700'}`}>{task.text}</span>
                          </div>
                        ))}
                     </div>
                  </Card>

                  {/* Unified Inbox Component */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-[600px]">
                     <UnifiedInbox />
                  </div>
               </div>

               {/* Right Col: Active Leads (40%) */}
               <div className="col-span-12 lg:col-span-5 space-y-6">
                  <Card className="shadow-sm border-slate-200 h-full flex flex-col">
                     <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/50">
                       <div className="flex justify-between items-center">
                         <h3 className="font-semibold text-sm">Leads Recentes</h3>
                         <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-600" onClick={() => navigate('/admin/leads')}>
                           Ver todos
                         </Button>
                       </div>
                     </CardHeader>
                     <ScrollArea className="flex-1">
                       <div className="divide-y divide-slate-100">
                         {leads.slice(0, 15).map(lead => (
                           <div 
                             key={lead.id} 
                             className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                             onClick={() => navigate(`/admin?lead=${lead.id}`)}
                           >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-slate-900">{lead.name}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border-0 font-medium ${statusStyles[lead.status] || 'bg-slate-100'}`}>
                                  {lead.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                <Building className="h-3 w-3" />
                                {lead.company || "Sem empresa"}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                {lead.priority === 'high' && (
                                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
                                    Alta Prioridade
                                  </Badge>
                                )}
                              </div>
                           </div>
                         ))}
                       </div>
                     </ScrollArea>
                  </Card>
               </div>
            </div>
          </div>
        )}

        {/* --- TOOLS & RESOURCES VIEW --- */}
        {activeTab === "tools" && (
           <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Reports Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Analytics & Reports</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-1">
                      <WeeklyReportDashboard />
                   </div>
                   <Card className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors cursor-pointer" onClick={() => navigate('/admin/roi-simulation')}>
                      <CardHeader>
                        <CardTitle className="text-base text-slate-900">Calculadora ROI (Simulação)</CardTitle>
                        <CardDescription>Ferramenta de cálculo para propostas comerciais</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-24 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                           Simulação Preview
                        </div>
                      </CardContent>
                   </Card>
                </div>
              </section>

              <Separator className="bg-slate-200" />

              {/* Content Tools - Grid */}
              <section>
                 <div className="flex items-center gap-2 mb-4">
                    <LayoutGrid className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Content Operations</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: "Carousel Generator", icon: Star, color: "text-blue-600", path: "/admin/linkedin-carousel", desc: "Criar posts LinkedIn" },
                      { title: "Knowledge Base", icon: BookOpen, color: "text-green-600", path: "/admin/knowledge-base", desc: "Gerenciar documentos" },
                      { title: "Aprovação Conteúdo", icon: CheckCircle2, color: "text-orange-600", path: "/admin/content-approval", desc: "Revisar pendências" },
                      { title: "Campanhas", icon: TrendingUp, color: "text-purple-600", path: "/admin/campaigns", desc: "Gestão de tráfego" },
                    ].map((tool) => (
                      <div 
                        key={tool.title}
                        className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                        onClick={() => navigate(tool.path)}
                      >
                         <div className={`p-2 rounded-md bg-slate-50 w-fit mb-3 group-hover:bg-slate-100 ${tool.color}`}>
                           <tool.icon className="h-5 w-5" />
                         </div>
                         <h4 className="font-semibold text-sm text-slate-900 mb-1">{tool.title}</h4>
                         <p className="text-xs text-slate-500">{tool.desc}</p>
                      </div>
                    ))}
                 </div>
              </section>
           </div>
        )}

      </main>
    </div>
  );
}

// Add strict button variant for Shadcn if needed, or use default
// Assuming 'white' variant doesn't exist, mapped to default/ghost logic in className
