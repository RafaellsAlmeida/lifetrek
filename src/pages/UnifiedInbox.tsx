import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Inbox,
  Send,
  Loader2,
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Chat = {
  id: string;
  name: string;
  unread_count: number;
  last_message_at: string;
  timestamp: string;
  items: Array<{
    text: string;
    sender_id: string;
  }>;
  attendees: Array<{
    id: string;
    name: string;
    picture_url?: string;
    provider_id: string;
    company?: string;
    headline?: string;
  }>;
};

type Message = {
  id: string;
  text: string;
  sender_id: string;
  created_at: string;
  attachments?: any[];
};

export default function UnifiedInbox() {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Fetch Chats
  const { data: chats, isLoading: isLoadingChats, error: chatsError } = useQuery({
    queryKey: ['linkedin-chats'],
    queryFn: async () => {
      console.log("Fetching chats...");
      const { data, error } = await supabase.functions.invoke('fetch-linkedin-inbox', {
        body: { action: 'list_chats' }
      });
      if (error) throw error;
      console.log("Chats response:", data);
      // Handle both { items: [...] } and direct array responses
      const chatsData = data?.items || (Array.isArray(data) ? data : []);
      // Debug: log first item structure
      if (chatsData.length > 0) {
        console.log("First chat item structure:", JSON.stringify(chatsData[0], null, 2));
        console.log("First chat keys:", Object.keys(chatsData[0]));
        if (chatsData[0].attendees) {
          console.log("First attendee:", JSON.stringify(chatsData[0].attendees[0], null, 2));
        }
      }
      return chatsData as Chat[];
    },
    retry: 1
  });

  // Fetch Messages for selected chat
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['linkedin-messages', selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return [];
      console.log("Fetching messages for", selectedChatId);
      const { data, error } = await supabase.functions.invoke('fetch-linkedin-inbox', {
        body: { action: 'get_messages', chat_id: selectedChatId }
      });
      if (error) throw error;
      console.log("Messages response:", data);
      // Handle different response structures
      const msgItems = data?.items || (Array.isArray(data) ? data : []);
      // Log first message structure for debugging
      if (msgItems.length > 0) {
        console.log("First message keys:", Object.keys(msgItems[0]));
      }
      // Messages often come in reverse chronological order
      return msgItems.reverse() as Message[];
    },
    enabled: !!selectedChatId
  });

  const selectedChat = chats?.find(c => c.id === selectedChatId);

  const getOtherAttendee = (chat: Chat) => {
    // Try to get attendee info from the enriched response
    if (chat?.attendees && chat.attendees.length > 0) {
      const attendee = chat.attendees[0];
      return {
        id: attendee.id || 'unknown',
        name: attendee.name || 'LinkedIn User',
        picture_url: attendee.picture_url,
        provider_id: attendee.provider_id || '',
        company: attendee.company || (attendee as any).headline || '',
        headline: attendee.headline || ''
      };
    }
    
    // Fallback for chats without enriched data
    return { 
      id: (chat as any).id || 'unknown', 
      name: 'LinkedIn User', 
      picture_url: undefined, 
      provider_id: (chat as any).attendee_provider_id || '',
      company: '',
      headline: ''
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;
    // TODO: Implement send message via Edge Function
    console.log("Sending message:", newMessage);
    setNewMessage("");
  };

  return (
    <div className="flex h-[600px] border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
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
            {isLoadingChats ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-3 w-3/4" />
                       <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chatsError ? (
              <div className="p-8 text-center text-red-500 text-xs">
                Erro ao carregar chats via Unipile.
                <br/>Verifique a Edge Function.
              </div>
            ) : chats?.length === 0 ? (
               <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Inbox className="h-8 w-8 opacity-20" />
                <span className="text-xs">Nenhuma conversa encontrada</span>
              </div>
            ) : (
              chats?.map(chat => {
                const attendee = getOtherAttendee(chat);
                const lastMsg = chat.items?.[0]?.text || "No interactions yet";
                const time = chat.last_message_at || chat.timestamp;
                
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedChatId === chat.id ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : ''}`}
                  >
                    <Avatar className="h-9 w-9 border border-slate-100">
                      <AvatarImage src={attendee?.picture_url} />
                      <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                        {attendee?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-xs truncate ${chat.unread_count > 0 ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                          {attendee?.name || "Unknown User"}
                        </span>
                        {time && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {format(new Date(time), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {attendee?.company && (
                        <p className="text-[10px] text-slate-500 truncate mb-0.5">
                          {attendee.company}
                        </p>
                      )}
                      <p className={`text-[11px] truncate ${chat.unread_count > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                        {lastMsg}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-slate-100">
                  <AvatarImage src={getOtherAttendee(selectedChat)?.picture_url} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                    {getOtherAttendee(selectedChat)?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-medium text-slate-700">
                    {getOtherAttendee(selectedChat)?.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] text-slate-400">LinkedIn</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                   <Phone className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                   <Video className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 bg-slate-50/30 p-4">
              <div className="space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                  </div>
                ) : (
                  messages?.map((msg, idx) => {
                    // Skip messages without required fields
                    if (!msg || typeof msg !== 'object') return null;
                    
                    const messageText = msg.text || (msg as any).content || (msg as any).body || '';
                    const messageTime = msg.created_at || (msg as any).timestamp || (msg as any).sent_at;
                    const messageId = msg.id || `msg-${idx}`;
                    const isMe = false; // TODO: Determine "me"
                    
                    return (
                      <div key={messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-none'}`}>
                          <p>{messageText || '(No text)'}</p>
                          {messageTime && (
                            <span className={`text-[9px] mt-1 block ${isMe ? 'text-indigo-200' : 'text-slate-300'}`}>
                              {format(new Date(messageTime), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 h-9 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                />
                <Button type="submit" size="sm" className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <div className="p-4 rounded-full bg-slate-100 mb-4 text-slate-300">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">Inbox Unificado</h3>
            <p className="text-xs text-slate-400 mt-1">Selecione uma conversa para iniciar</p>
          </div>
        )}
      </div>
    </div>
  );
}
