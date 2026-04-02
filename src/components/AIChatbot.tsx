import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackChatbotEvent } from "@/utils/trackAnalytics";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BUFFER_WINDOW_MS = 5000;
const INITIAL_ASSISTANT_MESSAGE: Message = {
  role: "assistant",
  content:
    "Olá! Sou a Julia, assistente virtual da Lifetrek. Posso te ajudar com dúvidas sobre nossa fábrica, capacidade técnica, produtos e portfólio. Como posso ajudar?",
};

function formatBufferedUserMessages(batch: Message[]): string {
  if (batch.length === 1) {
    return batch[0].content;
  }

  return [
    "Mensagens enviadas em sequência pelo usuário:",
    ...batch.map((message, index) => `${index + 1}. ${message.content.trim()}`),
  ].join("\n");
}

export const AIChatbot = () => {
  const location = useLocation();

  // Session ID for conversation tracking
  const [sessionId] = useState(() => crypto.randomUUID());

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Message[]>([INITIAL_ASSISTANT_MESSAGE]);
  const pendingBatchRef = useRef<Message[]>([]);
  const bufferTimerRef = useRef<number | null>(null);

  const [hasTrackedOpen, setHasTrackedOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (bufferTimerRef.current !== null) {
        window.clearTimeout(bufferTimerRef.current);
      }
    };
  }, []);

  const openChatbot = useCallback(() => {
    setIsOpen(true);
    if (!hasTrackedOpen) {
      setHasTrackedOpen(true);
      void trackChatbotEvent("opened", {
        sessionId,
        open_reason: "manual",
        page_path: location.pathname,
      });
    }
  }, [hasTrackedOpen, location.pathname, sessionId]);

  const flushBufferedMessages = async () => {
    const batch = pendingBatchRef.current;
    if (!batch.length || isLoading) return;

    pendingBatchRef.current = [];
    bufferTimerRef.current = null;
    setIsLoading(true);

    const groupedUserMessage: Message = {
      role: "user",
      content: formatBufferedUserMessages(batch),
    };
    const requestMessages = [...conversationHistoryRef.current, groupedUserMessage];

    try {
      const { data, error } = await supabase.functions.invoke("website-bot", {
        body: {
          messages: requestMessages,
          sessionId,
          clientBuffer: {
            grouped: batch.length > 1,
            count: batch.length,
            windowMs: BUFFER_WINDOW_MS,
            rawMessages: batch.map((message) => message.content),
          },
        },
      });

      if (error) {
        if (error.message?.includes("429") || error.message?.includes("rate limit")) {
          toast.error("Muitas mensagens. Tente novamente em breve.");
        } else {
          toast.error("Erro ao conectar. Tente novamente.");
        }
        console.error("Chat error:", error);
        return;
      }

      if (data?.response) {
        const assistantMessage: Message = { role: "assistant", content: data.response };
        conversationHistoryRef.current = [...requestMessages, assistantMessage];
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Falha a enviar mensagem.");
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleBufferedFlush = () => {
    if (bufferTimerRef.current !== null) {
      window.clearTimeout(bufferTimerRef.current);
    }

    bufferTimerRef.current = window.setTimeout(() => {
      void flushBufferedMessages();
    }, BUFFER_WINDOW_MS);
  };

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    pendingBatchRef.current = [...pendingBatchRef.current, userMessage];
    setInput("");

    void trackChatbotEvent("message_sent", {
      sessionId,
      conversationDepth: messages.length,
      isFirstMessage: messages.length === 1,
      messageLength: trimmedInput.length,
      page_path: location.pathname,
    });

    scheduleBufferedFlush();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <>
      {/* Floating Button - Bottom Right, Compact */}
      {!isOpen && (
        <Button
          onClick={openChatbot}
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-xl transition-transform duration-200 hover:scale-105 z-50 bg-primary"
          aria-label="Abrir chat do Assistente Trek"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      {/* Chat Window - Bottom Right */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-white/20"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80')",
                }}
              ></div>
              <div>
                <h3 className="font-bold">Julia</h3>
                <p className="text-xs opacity-80">Assistente Virtual Lifetrek</p>
              </div>
            </div>
            <div className="flex gap-1">
              {/* Human Handoff Quick Action */}

              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                      }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua dúvida..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="bg-primary">
                <Send className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => window.open("https://wa.me/5511945336226", "_blank")}
                size="icon"
                className="bg-green-500 hover:bg-green-600 text-white"
                title="Falar com Vanessa no WhatsApp"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="h-5 w-5"
                />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
