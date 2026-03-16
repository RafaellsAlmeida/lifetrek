import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Mail,
  Phone,
  Tag,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useChatbotConversations, type ChatbotSession } from "@/hooks/useChatbotConversations";

export default function ChatbotInbox() {
  const {
    sessions,
    selectedMessages,
    loading,
    messagesLoading,
    fetchMessages,
    refetch,
  } = useChatbotConversations();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectSession = (session: ChatbotSession) => {
    setSelectedSessionId(session.session_id);
    fetchMessages(session.session_id);
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.first_user_message.toLowerCase().includes(q) ||
      (s.detected_name?.toLowerCase().includes(q)) ||
      (s.detected_company?.toLowerCase().includes(q)) ||
      (s.detected_email?.toLowerCase().includes(q)) ||
      (s.detected_interest?.toLowerCase().includes(q))
    );
  });

  const selectedSession = sessions.find((s) => s.session_id === selectedSessionId);

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
      {/* Sidebar - Session List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col min-w-[300px] bg-slate-50/50">
        <div className="p-3 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm text-slate-700">
                Conversas do Chatbot
              </h2>
            </div>
            <div className="flex gap-1 items-center">
              <Badge variant="secondary" className="text-[10px]">
                {sessions.length} sessões
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, empresa, email, interesse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-slate-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 bg-white">
          <div className="flex flex-col">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Bot className="h-8 w-8 opacity-20" />
                <span className="text-xs">
                  {searchQuery
                    ? "Nenhuma conversa encontrada"
                    : "Nenhuma conversa ainda"}
                </span>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session)}
                  className={`flex flex-col gap-1 p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                    selectedSessionId === session.session_id
                      ? "bg-indigo-50/50 hover:bg-indigo-50/80"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[70%]">
                      {session.detected_name || session.ip || "Visitante"}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDistanceToNow(new Date(session.last_message_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {session.first_user_message}
                  </p>
                  {session.detected_company && (
                    <p className="text-[10px] text-slate-400 truncate">
                      Empresa: {session.detected_company}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 h-4 border-slate-200"
                    >
                      {session.message_count} msgs
                    </Badge>
                    {session.grouped_message_count && session.grouped_message_count > 1 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-amber-200 text-amber-700"
                      >
                        batch {session.grouped_message_count}
                      </Badge>
                    )}
                    {session.detected_interest && session.detected_interest !== "Geral" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-blue-200 text-blue-600"
                      >
                        {session.detected_interest}
                      </Badge>
                    )}
                    {session.detected_email && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 border-green-200 text-green-600"
                      >
                        <Mail className="h-2.5 w-2.5 mr-0.5" />
                        lead
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Conversation View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedSession ? (
          <>
            {/* Conversation Header */}
            <div className="border-b border-slate-200 px-4 py-3 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-700">
                    {selectedSession.detected_name || "Visitante"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedSession.detected_company && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Tag className="h-3 w-3" />
                        {selectedSession.detected_company}
                      </span>
                    )}
                    {selectedSession.detected_email && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Mail className="h-3 w-3" />
                        {selectedSession.detected_email}
                      </span>
                    )}
                    {selectedSession.detected_phone && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Phone className="h-3 w-3" />
                        {selectedSession.detected_phone}
                      </span>
                    )}
                    {selectedSession.detected_interest && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Tag className="h-3 w-3" />
                        {selectedSession.detected_interest}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {format(new Date(selectedSession.first_message_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedSession.user_message_count} perguntas
                  </Badge>
                  {selectedSession.grouped_message_count && selectedSession.grouped_message_count > 1 && (
                    <Badge variant="secondary" className="text-[10px]">
                      batch {selectedSession.grouped_message_count}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedSession.message_count} mensagens total
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-slate-50/30 p-4">
              <div className="space-y-3 max-w-2xl mx-auto">
                {messagesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                  </div>
                ) : (
                  selectedMessages.map((msg) => {
                    const isUser = msg.role === "user";
                    const isSystem = msg.role === "system";

                    if (isSystem) return null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-start gap-2 max-w-[75%]">
                          {!isUser && (
                            <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Bot className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div
                              className={`rounded-lg p-3 text-sm ${
                                isUser
                                  ? "bg-indigo-600 text-white rounded-tr-none"
                                  : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                            <span
                              className={`text-[9px] mt-1 block ${
                                isUser ? "text-right text-slate-400" : "text-slate-300"
                              }`}
                            >
                              {format(new Date(msg.created_at), "HH:mm")}
                            </span>
                          </div>
                          {isUser && (
                            <div className="mt-1 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <User className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Footer info */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] text-slate-400">
                Sessão: {selectedSession.session_id.substring(0, 8)}... |
                IP: {selectedSession.ip || "N/A"} |
                Visualização somente leitura
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <div className="p-4 rounded-full bg-slate-100 mb-4 text-slate-300">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium text-slate-600">
              Inbox do Chatbot
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Selecione uma conversa para visualizar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
