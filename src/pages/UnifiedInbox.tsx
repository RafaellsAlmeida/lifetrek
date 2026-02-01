import { useState, useRef, useEffect } from "react";
import { useConversations, useConversationMessages, useSendMessage, Conversation } from "@/hooks/useConversations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Linkedin, 
  Mail, 
  MessageCircle, 
  Search, 
  Filter, 
  Send, 
  Paperclip, 
  MoreVertical,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UnifiedInbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [replyText, setReplyText] = useState("");
  
  const { conversations, isLoading: isLoadingConversations } = useConversations(filter);
  const { messages, isLoading: isLoadingMessages } = useConversationMessages(selectedConversation?.id || null);
  const sendMessageMutation = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedConversation || !replyText.trim()) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: replyText
    });
    setReplyText("");
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'linkedin': return <Linkedin className="h-4 w-4 text-[#0077b5]" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-[#25D366]" />;
      case 'email': return <Mail className="h-4 w-4 text-slate-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

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
            {isLoadingConversations ? (
              <div className="p-8 text-center">
                 <div className="animate-spin h-5 w-5 border-2 border-slate-200 border-t-slate-600 rounded-full mx-auto mb-2"/>
                 <p className="text-xs text-slate-400">Carregando...</p>
              </div>
            ) : conversations?.length === 0 ? (
               <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                 <MessageSquare className="h-8 w-8 opacity-20" />
                 <span className="text-xs">Nenhuma conversa</span>
               </div>
            ) : (
              conversations?.map(conv => (
                <div 
                  key={conv.id}
                  className={`p-3 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 group ${selectedConversation?.id === conv.id ? 'bg-slate-50 border-l-2 border-l-slate-800' : 'border-l-2 border-l-transparent'}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                       <Avatar className="h-6 w-6">
                         <AvatarImage src={`https://avatar.vercel.sh/${conv.contact_identifier}`} />
                         <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">{conv.contact_name?.substring(0,2).toUpperCase() || "??"}</AvatarFallback>
                       </Avatar>
                       <span className={`text-xs text-slate-900 ${conv.unread_count > 0 ? 'font-bold' : 'font-medium'}`}>
                         {conv.contact_name || conv.contact_identifier}
                       </span>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {format(new Date(conv.last_message_at), "dd MMM", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-1 pl-8">
                    {getChannelIcon(conv.channel)}
                    <span className="text-[10px] font-medium text-slate-500 truncate flex-1">
                      {conv.lead?.company || (conv.subject || "Sem assunto")}
                    </span>
                    {conv.unread_count > 0 && (
                      <div className="h-4 min-w-[16px] px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-slate-500 line-clamp-1 pl-8 group-hover:text-slate-700">
                    {conv.last_message_preview}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <Avatar className="h-8 w-8">
                   <AvatarImage src={`https://avatar.vercel.sh/${selectedConversation.contact_identifier}`} />
                   <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">{selectedConversation.contact_name?.substring(0,2).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <div>
                   <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                     {selectedConversation.contact_name || selectedConversation.contact_identifier}
                     <Badge variant="secondary" className="text-[9px] font-normal px-1.5 py-0 h-4 bg-slate-100 text-slate-500 border-0">
                       {selectedConversation.channel}
                     </Badge>
                   </h3>
                   {selectedConversation.lead && (
                     <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase className="h-3 w-3" />
                        {selectedConversation.lead.company || "Empresa não vinculada"}
                     </div>
                   )}
                 </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                   <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-50/30">
               <div className="space-y-4 max-w-3xl mx-auto pb-4" ref={scrollRef}>
                 {isLoadingMessages ? (
                    <div className="text-center py-10">
                      <div className="animate-spin h-6 w-6 border-2 border-slate-200 border-t-slate-600 rounded-full mx-auto"/>
                    </div>
                 ) : messages?.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">Início da conversa</div>
                 ) : (
                    messages?.map(msg => {
                      const isMe = msg.sender_type === 'agent' || msg.sender_type === 'system';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg p-3 shadow-sm border ${isMe ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-800'}`}>
                             {msg.attachments && msg.attachments.length > 0 && (
                               <div className={`mb-2 p-2 rounded text-xs flex items-center gap-2 ${isMe ? 'bg-white/10' : 'bg-slate-100'}`}>
                                 <Paperclip className="h-3 w-3" />
                                 Anexo ({msg.attachments.length})
                               </div>
                             )}
                             <p className="text-sm sensitive whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                             <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                               {format(new Date(msg.created_at), "HH:mm")}
                             </div>
                          </div>
                        </div>
                      );
                    })
                 )}
               </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Button variant="ghost" size="icon" className="shrink-0 text-slate-400">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder...`}
                  className="min-h-[44px] h-[44px] resize-none text-sm border-slate-200 focus-visible:ring-slate-200 bg-slate-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                   onClick={handleSendMessage} 
                   disabled={!replyText.trim() || sendMessageMutation.isPending}
                   className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white"
                   size="icon"
                >
                   <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <div className="p-4 rounded-full bg-slate-100 mb-4 text-slate-300">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Nenhuma conversa selecionada</h3>
          </div>
        )}
      </div>
    </div>
  );
}
