import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Inbox
} from "lucide-react";

export default function UnifiedInbox() {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

  return (
    <div className="flex h-[600px] border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Sidebar - Thread List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col min-w-[300px] bg-slate-50/50">
        <div className="p-3 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-700">Inbox</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar..." 
              className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-slate-200" 
            />
          </div>
          <Tabs defaultValue="active" className="w-full" onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3 h-7 bg-slate-200/50">
              <TabsTrigger value="active" className="text-[10px] h-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Ativos</TabsTrigger>
              <TabsTrigger value="unread" className="text-[10px] h-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Não Lidos</TabsTrigger>
              <TabsTrigger value="all" className="text-[10px] h-5 data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <ScrollArea className="flex-1 bg-white">
          <div className="flex flex-col">
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Inbox className="h-8 w-8 opacity-20" />
              <span className="text-xs">Inbox em desenvolvimento</span>
              <p className="text-[10px] text-slate-400 max-w-[200px]">
                A integração com conversas será habilitada em breve.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
          <div className="p-4 rounded-full bg-slate-100 mb-4 text-slate-300">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-medium text-slate-600">Inbox Unificado</h3>
          <p className="text-xs text-slate-400 mt-1">Em breve: LinkedIn, WhatsApp, Email</p>
        </div>
      </div>
    </div>
  );
}
