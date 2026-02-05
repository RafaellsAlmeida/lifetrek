import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function PostExampleIngestor() {
  const [content, setContent] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);

  const handleIngest = async () => {
    if (!content.trim()) {
      toast.error("Por favor, insira o conteúdo do post.");
      return;
    }

    setIsIngesting(true);
    try {
      // We will create this Edge Function next. 
      // It will use Gemini Flash to generate embeddings and store in knowledge_embeddings.
      const { data, error } = await supabase.functions.invoke("ingest-knowledge-item", {
        body: { 
          content: content,
          source_type: "post_examples",
          metadata: {
            ingested_at: new Date().toISOString(),
            original_content: content
          }
        },
      });

      if (error) throw error;

      toast.success("Exemplo de post ingerido com sucesso!");
      setContent("");
    } catch (error: any) {
      console.error("Error ingesting post:", error);
      toast.error(`Erro ao ingerir: ${error.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-card to-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Semear Base de Exemplos
        </CardTitle>
        <CardDescription>
          Cole posts de alta performance aqui. A IA irá processar e usar como referência para futuras gerações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Cole aqui o conteúdo do post (LinkedIn, Blog, etc...)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[150px] resize-none focus-visible:ring-orange-500/50"
        />
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => setContent("")}
            disabled={isIngesting || !content}
          >
            Limpar
          </Button>
          <Button 
            onClick={handleIngest} 
            disabled={isIngesting || !content}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isIngesting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ingerir Exemplo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
