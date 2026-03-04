
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, Globe, ChevronLeft, ChevronRight, Download } from "lucide-react";

interface LinkedInPostPreviewProps {
    post: any;
}

export function LinkedInPostPreview({ post }: LinkedInPostPreviewProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    // Track selected variant index per slide: { slideIndex → variantIndex }
    const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});
    const slides = Array.isArray(post?.slides) ? post.slides : [];
    const hasSlides = slides.length > 0;
    const imageUrls = Array.isArray(post?.image_urls) ? post.image_urls : [];
    const siteUrl = "https://www.lifetrek-medical.com";
    const resolveUrl = (value?: string) => {
        if (!value) return "";
        if (value.startsWith("/")) return `${siteUrl}${value}`;
        return value.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, siteUrl);
    };

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const currentSlide = slides[activeIndex] || {};
    const variants: string[] = Array.isArray(currentSlide.image_variants) ? currentSlide.image_variants : [];
    // Default to last variant (most recently generated); fall back to image_url
    const defaultVariantIdx = variants.length > 0 ? variants.length - 1 : -1;
    const activeVariantIdx = selectedVariants[activeIndex] ?? defaultVariantIdx;
    const currentImage =
        (activeVariantIdx >= 0 ? resolveUrl(variants[activeVariantIdx]) : "") ||
        resolveUrl(currentSlide.imageUrl || currentSlide.image_url || currentSlide.backgroundImage) ||
        resolveUrl(imageUrls[activeIndex]) ||
        resolveUrl(imageUrls[0]);
    const mainHeadline = currentSlide.headline || post.topic || "LinkedIn Post Headline";
    const mainContent = currentSlide.content || post.caption || "Conteúdo do post será exibido aqui...";

    return (
        <div className="max-w-[552px] mx-auto bg-white border border-[#e0e0e0] rounded-lg overflow-hidden shadow-sm font-sans selection:bg-[#0a66c2]/20">
            {/* Header */}
            <div className="p-3 pb-0 flex items-start justify-between">
                <div className="flex gap-2">
                    <div className="relative">
                        <Avatar className="h-12 w-12 rounded-none">
                            <AvatarImage src={`${siteUrl}/assets/branding/logo_icon.png`} className="object-contain bg-white border border-slate-100 p-1" />
                            <AvatarFallback className="rounded-none bg-slate-100 text-slate-400 font-bold">LT</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-slate-900 hover:text-[#0a66c2] hover:underline cursor-pointer">Lifetrek Medical</span>
                            <span className="text-[10px] text-slate-500">• Seguir</span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-tight">Soluções em Engenharia Médica de Alta Precisão • 24.500 seguidores</span>
                        <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                            <span className="text-[11px]">Agora •</span>
                            <Globe className="h-3 w-3" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="text-[#0a66c2] text-sm font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors group">
                        <span className="flex items-center gap-1">+ Seguir</span>
                    </button>
                    <MoreHorizontal className="h-5 w-5 text-slate-600 hover:bg-slate-100 rounded-full p-0.5 cursor-pointer" />
                </div>
            </div>

            {/* Post Content */}
            <div className="px-4 py-3 text-sm text-slate-900 leading-[1.5]">
                <p className="whitespace-pre-wrap">{post.caption || (activeIndex === 0 ? mainContent : "")}</p>
                {post.hashtags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Array.isArray(post.hashtags) ? post.hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-[#0a66c2] font-semibold hover:underline cursor-pointer">#{tag}</span>
                        )) : post.hashtags.split(',').map((tag: string, i: number) => (
                            <span key={i} className="text-[#0a66c2] font-semibold hover:underline cursor-pointer">#{tag.trim()}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Visual Media (Carousel Simulation) */}
            <div className="relative bg-[#f3f6f8] border-y border-[#e0e0e0] group">
                {hasSlides ? (
                    <div className="relative animate-in fade-in duration-500">
                        <div className="aspect-[4/5] md:aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-[#0a66c2] to-[#004182] text-white text-center shadow-inner overflow-hidden">
                            {currentImage && (
                                <img
                                    src={currentImage}
                                    alt={mainHeadline}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            )}
                            <div className={`absolute inset-0 ${currentImage ? "bg-black/5" : "bg-black/15"}`} />
                            {/* Decorative Elements */}
                            {!currentImage && (
                                <>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-xl" />
                                </>
                            )}

                            {!currentImage && (
                                <div className="relative z-10 space-y-8 max-w-[90%] flex flex-col items-center">
                                    <h2 className="text-3xl md:text-4xl font-extrabold leading-[1.15] tracking-tight drop-shadow-sm">
                                        {mainHeadline}
                                    </h2>
                                    <div className="h-1.5 w-16 bg-white/60 rounded-full shadow-sm" />
                                    <p className="text-base md:text-lg opacity-90 leading-relaxed font-medium max-w-[85%]">
                                        {currentSlide.body || currentSlide.copy || currentSlide.content}
                                    </p>
                                </div>
                            )}

                            {/* Brand bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-sm flex items-center justify-between px-8 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-white rounded flex items-center justify-center p-1 shadow-sm">
                                        <img src={`${siteUrl}/assets/branding/logo_icon.png`} className="object-contain" alt="Logo" />
                                    </div>
                                    <span className="text-[10px] font-extrabold tracking-[0.2em] text-white/90">LIFETREK MEDICAL</span>
                                </div>
                                <div className="flex gap-2">
                                    {slides.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 w-1 transition-all duration-300 rounded-full ${i === activeIndex ? 'bg-white scale-150' : 'bg-white/30'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full p-2 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>

                        {/* Slide Indicator Count */}
                        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10">
                            {activeIndex + 1} / {slides.length}
                        </div>

                        {/* Image variant picker — shown when multiple versions exist */}
                        {variants.length > 1 && (
                            <div className="absolute bottom-20 left-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                {variants.map((url, vi) => (
                                    <button
                                        key={vi}
                                        onClick={(e) => { e.stopPropagation(); setSelectedVariants(prev => ({ ...prev, [activeIndex]: vi })); }}
                                        title={`Variant ${vi + 1} of ${variants.length}`}
                                        className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all shadow-md ${activeVariantIdx === vi ? 'border-white scale-110' : 'border-white/30 hover:border-white/70'}`}
                                    >
                                        <img src={resolveUrl(url)} className="w-full h-full object-cover" alt={`v${vi + 1}`} />
                                    </button>
                                ))}
                                <div className="text-[9px] text-white/70 text-center font-bold tracking-wide">
                                    {activeVariantIdx + 1}/{variants.length}
                                </div>
                            </div>
                        )}

                        {/* Download */}
                        <div className="absolute bottom-20 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <div className="p-2 bg-black/30 backdrop-blur-md rounded-lg text-white/80 hover:text-white cursor-pointer transition-colors shadow-lg">
                                <Download className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video flex items-center justify-center text-slate-400 bg-slate-50 border-y border-slate-100">
                        <div className="text-center">
                            <Repeat2 className="h-8 w-8 mx-auto mb-2 opacity-40 animate-pulse" />
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Post de Texto</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Reactions Count */}
            <div className="px-3 py-3 flex items-center justify-between border-b border-[#f0f0f0] text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 items-center">
                        <div className="h-4.5 w-4.5 rounded-full bg-[#0a66c2] flex items-center justify-center border-2 border-white shadow-sm">
                            <ThumbsUp className="h-2.5 w-2.5 text-white fill-white" />
                        </div>
                        <div className="h-4.5 w-4.5 rounded-full bg-[#e57d20] flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-[8px] text-white font-bold">💡</span>
                        </div>
                    </div>
                    <span className="hover:text-[#0a66c2] hover:underline cursor-pointer ml-1">128 • 42 comentários</span>
                </div>
                <div className="flex gap-2">
                    <span className="hover:text-[#0a66c2] hover:underline cursor-pointer">12 compartilhamentos</span>
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-1 py-1 flex items-center justify-around">
                <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all group">
                    <ThumbsUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-semibold">Gostei</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all group">
                    <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-semibold">Comentar</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all group">
                    <Repeat2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-semibold">Compartilhar</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all group">
                    <Send className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-semibold">Enviar</span>
                </button>
            </div>
        </div>
    );
}
