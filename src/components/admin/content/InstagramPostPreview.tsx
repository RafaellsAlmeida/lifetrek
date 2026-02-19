
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Instagram, ChevronLeft, ChevronRight } from "lucide-react";

interface InstagramPostPreviewProps {
    post: any;
}

export function InstagramPostPreview({ post }: InstagramPostPreviewProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const hashtags = Array.isArray(post?.hashtags)
        ? post.hashtags
        : (typeof post?.hashtags === 'string' ? post.hashtags.split(',').map((s: string) => s.trim()) : []);

    const imageUrls = Array.isArray(post?.image_urls) ? post.image_urls : (post?.image_url ? [post.image_url] : []);
    const isCarousel = imageUrls.length > 1 || post?.post_type === 'carousel';

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev + 1) % imageUrls.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
    };

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
                        <p className="text-sm font-semibold hover:text-slate-600 cursor-pointer">lifetrek.medical</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">Lifetrek Medical • Sponsored</p>
                    </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-slate-500 cursor-pointer" />
            </div>

            {/* Main Image / Carousel */}
            <div className="aspect-square bg-slate-100 relative group overflow-hidden">
                {imageUrls.length > 0 ? (
                    <>
                        <img
                            src={imageUrls[activeIndex]}
                            alt={`Post slide ${activeIndex + 1}`}
                            className="w-full h-full object-cover transition-opacity duration-300"
                        />

                        {isCarousel && (
                            <>
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium">
                                    {activeIndex + 1}/{imageUrls.length}
                                </div>

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>

                                {/* Dot Indicators */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {imageUrls.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-white scale-110' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4 border border-slate-100">
                            <Instagram className="h-8 w-8 text-pink-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Aguardando Mídia</h3>
                        <p className="text-xs text-slate-500 max-w-[200px]">
                            A imagem deste post ainda não foi processada ou está em fila.
                        </p>
                    </div>
                )}
            </div>

            {/* Interactions */}
            <div className="p-3 pb-2 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Heart className="h-6 w-6 hover:text-red-500 cursor-pointer transition-colors" />
                        <MessageCircle className="h-6 w-6 hover:text-slate-500 cursor-pointer transition-colors" />
                        <Send className="h-6 w-6 hover:text-slate-500 cursor-pointer transition-colors" />
                    </div>
                    <Bookmark className="h-6 w-6 hover:text-slate-500 cursor-pointer transition-colors" />
                </div>

                <div className="text-sm font-semibold">1,248 curtidas</div>

                {/* Caption */}
                <div className="space-y-1">
                    <p className="text-sm leading-snug">
                        <span className="font-semibold mr-2 hover:underline cursor-pointer">lifetrek.medical</span>
                        {post?.caption || "Legenda do post será exibida aqui..."}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-sm text-[#00376b] hover:underline cursor-pointer">
                                #{tag.replace(/^#/, '')}
                            </span>
                        ))}
                    </div>
                </div>

                <p className="text-[10px] text-muted-foreground uppercase mt-2 tracking-tight">
                    HÁ 2 HORAS
                </p>
            </div>

            {/* Comment Section */}
            <div className="px-3 py-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px]">U</AvatarFallback>
                        </Avatar>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Adicione um comentário...</p>
                </div>
                <span className="text-xs font-semibold text-blue-500/50 cursor-pointer">Publicar</span>
            </div>
        </div>
    );
}


