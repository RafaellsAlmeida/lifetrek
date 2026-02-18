import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackAnalyticsEvent } from "@/utils/trackAnalytics";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIChatbot = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou a Julia, assistente virtual da Lifetrek. Estou aqui para ajudar sobre nossa fábrica, capacidade técnica e produtos. Como posso ajudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Show button and auto-open on scroll (only on landing page)
  useEffect(() => {
    if (!isLandingPage) {
      setShowButton(true); // Always show button on other pages (but opaque/disabled style)
      return;
    }

    const handleScroll = () => {
      const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollDepth > 50) {
        setShowButton(true);
        if (!hasAutoOpened) {
          setIsOpen(true);
          setHasAutoOpened(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage, hasAutoOpened]);

  // Session ID for conversation tracking
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Track chatbot interaction
    await trackAnalyticsEvent({
      eventType: "chatbot_interaction",
      metadata: {
        message: input,
        conversationDepth: messages.length,
        isFirstMessage: messages.length === 1,
        sessionId
      },
    });

    try {
      // Use the NEW dedicated 'website-bot' function
      const { data, error } = await supabase.functions.invoke("website-bot", {
        body: {
          messages: [...messages, userMessage],
          sessionId
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
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Falha a enviar mensagem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <>
      {/* Floating Button - Bottom Right, Larger */}
      {!isOpen && showButton && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 bg-primary"
          aria-label="Abrir chat do Assistente Trek"
        >
          <MessageCircle className="h-7 w-7" />
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
