
import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Download, ArrowLeft, Sparkles } from "lucide-react";

const FILTER_TEMPLATES = {
    identity: { bg: '/assets/templates/identity_bg.png', textColor: '#ffffff' },
    capabilities: { bg: '/assets/templates/capabilities_bg.png', textColor: '#ffffff' },
    trust: { bg: '/assets/templates/trust_bg.png', textColor: '#ffffff' },
};

const URLImage = ({ src, x, y, width, height }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

interface ImageEditorCoreProps {
    postId?: string | null;
    onBack?: () => void;
    embedded?: boolean;
}

export function ImageEditorCore({ postId, onBack, embedded = false }: ImageEditorCoreProps) {
  const stageRef = useRef<any>(null);
  const [post, setPost] = useState<any>(null);
  const [text, setText] = useState("Headline Goes Here");
  const [canvasSize] = useState({ width: 1080, height: 1080 });
  const [bgUrl, setBgUrl] = useState("https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");

  useEffect(() => {
    if (postId) loadPost();
  }, [postId]);

  const loadPost = async () => {
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('id', postId!)
      .single();
    
    if (data) {
        setPost(data);
        setText(data.title || "New Post");
        if (data.pillar === 'Identity') setBgUrl(FILTER_TEMPLATES.identity.bg);
    }
  };

  const handleDownload = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = `post-${postId || 'new'}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!postId) {
        toast.error("Nenhum post selecionado para salvar.");
        return;
    }
    try {
        const uri = stageRef.current.toDataURL();
        const blob = await (await fetch(uri)).blob();
        const fileName = `posts/${postId}_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from('content_assets')
            .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('content_assets')
            .getPublicUrl(fileName);

        const { error: updateError } = await supabase
            .from('content_templates')
            .update({ image_url: publicUrl })
            .eq('id', postId);
        
        if (updateError) throw updateError;

        toast.success("Imagem salva e vinculada ao post!");
    } catch (e: any) {
        toast.error(`Erro ao salvar imagem: ${e.message}`);
    }
  };

  return (
    <div className={`flex ${embedded ? 'h-full bg-transparent' : 'h-screen bg-background'}`}>
      {/* Sidebar Controls */}
      <div className={`${embedded ? 'w-64' : 'w-80'} border-r p-4 space-y-6 bg-muted/10 h-full overflow-y-auto`}>
        <div className="flex items-center gap-2 mb-4">
            {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            )}
            <h2 className="font-bold text-lg">Editor de Imagem</h2>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Texto da Headline</Label>
                <Input value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <Label>URL do Fundo</Label>
                <Input value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} />
            </div>
            
            <div className="pt-4 flex flex-col gap-2">
                <Button className="w-full gap-2" onClick={handleSave}>
                    <Save className="w-4 h-4" /> Salvar no Post
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
                        <Download className="w-4 h-4" /> PNG
                    </Button>
                    <Button variant="secondary" className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                        <Sparkles className="w-4 h-4" /> IA Assist
                    </Button>
                </div>
            </div>
        </div>

        {post && (
            <div className="mt-8 p-4 bg-muted/20 rounded-lg text-xs space-y-2">
                <h3 className="font-semibold uppercase tracking-wider text-muted-foreground">Contexto</h3>
                <p><strong>Pilar:</strong> {post.pillar || 'N/A'}</p>
                <p><strong>Título:</strong> {post.title}</p>
            </div>
        )}
        
        <div className="mt-auto pt-8">
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Templates Rápidos</h3>
            <div className="grid grid-cols-2 gap-2">
                {Object.entries(FILTER_TEMPLATES).map(([name, tmpl]) => (
                    <button 
                        key={name}
                        onClick={() => setBgUrl(tmpl.bg)}
                        className="h-16 rounded border bg-muted flex items-center justify-center text-[10px] font-medium hover:border-primary transition-colors"
                    >
                        {name.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-900/50 overflow-auto p-4 lg:p-12">
        <div className="shadow-2xl border-4 border-zinc-800 rounded-lg overflow-hidden bg-white">
             <Stage width={canvasSize.width * 0.5} height={canvasSize.height * 0.5} scaleX={0.5} scaleY={0.5} ref={stageRef}>
                <Layer>
                    <URLImage src={bgUrl} x={0} y={0} width={canvasSize.width} height={canvasSize.height} />
                    
                    <Text 
                        text={text}
                        x={100} 
                        y={300}
                        width={880}
                        fontSize={80}
                        fontFamily="Arial"
                        fontStyle="bold"
                        fill="white"
                        align="center"
                        draggable
                    />
                    
                     <Text 
                        text="Lifetrek Medical"
                        x={100} 
                        y={900}
                        width={880}
                        fontSize={40}
                        fontFamily="Arial"
                        fill="white"
                        opacity={0.8}
                        align="center"
                    />
                </Layer>
             </Stage>
        </div>
      </div>
    </div>
  );
}
