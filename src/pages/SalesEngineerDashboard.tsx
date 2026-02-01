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
// Minimalist status colors (Monochrome/Slate focus)
const statusStyles: Record<string, string> = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  contacted: "bg-white text-slate-600 border-slate-200",
  in_progress: "bg-slate-900 text-slate-50 border-slate-700", // Dark for active
  quoted: "bg-slate-50 text-slate-900 border-slate-300 font-medium",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
  rejected: "text-slate-400 decoration-line-through decoration-slate-400"
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
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* --- Minimal Header --- */}
      <header className="bg-white border-b sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="bg-slate-900 text-white p-1.5 rounded-sm">
             <Building className="h-4 w-4" />
           </div>
           <h1 className="font-medium text-sm tracking-tight text-slate-900">Lifetrek <span className="text-slate-300">/</span> CRM</h1>
        </div>
        
        <nav className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab("crm")}
            className={`text-xs font-medium transition-colors ${activeTab === 'crm' ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Workplace
          </button>
          <button 
            onClick={() => setActiveTab("tools")}
            className={`text-xs font-medium transition-colors ${activeTab === 'tools' ? 'text-slate-900 border-b-2 border-slate-900 pb-0.5' : 'text-slate-500 hover:text-slate-700'}`}
          >
             Tools & Resources
          </button>
        </nav>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
             <Search className="h-4 w-4" />
           </Button>
           <div className="h-4 w-px bg-slate-200" />
           <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-600 hover:bg-slate-50">
              {userName || "Engenheiro"}
           </Button>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto p-6">
        
        {/* --- CRM WORKPLACE VIEW --- */}
        {activeTab === "crm" && (
          <div className="space-y-6">
            
            {/* KPI Strip - Monochrome */}
            <div className="flex items-center gap-8 pl-1">
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Novos Leads</p>
                  <p className="text-2xl font-light tracking-tight text-slate-900">{newLeadsCount}</p>
               </div>
               <div className="h-8 w-px bg-slate-100" />
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Alta Prioridade</p>
                  <p className="text-2xl font-light tracking-tight text-slate-900">{highPriorityCount}</p>
               </div>
               <div className="h-8 w-px bg-slate-100" />
               <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Tasks Hoje</p>
                  <p className="text-2xl font-light tracking-tight text-slate-900">{tasks.filter(t => !t.completed).length}</p>
               </div>
               <div className="ml-auto">
                 <Button size="sm" variant="outline" className="h-8 text-xs gap-2 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={fetchLeads}>
                   <RefreshCw className="h-3 w-3" /> Sync
                 </Button>
               </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="grid grid-cols-12 gap-6">
               
               {/* Left Col: Inbox & Tasks (60%) */}
               <div className="col-span-12 lg:col-span-7 space-y-6">
                  
                  {/* Daily Focus - Simple List */}
                  <div className="bg-white rounded border border-slate-200">
                     <div className="py-3 px-4 flex flex-row items-center justify-between border-b border-slate-100">
                       <h3 className="font-medium text-sm flex items-center gap-2 text-slate-800">
                         <ListTodo className="h-4 w-4 text-slate-400" />
                         Daily Focus
                       </h3>
                       <span className="text-xs text-slate-400">
                         {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
                       </span>
                     </div>
                     <div className="p-2 space-y-0.5">
                        {tasks.map(task => (
                          <div 
                             key={task.id} 
                             className={`flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors group ${task.completed ? 'opacity-40' : ''}`}
                             onClick={() => toggleTask(task.id)}
                          >
                             <div className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-colors ${task.completed ? 'bg-slate-800 border-slate-800' : 'border-slate-300'}`}>
                               {task.completed && <Check className="h-3 w-3 text-white" />}
                             </div>
                             <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>{task.text}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Unified Inbox Component */}
                  <div className="bg-white rounded border border-slate-200 overflow-hidden h-[600px]">
                     <UnifiedInbox />
                  </div>
               </div>

               {/* Right Col: Active Leads (40%) */}
               <div className="col-span-12 lg:col-span-5 space-y-6">
                  <div className="bg-white rounded border border-slate-200 h-full flex flex-col">
                     <div className="py-3 px-4 border-b border-slate-100 bg-slate-50/30">
                       <div className="flex justify-between items-center">
                         <h3 className="font-medium text-sm text-slate-800">Leads Recentes</h3>
                         <Button variant="link" size="sm" className="h-auto p-0 text-xs text-slate-500 hover:text-slate-900 decoration-slate-300" onClick={() => navigate('/admin/leads')}>
                           Ver todos
                         </Button>
                       </div>
                     </div>
                     <ScrollArea className="flex-1">
                       <div className="divide-y divide-slate-50">
                         {leads.slice(0, 15).map(lead => (
                           <div 
                             key={lead.id} 
                             className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                             onClick={() => navigate(`/admin?lead=${lead.id}`)}
                           >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-sm text-slate-800 group-hover:text-slate-900">{lead.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${statusStyles[lead.status] || 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                  {lead.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                <Building className="h-3 w-3 text-slate-400" />
                                {lead.company || "Sem empresa"}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-400">
                                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                {lead.priority === 'high' && (
                                  <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1 rounded-sm">
                                    Alta Prioridade
                                  </span>
                                )}
                              </div>
                           </div>
                         ))}
                       </div>
                     </ScrollArea>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- TOOLS & RESOURCES VIEW --- */}
        {activeTab === "tools" && (
           <div className="space-y-8">
              
              {/* Reports Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analytics & Reports</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white rounded border border-slate-200 p-1">
                      <WeeklyReportDashboard />
                   </div>
                   <div className="bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer p-6" onClick={() => navigate('/admin/roi-simulation')}>
                      <h3 className="text-sm font-medium text-slate-900 mb-1">Calculadora ROI</h3>
                      <p className="text-sm text-slate-500 mb-4">Simulação para propostas comerciais</p>
                      <div className="h-24 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                         Preview Indisponível
                      </div>
                   </div>
                </div>
              </section>

              {/* Content Tools - Grid */}
              <section>
                 <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                    <LayoutGrid className="h-4 w-4 text-slate-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content Operations</h3>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: "Carousel Generator", icon: Star, path: "/admin/linkedin-carousel", desc: "Criar posts LinkedIn" },
                      { title: "Knowledge Base", icon: BookOpen, path: "/admin/knowledge-base", desc: "Gerenciar documentos" },
                      { title: "Aprovação Conteúdo", icon: CheckCircle2, path: "/admin/content-approval", desc: "Revisar pendências" },
                      { title: "Campanhas", icon: TrendingUp, path: "/admin/campaigns", desc: "Gestão de tráfego" },
                    ].map((tool) => (
                      <div 
                        key={tool.title}
                        className="bg-white border border-slate-200 rounded p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => navigate(tool.path)}
                      >
                         <div className="p-2 rounded-sm bg-slate-100 w-fit mb-3 text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-200 transition-colors">
                           <tool.icon className="h-4 w-4" />
                         </div>
                         <h4 className="font-medium text-sm text-slate-900 mb-1">{tool.title}</h4>
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
