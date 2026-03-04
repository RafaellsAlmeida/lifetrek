import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Download, ArrowLeft, Sparkles, Loader2, RefreshCw } from "lucide-react";

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
    postType?: 'template' | 'linkedin' | 'instagram';
    slideIndex?: number;
    onBack?: () => void;
    embedded?: boolean;
}

export function ImageEditorCore({ postId, postType = 'template', slideIndex = 0, onBack, embedded = false }: ImageEditorCoreProps) {
    const stageRef = useRef<any>(null);
    const [post, setPost] = useState<any>(null);
    const [text, setText] = useState("Headline Goes Here");
    const [headlinePosition, setHeadlinePosition] = useState({ x: 100, y: 300 });
    const [canvasSize] = useState({ width: 1080, height: 1080 });
    const [bgUrl, setBgUrl] = useState("https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");
    const [isEnhancing, setIsEnhancing] = useState(false);

    useEffect(() => {
        if (postId) loadPost();
    }, [postId, postType, slideIndex]);

    const loadPost = async () => {
        const tableName = postType === 'linkedin' ? 'linkedin_carousels' :
            postType === 'instagram' ? 'instagram_posts' : 'content_templates';

        console.log(`Loading post ${postId} from ${tableName}`);

        const { data, error } = await supabase
            .from(tableName as any)
            .select('*')
            .eq('id', postId!)
            .single();

        if (data) {
            setPost(data);

            if (postType === 'linkedin') {
                const slide = data.slides?.[slideIndex] || data.slides?.[0];
                if (slide) {
                    setText(slide.headline || data.topic);
                    setBgUrl(slide.imageUrl || slide.image_url || "https://placehold.co/1080x1080/1a1a1a/FFF?text=SlideBackground");
                } else {
                    setText(data.topic);
                }
            } else if (postType === 'instagram') {
                // Instagram usually single image or carousel, handle simplified for now
                setText(data.content_preview || data.caption || "Instagram Post");
                setBgUrl(data.image_urls?.[0] || "https://placehold.co/1080x1350/1a1a1a/FFF?text=InstaBackground");
            } else {
                // Content Templates (Legacy/Default)
                setText(data.title || "New Post");
                if (data.pillar === 'Identity') setBgUrl(FILTER_TEMPLATES.identity.bg);
                else setBgUrl(data.image_url || "https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");
            }
        }
    };

    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleIAAssist = async () => {
        if (!bgUrl || bgUrl.includes('placehold.co')) {
            toast.info("Selecione um fundo real ou asset para melhorar com IA.");
            return;
        }

        setIsEnhancing(true);
        const toastId = toast.loading("O Nano Banana Pro está processando sua imagem...");

        try {
            const { data, error } = await supabase.functions.invoke('enhance-product-image', {
                body: {
                    imageData: bgUrl,
                    prompt: `Melhore esta imagem para um catálogo médico premium da Lifetrek. 
                        Mantenha o produto central mas adicione iluminação dramática e ambiente de cleanroom de alta tecnologia.
                        Texto da Imagem: ${text}`
                }
            });

            if (error) throw error;
            if (data?.enhancedImage) {
                setBgUrl(data.enhancedImage);
                toast.success("Imagem aprimorada com Nano Banana Pro!");
            }
        } catch (e: any) {
            toast.error(`Erro IA: ${e.message}`);
        } finally {
            setIsEnhancing(false);
            toast.dismiss(toastId);
        }
    };

    const handleRegenerateBackground = async () => {
        if (!postId) return;

        setIsRegenerating(true);
        const toastId = toast.loading("Criando novo fundo com Nano Banana Pro...");

        try {
            const tableName = postType === 'linkedin' ? 'linkedin_carousels' :
                postType === 'instagram' ? 'instagram_posts' : 'content_templates';

            const { data, error } = await supabase.functions.invoke('regenerate-carousel-images', {
                body: {
                    carousel_id: postId,
                    slide_index: slideIndex,
                    table_name: tableName
                }
            });

            if (error) throw error;

            // Reload post to get new image URL
            await loadPost();
            toast.success("Novo fundo gerado com sucesso!");
        } catch (e: any) {
            console.error(e);
            toast.error(`Erro ao regenerar: ${e.message}`);
        } finally {
            setIsRegenerating(false);
            toast.dismiss(toastId);
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
        if (!postId || !post) {
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

            if (postType === 'linkedin') {
                const newSlides = [...(post.slides || [])];
                const idx = slideIndex;
                if (newSlides[idx]) {
                    newSlides[idx] = {
                        ...newSlides[idx],
                        imageUrl: publicUrl,
                        image_url: publicUrl // Keep both for safety
                    };

                    const { error: updateError } = await supabase
                        .from('linkedin_carousels')
                        .update({
                            slides: newSlides,
                            // Also update image_urls array if needed
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', postId);
                    if (updateError) throw updateError;
                }
            } else if (postType === 'instagram') {
                const { error: updateError } = await supabase
                    .from('instagram_posts')
                    .update({
                        image_urls: [publicUrl], // Replace first image for now
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', postId);
                if (updateError) throw updateError;
            } else {
                const { error: updateError } = await supabase
                    .from('content_templates')
                    .update({ image_url: publicUrl })
                    .eq('id', postId);
                if (updateError) throw updateError;
            }

            toast.success("Imagem salva e vinculada ao post!");
            // Refresh post data
            loadPost();
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
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 gap-2"
                                onClick={handleSave}
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                                onClick={handleIAAssist}
                                disabled={isEnhancing || isRegenerating}
                            >
                                {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                IA Assist
                            </Button>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleRegenerateBackground}
                            disabled={isRegenerating || isEnhancing}
                        >
                            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerar Fundo (Novo Prompt)
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={handleDownload}
                        >
                            <Download className="w-4 h-4" />
                            Baixar PNG
                        </Button>
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
                                x={headlinePosition.x}
                                y={headlinePosition.y}
                                width={880}
                                fontSize={80}
                                fontFamily="Arial"
                                fontStyle="bold"
                                fill="white"
                                shadowColor="black"
                                shadowBlur={10}
                                shadowOffset={{ x: 2, y: 2 }}
                                shadowOpacity={0.8}
                                align="center"
                                draggable
                                onDragMove={(event) => {
                                    const node = event.target;
                                    setHeadlinePosition({ x: node.x(), y: node.y() });
                                }}
                                onDragEnd={(event) => {
                                    const node = event.target;
                                    setHeadlinePosition({ x: node.x(), y: node.y() });
                                }}
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
