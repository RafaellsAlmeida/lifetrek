import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Phone, Mail, Building, ArrowRight, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import UnifiedInbox from "@/pages/UnifiedInbox";
import { WeeklyReportDashboard } from "@/components/WeeklyReportDashboard";
import { AnalyticsSection } from "./AnalyticsSection";

// --- Types ---
interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'new' | 'contacted' | 'in_progress' | 'quoted' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  notes: string | null;
  created_at: string;
  source: string | null;
}

const statusConfig = {
  new: { label: "Novo", color: "bg-blue-100 text-blue-800 border-blue-200" },
  contacted: { label: "Contactado", color: "bg-orange-100 text-orange-800 border-orange-200" },
  in_progress: { label: "Em Progresso", color: "bg-blue-50 text-blue-600 border-blue-200" },
  quoted: { label: "Proposta", color: "bg-blue-600 text-white border-blue-600" },
  closed: { label: "Fechado", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Perdido", color: "bg-gray-100 text-gray-500 border-gray-200 decoration-line-through" },
};

export function SalesDashboard({ userName }: { userName?: string }) {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "new",
    priority: "medium",
    notes: ""
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data as unknown as Lead[] || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async () => {
    try {
      if (!newLead.name) return toast.error("Nome é obrigatório");

      const { data, error } = await supabase
        .from("contact_leads")
        .insert([{
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          company: newLead.company || null,
          status: newLead.status as any,
          priority: newLead.priority as any,
          admin_notes: newLead.notes,
          project_type: 'website',
          technical_requirements: 'Manual Entry',
          source: 'website'
        }])
        .select()
        .single();

      if (error) throw error;

      setLeads([data as unknown as Lead, ...leads]);
      setIsAddLeadOpen(false);
      setNewLead({ name: "", email: "", phone: "", company: "", status: "new", priority: "medium", notes: "" });
      toast.success("Lead adicionado com sucesso");
    } catch (error) {
      console.error("Error adding lead:", error);
      toast.error("Erro ao adicionar lead");
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 font-inter">
      {/* --- Toolbar / Subheader --- */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Central</h1>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <nav className="flex items-center gap-1">
             <Button 
               variant={activeTab === "leads" ? "secondary" : "ghost"} 
               onClick={() => setActiveTab("leads")}
               className={`h-8 rounded-md px-3 text-xs font-medium transition-all ${activeTab === 'leads' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
             >
               Pipeline
             </Button>
             <Button 
               variant={activeTab === "inbox" ? "secondary" : "ghost"} 
               onClick={() => setActiveTab("inbox")}
               className={`h-8 rounded-md px-3 text-xs font-medium transition-all ${activeTab === 'inbox' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
             >
               Unified Inbox
             </Button>
             <Button 
               variant={activeTab === "data" ? "secondary" : "ghost"} 
               onClick={() => setActiveTab("data")}
               className={`h-8 rounded-md px-3 text-xs font-medium transition-all ${activeTab === 'data' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
             >
               Analytics
             </Button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             <Input 
               placeholder="Search pipeline..." 
               className="h-9 w-64 pl-9 bg-white border-slate-200 text-sm focus-visible:ring-blue-600 shadow-sm transition-shadow hover:shadow"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
           <Button className="h-9 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs gap-2 shadow-sm" onClick={() => setIsAddLeadOpen(true)}>
             <Plus className="h-3.5 w-3.5" />
             Add Lead
           </Button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="p-6 max-w-[1600px] mx-auto">
        
        {/* --- Stats Row --- */}
        <div className="grid grid-cols-4 gap-4 mb-8">
           <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Leads</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</div>
           </div>
            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Novos (Essa Semana)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                 {leads.filter(l => {
                    const d = new Date(l.created_at);
                    const now = new Date();
                    return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) < 7;
                 }).length}
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Em Negociação</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                 {leads.filter(l => ['in_progress', 'quoted'].includes(l.status)).length}
              </div>
           </div>
           <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                 {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'closed').length / leads.length) * 100) : 0}%
              </div>
           </div>
        </div>

        {/* LEADS TAB */}
        {activeTab === "leads" && (
          <div className="space-y-4 animate-in fade-in duration-200">
             <div className="rounded border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[300px] text-xs font-semibold text-slate-600 uppercase tracking-wider">Lead / Company</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Info</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Date Added</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                       <TableRow>
                         <TableCell colSpan={5} className="h-24 text-center text-xs text-slate-500">Loading pipeline data...</TableCell>
                       </TableRow>
                    ) : filteredLeads.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="h-24 text-center text-xs text-slate-500">No leads found matching your criteria.</TableCell>
                       </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-blue-50/30 cursor-pointer group transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-900 font-semibold">{lead.name}</span>
                              {lead.company && <span className="text-xs text-slate-500 flex items-center gap-1"><Building className="h-3 w-3" /> {lead.company}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`rounded-sm font-medium text-[10px] uppercase tracking-wide px-2 py-0.5 ${statusConfig[lead.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                              {statusConfig[lead.status]?.label || lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1 text-xs text-slate-600">
                               {lead.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-slate-400" /> {lead.email}</div>}
                               {lead.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-slate-400" /> {lead.phone}</div>}
                             </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              {lead.source || 'Manual'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
             </div>
          </div>
        )}

        {/* INBOX TAB */}
        {activeTab === "inbox" && (
          <div className="animate-in fade-in duration-200">
             <UnifiedInbox />
          </div>
        )}

        {/* DATA TAB */}
        {activeTab === "data" && (
          <div className="animate-in fade-in duration-200">
             <AnalyticsSection />
          </div>
        )}
      </main>

      {/* --- ADD LEAD DIALOG --- */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-[500px] border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-semibold">New Lead Entry</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              Manually add a prospect to the CRM pipeline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Name *</Label>
                 <Input 
                   id="name" 
                   value={newLead.name} 
                   onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                   className="h-9 text-sm" 
                   placeholder="ex: John Doe" 
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="company" className="text-xs font-semibold text-slate-700">Company</Label>
                 <Input 
                   id="company" 
                   value={newLead.company} 
                   onChange={(e) => setNewLead({...newLead, company: e.target.value})}
                   className="h-9 text-sm" 
                   placeholder="ex: Acme Corp" 
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email</Label>
                 <Input 
                   id="email"
                   type="email"
                   value={newLead.email} 
                   onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                   className="h-9 text-sm" 
                   placeholder="john@example.com" 
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">Phone</Label>
                 <Input 
                   id="phone" 
                   value={newLead.phone} 
                   onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                   className="h-9 text-sm" 
                   placeholder="+55 11 9..." 
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-700">Initial Status</Label>
                   <Select value={newLead.status} onValueChange={(v) => setNewLead({...newLead, status: v})}>
                     <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="new">Novo</SelectItem>
                       <SelectItem value="contacted">Contactado</SelectItem>
                       <SelectItem value="in_progress">Em Progresso</SelectItem>
                       <SelectItem value="quoted">Proposta Enviada</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-semibold text-slate-700">Priority</Label>
                   <Select value={newLead.priority} onValueChange={(v) => setNewLead({...newLead, priority: v})}>
                     <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="low">Baixa</SelectItem>
                       <SelectItem value="medium">Média</SelectItem>
                       <SelectItem value="high">Alta</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">Internal Notes</Label>
               <Input 
                 id="notes" 
                 value={newLead.notes} 
                 onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                 className="h-9 text-sm" 
                 placeholder="Context, source detailing, next steps..." 
               />
             </div>
          </div>

          <DialogFooter>
             <Button variant="outline" size="sm" onClick={() => setIsAddLeadOpen(false)} className="h-9 text-xs">Cancel</Button>
             <Button onClick={handleAddLead} className="h-9 text-xs bg-blue-700 hover:bg-blue-800 text-white gap-2">
               <Save className="h-3.5 w-3.5" /> Save Lead
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
