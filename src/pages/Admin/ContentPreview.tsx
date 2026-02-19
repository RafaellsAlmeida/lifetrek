
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebsitePreviewFrame } from '@/components/admin/content/WebsitePreviewFrame';
import { ResourceDetailPreviewContent } from '@/components/admin/content/ResourceDetailPreviewContent';
import { LinkedInPostPreview } from '@/components/admin/content/LinkedInPostPreview';
import { InstagramPostPreview } from '@/components/admin/content/InstagramPostPreview';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type ContentType = 'resource' | 'linkedin' | 'blog' | 'instagram';

interface ContentData {
    id: string;
    title: string;
    description?: string;
    content?: string;
    slug?: string;
    type?: string;
    persona?: string;
    created_at?: string;
    [key: string]: any;
}

/**
 * Normalizes image URLs from various sources.
 * Fixes a common issue where local edge function URLs (localhost:8083) are persisted
 * but inaccessible from the client browser.
 */
const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    // Fix hardcoded localhost:8083 (local edge function port)
    if (url.includes('localhost:8083')) {
        // Assume these should be pointing to Supabase storage or external CDN
        // For now, if we see localhost:8083, it's likely a broken dev link
        // We'll try to extract the actual filename or path
        try {
            const urlObj = new URL(url);
            // If it's a storage path, we might be able to reconstruct it
            // But usually, it's safer to just return a placeholder if we can't fix it
            // or strip the localhost part if it's meant to be relative to the CDN
        } catch (e) {
            // Not a valid URL, just strip it
        }
    }

    return url;
};

const normalizeUrls = (urls: any): string[] => {
    if (!urls) return [];
    const arr = Array.isArray(urls) ? urls : [urls];
    return arr.map(normalizeImageUrl).filter(Boolean);
};

export default function ContentPreview() {
    const { type, id } = useParams<{ type: ContentType; id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [content, setContent] = useState<ContentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [igImageSet, setIgImageSet] = useState<'square' | 'original' | 'current'>('current');

    useEffect(() => {
        fetchContent();
    }, [type, id]);

    const fetchContent = async () => {
        if (!type || !id) return;

        setIsLoading(true);
        try {
            let data: ContentData | null = null;

            switch (type) {
                case 'resource': {
                    const { data: resource, error } = await supabase
                        .from('content_templates')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    data = resource;
                    break;
                }
                case 'linkedin': {
                    const { data: carousel, error } = await supabase
                        .from('linkedin_carousels')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    data = {
                        ...carousel,
                        title: carousel.topic,
                        description: carousel.caption?.substring(0, 200) + '...',
                    };
                    break;
                }
                case 'blog': {
                    const { data: post, error } = await supabase
                        .from('blog_posts')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    data = post;
                    break;
                }
                case 'instagram': {
                    const { data: post, error } = await (supabase
                        .from('instagram_posts' as any)
                        .select('*')
                        .eq('id', id)
                        .single() as any);
                    if (error) throw error;

                    // Normalize all image URLs in metadata and main record
                    const meta = post?.generation_metadata || {};
                    const normalizedPost = {
                        ...post,
                        image_urls: normalizeUrls(post.image_urls),
                        image_url: normalizeImageUrl(post.image_url),
                        generation_metadata: {
                            ...meta,
                            square_v1_image_urls: normalizeUrls(meta?.square_v1_image_urls),
                            prev_image_urls: normalizeUrls(meta?.prev_image_urls)
                        },
                        title: post.topic,
                        description: post.caption?.substring(0, 200) + '...'
                    };
                    data = normalizedPost;
                    break;
                }
            }

            setContent(data);
            if (type === 'instagram') {
                const meta = (data as any)?.generation_metadata;
                const hasSquare = meta && typeof meta === 'object' && Array.isArray(meta.square_v1_image_urls) && meta.square_v1_image_urls.length > 0;
                setIgImageSet(hasSquare ? 'square' : 'current');
            }
        } catch (error) {
            console.error('Error fetching content:', error);
            toast.error('Erro ao carregar conteúdo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!content || !type || !id) return;

        setIsApproving(true);
        try {
            const tableName = type === 'linkedin' ? 'linkedin_carousels' :
                type === 'blog' ? 'blog_posts' :
                    type === 'instagram' ? 'instagram_posts' : 'content_templates';

            const { error } = await supabase
                .from(tableName as any)
                .update({ status: 'approved' } as any)
                .eq('id', id);

            if (error) throw error;

            toast.success('Conteúdo aprovado com sucesso!');
            await queryClient.invalidateQueries({ queryKey: ['content_approval_items'] });
            await queryClient.invalidateQueries({ queryKey: ['approved_content_items'] });
            navigate('/admin/content-approval');
        } catch (error: any) {
            console.error('Error approving:', error);
            toast.error(`Erro ao aprovar: ${error.message}`);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!content || !type || !id) return;

        const reason = prompt('Motivo da rejeição:');
        if (!reason) return;

        setIsRejecting(true);
        try {
            const tableName = type === 'linkedin' ? 'linkedin_carousels' :
                type === 'blog' ? 'blog_posts' :
                    type === 'instagram' ? 'instagram_posts' : 'content_templates';

            const { error } = await supabase
                .from(tableName as any)
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                } as any)
                .eq('id', id);

            if (error) throw error;

            toast.success('Conteúdo rejeitado');
            await queryClient.invalidateQueries({ queryKey: ['content_approval_items'] });
            await queryClient.invalidateQueries({ queryKey: ['rejected_content_items'] });
            navigate('/admin/content-approval');
        } catch (error: any) {
            console.error('Error rejecting:', error);
            toast.error(`Erro ao rejeitar: ${error.message}`);
        } finally {
            setIsRejecting(false);
        }
    };

    const handleClose = () => {
        navigate('/admin/content-approval');
    };

    const getPreviewUrl = () => {
        if (!content) return '';
        const baseUrl = 'lifetrek-medical.com';

        switch (type) {
            case 'resource':
                return `${baseUrl}/resources/${content.slug || content.id}`;
            case 'blog':
                return `${baseUrl}/blog/${content.slug || content.id}`;
            case 'linkedin':
                return `linkedin.com/company/lifetrek-medical/posts`;
            case 'instagram':
                return `instagram.com/lifetrek.medical`;
            default:
                return baseUrl;
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
                <Loader2 className="h-12 w-12 animate-spin text-[#0a66c2]" />
            </div>
        );
    }

    if (!content) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
                <div className="text-white text-center">
                    <p className="text-xl mb-4">Conteúdo não encontrado</p>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white">
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <WebsitePreviewFrame
            url={getPreviewUrl()}
            title={content.title}
            onClose={handleClose}
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
        >
            {type === 'resource' && (
                <ResourceDetailPreviewContent resource={content} />
            )}

            {type === 'linkedin' && (
                <div className="min-h-screen bg-slate-100 flex items-center justify-center py-12 px-4">
                    <LinkedInPostPreview post={content} />
                </div>
            )}

            {type === 'blog' && (
                <div className="min-h-screen bg-white">
                    <div className="container max-w-4xl mx-auto py-20 px-6">
                        <header className="mb-12 text-center">
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                                {content.title}
                            </h1>
                            {content.excerpt && (
                                <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                                    {content.excerpt}
                                </p>
                            )}
                        </header>

                        <div className="prose prose-lg prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-img:rounded-2xl prose-img:shadow-xl">
                            <div dangerouslySetInnerHTML={{ __html: content.content || '' }} />
                        </div>
                    </div>
                </div>
            )}

            {type === 'instagram' && (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4 gap-6">
                    {/* Image Set Toggle */}
                    {(() => {
                        const meta = (content as any)?.generation_metadata;
                        const squareUrls = meta?.square_v1_image_urls || [];
                        const originalUrls = meta?.prev_image_urls || [];

                        if (squareUrls.length === 0 && originalUrls.length === 0) return null;

                        return (
                            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm z-10 transition-all hover:shadow-md">
                                {squareUrls.length > 0 && (
                                    <button
                                        onClick={() => setIgImageSet('square')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${igImageSet === 'square' ? 'bg-[#0a66c2] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        FIXED SQUARE (1:1)
                                    </button>
                                )}
                                {originalUrls.length > 0 && (
                                    <button
                                        onClick={() => setIgImageSet('original')}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${igImageSet === 'original' ? 'bg-[#0a66c2] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        RAW CLAUDE
                                    </button>
                                )}
                                <button
                                    onClick={() => setIgImageSet('current')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${igImageSet === 'current' ? 'bg-[#0a66c2] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                    DATABASE DEFAULT
                                </button>
                            </div>
                        );
                    })()}

                    <InstagramPostPreview
                        post={{
                            ...content,
                            image_urls: igImageSet === 'square' ? content.generation_metadata?.square_v1_image_urls :
                                igImageSet === 'original' ? content.generation_metadata?.prev_image_urls :
                                    content.image_urls
                        }}
                    />
                </div>
            )}
        </WebsitePreviewFrame>
    );
}
