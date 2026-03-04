// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ContentOrchestratorCoreProps {
    embedded?: boolean;
    onGenerate?: (topic: string) => void;
}

export function ContentOrchestratorCore({ embedded = false, onGenerate }: ContentOrchestratorCoreProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastRequestTime, setLastRequestTime] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Helper to find the last topic mentioned in conversation
    const currentTopic = messages
        .filter(m => m.role === "assistant")
        .reverse()
        .find(m => m.content.toLowerCase().includes("tema") || m.content.toLowerCase().includes("tópico") || m.content.length < 100)
        ?.content.split("\n")[0].replace(/[#*]/g, "").trim() || (messages.length > 0 ? messages[messages.length - 1].content : "");

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const now = Date.now();
        if (now - lastRequestTime < 2000) {
            toast.error("Por favor, aguarde um momento antes de enviar outra mensagem.");
            return;
        }

        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setLastRequestTime(now);

        try {
            const { data, error } = await supabase.functions.invoke("chat", {
                body: {
                    messages: [...messages.slice(-5), userMessage],
                    mode: 'orchestrator'
                },
            });

            if (error) {
                if (error instanceof FunctionsHttpError) {
                    if (error.context?.status === 401) {
                        toast.error("Erro de autenticação. Verifique se está logado.");
                        throw error;
                    }
                    if (error.status === 429) {
                        toast.error("Limite de solicitações atingido. Aguarde 1 minuto.");
                        return;
                    }
                }
                throw error;
            }

            if (data?.error) {
                toast.error(`Erro: ${data.error}`);
                return;
            }

            setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
        } catch (error: any) {
            console.error("Chat error details:", error);
            const errorMessage = error.message || "Erro ao processar sua solicitação.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateClick = async () => {
        if (!onGenerate) return;
        setIsGenerating(true);
        try {
            await onGenerate(currentTopic);
        } catch (error) {
            console.error("Generation trigger failed", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[calc(100vh-12rem)]'} max-w-4xl mx-auto w-full`}>
            {!embedded && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Content Orchestrator</h1>
                        <p className="text-muted-foreground mt-1">Estratégia e Planejamento de Conteúdo Lifetrek</p>
                    </div>
                </div>
            )}

            <Card className={`flex-1 flex flex-col overflow-hidden bg-background/50 backdrop-blur-sm border-primary/10 ${embedded ? 'border-none shadow-none bg-transparent' : ''}`}>
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                        Clique em "Gere este post!" para iniciar a criação automática com agentes.
                    </span>
                </div>

                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <Bot className="h-12 w-12 mx-auto text-primary opacity-20" />
                                <p className="text-muted-foreground mt-4">
                                    Como posso ajudar com sua estratégia hoje?
                                </p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    }`}>
                                    {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </div>
                                <div className={`p-3 rounded-lg max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    }`}>
                                    <div className={`prose ${m.role === "user" ? "prose-invert" : "dark:prose-invert"} max-w-none text-sm leading-relaxed whitespace-pre-wrap break-words`}>
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                            }}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {i === messages.length - 1 && onGenerate && (
                                        <div className="mt-4 pt-3 border-t border-primary/10">
                                            <Button 
                                                onClick={handleGenerateClick}
                                                disabled={isGenerating}
                                                size="sm"
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                {isGenerating ? "Gerando..." : "✨ Gere este post!"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 animate-pulse">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="p-3 rounded-lg bg-muted animate-pulse">
                                    Digitando...
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background/50">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
