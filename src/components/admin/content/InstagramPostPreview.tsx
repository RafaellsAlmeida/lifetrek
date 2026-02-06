
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";

interface InstagramPostPreviewProps {
    post: any;
}

export function InstagramPostPreview({ post }: InstagramPostPreviewProps) {
    const hashtags = Array.isArray(post?.hashtags)
        ? post.hashtags
        : (typeof post?.hashtags === 'string' ? post.hashtags.split(',').map((s: string) => s.trim()) : []);

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

            {/* Main Image / Carousel Placeholder */}
            <div className="aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden">
                {post?.image_url ? (
                    <img
                        src={post.image_url}
                        alt="Instagram Content"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-center p-8 space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <Instagram className="h-8 w-8 text-pink-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Visual do Post</p>
                    </div>
                )}

                {post?.post_type === 'carousel' && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap">
                        1/5
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

import { Instagram } from "lucide-react";
