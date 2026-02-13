
import React, { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Instagram, ChevronLeft, ChevronRight } from "lucide-react";

interface InstagramPostPreviewProps {
    post: any;
}

export function InstagramPostPreview({ post }: InstagramPostPreviewProps) {
    const [imageSet, setImageSet] = useState<'square' | 'original' | 'current'>('current');
    const [activeIndex, setActiveIndex] = useState(0);

    const { currentUrls, squareUrls, originalUrls } = useMemo(() => {
        const normalizeArray = (value: any): string[] => {
            if (!value) return [];
            if (Array.isArray(value)) return value.filter(Boolean);
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
                } catch {
                    return value.split(',').map((s) => s.trim()).filter(Boolean);
                }
            }
            return [];
        };

        const meta = post?.generation_metadata && typeof post.generation_metadata === 'object'
            ? post.generation_metadata
            : {};

        return {
            currentUrls: normalizeArray(post?.image_urls).length ? normalizeArray(post?.image_urls) : normalizeArray(post?.image_url),
            squareUrls: normalizeArray((meta as any)?.square_v1_image_urls),
            originalUrls: normalizeArray((meta as any)?.prev_image_urls),
        };
    }, [post]);

    const activeUrls = imageSet === 'square' ? squareUrls : imageSet === 'original' ? originalUrls : currentUrls;
    const mainUrl = activeUrls[activeIndex] || activeUrls[0] || null;

    const hashtags = Array.isArray(post?.hashtags)
        ? post.hashtags
        : (typeof post?.hashtags === 'string' ? post.hashtags.split(',').map((s: string) => s.trim()) : []);

    const canPrev = activeUrls.length > 1 && activeIndex > 0;
    const canNext = activeUrls.length > 1 && activeIndex < activeUrls.length - 1;

    return (
        <div className="max-w-md mx-auto bg-white border rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border">
                        <AvatarImage src="/assets/branding/logo_icon.png" />
                        <AvatarFallback>LT</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold">lifetrek.medical</p>
                        <p className="text-[10px] text-muted-foreground">Lifetrek Medical • Sponsored</p>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Image source toggle */}
            <div className="px-3 py-2 border-b bg-slate-50 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-600">
                    Visual: {imageSet === 'square' ? 'Quadrado (1:1)' : imageSet === 'original' ? 'Original (Claude)' : 'Atual (DB)'}
                </div>
                <div className="flex items-center gap-1">
                    {squareUrls.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { setImageSet('square'); setActiveIndex(0); }}
                            className={`px-2 py-1 rounded-md text-[11px] border ${imageSet === 'square' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                        >
                            Quadrado
                        </button>
                    )}
                    {originalUrls.length > 0 && (
                        <button
                            type="button"
                            onClick={() => { setImageSet('original'); setActiveIndex(0); }}
                            className={`px-2 py-1 rounded-md text-[11px] border ${imageSet === 'original' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                        >
                            Original
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { setImageSet('current'); setActiveIndex(0); }}
                        className={`px-2 py-1 rounded-md text-[11px] border ${imageSet === 'current' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                        Atual
                    </button>
                </div>
            </div>

            {/* Main Image / Carousel Placeholder */}
            <div className="aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden">
                {mainUrl ? (
                    <img
                        src={mainUrl}
                        alt="Instagram Content"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                            <Instagram className="h-8 w-8 text-pink-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Imagem Ausente</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">
                            A imagem deste post ainda não foi gerada ou falhou.
                        </p>
                    </div>
                )}

                {activeUrls.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                        {activeIndex + 1}/{activeUrls.length}
                    </div>
                )}

                {activeUrls.length > 1 && (
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2">
                        <button
                            type="button"
                            disabled={!canPrev}
                            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                            className={`h-9 w-9 rounded-full flex items-center justify-center backdrop-blur border ${canPrev ? 'bg-white/80 border-white/60 hover:bg-white' : 'bg-white/40 border-white/30 opacity-60 cursor-not-allowed'}`}
                            aria-label="Slide anterior"
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-800" />
                        </button>
                        <button
                            type="button"
                            disabled={!canNext}
                            onClick={() => setActiveIndex((i) => Math.min(activeUrls.length - 1, i + 1))}
                            className={`h-9 w-9 rounded-full flex items-center justify-center backdrop-blur border ${canNext ? 'bg-white/80 border-white/60 hover:bg-white' : 'bg-white/40 border-white/30 opacity-60 cursor-not-allowed'}`}
                            aria-label="Proximo slide"
                        >
                            <ChevronRight className="h-5 w-5 text-slate-800" />
                        </button>
                    </div>
                )}
            </div>

            {/* Interactions */}
            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart className="h-6 w-6" />
                        <MessageCircle className="h-6 w-6" />
                        <Send className="h-6 w-6" />
                    </div>
                    <Bookmark className="h-6 w-6" />
                </div>

                {/* Caption */}
                <div className="space-y-1">
                    <p className="text-sm">
                        <span className="font-semibold mr-2">lifetrek.medical</span>
                        {post?.caption || "Legenda do post será exibida aqui..."}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-sm text-blue-900">
                                #{tag.replace(/^#/, '')}
                            </span>
                        ))}
                    </div>
                </div>

                <p className="text-[10px] text-muted-foreground uppercase mt-2">
                    Há 2 horas
                </p>
            </div>

            {/* Comment section placeholder */}
            <div className="p-3 border-t flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-100" />
                <p className="text-xs text-muted-foreground">Adicione um comentário...</p>
            </div>
        </div>
    );
}

