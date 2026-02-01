import { useState } from "react";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Bot, 
  Star,
  RefreshCw 
} from "lucide-react";

export function WeeklyReportDashboard() {
  const [testMode, setTestMode] = useState(false);
  const { data, isLoading, refetch } = useWeeklyReport(testMode);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 flex flex-col items-center">
         <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-slate-600 rounded-full mb-2"/>
         <span className="text-xs">Carregando relatório...</span>
      </div>
    );
  }

  const stats = data?.stats;
  
  if (!stats) return null;

  // Minimalist chart colors (Blue/Slate)
  const activityData = [
    { name: 'Chatbot', value: stats.chatbotInteractions, color: '#3b82f6' }, // blue-500
    { name: 'Forms', value: stats.formSubmissions, color: '#64748b' }, // slate-500
    { name: 'Views', value: stats.pageViews, color: '#94a3b8' }, // slate-400
  ];

  return (
    <div className="space-y-6 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center text-black">
         <div>
           <h2 className="text-sm font-semibold text-slate-900">Weekly Performance</h2>
           <p className="text-xs text-slate-500">Overview of the last 7 days</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="test-mode" checked={testMode} onCheckedChange={setTestMode} className="scale-75" />
              <Label htmlFor="test-mode" className="text-xs text-slate-500 font-normal">Test Data</Label>
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 text-slate-400">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
         </div>
      </div>

      {/* KPI Section - Minimalist Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">New Leads</p>
           <div className="flex items-baseline gap-2">
             <h3 className="text-2xl font-semibold text-slate-900">{stats.totalNewLeads}</h3>
             <span className="text-[10px] text-green-600 font-medium flex items-center bg-green-50 px-1 rounded">
               <TrendingUp className="h-2 w-2 mr-0.5" /> 12%
             </span>
           </div>
        </div>

        <div className="space-y-1">
           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">High Priority</p>
           <h3 className="text-2xl font-semibold text-slate-900">{stats.highPriorityLeads}</h3>
        </div>

        <div className="space-y-1">
           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quality Leads (4+)</p>
           <h3 className="text-2xl font-semibold text-slate-900">{stats.leadsWithHighScore}</h3>
        </div>

        <div className="space-y-1">
           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI Engagement</p>
           <h3 className="text-2xl font-semibold text-slate-900">{stats.chatbotInteractions}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="col-span-2">
            <h4 className="text-xs font-semibold text-slate-900 mb-4">Digital Engagement</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>

        {/* Top Leads List */}
        <div className="col-span-1 border-l border-slate-100 pl-6">
            <h4 className="text-xs font-semibold text-slate-900 mb-4">Top Weekly Leads</h4>
            <div className="space-y-3">
              {(!data.leads || data.leads.length === 0) ? (
                <div className="text-xs text-slate-400 py-4">No top leads.</div>
              ) : (
                data.leads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="group flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${lead.priority === 'high' ? 'bg-red-400' : 'bg-blue-400'}`} />
                       <div className="max-w-[120px]">
                         <p className="font-medium text-xs truncate text-slate-700">{lead.name}</p>
                       </div>
                    </div>
                    {lead.lead_score && (
                      <div className="flex items-center text-[10px] font-medium text-slate-500">
                         <Star className="h-2.5 w-2.5 mr-0.5 text-slate-400" />
                         {lead.lead_score.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
