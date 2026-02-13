/**
 * ContentPreview
 * 
 * Full-page website simulation preview for content approval workflow.
 * Shows stakeholders exactly how content will appear on the live site.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebsitePreviewFrame } from '@/components/admin/content/WebsitePreviewFrame';
import { ResourceDetailPreviewContent } from '@/components/admin/content/ResourceDetailPreviewContent';
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

export default function ContentPreview() {
    const { type, id } = useParams<{ type: ContentType; id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [content, setContent] = useState<ContentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

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
                        content: carousel.slides ? formatLinkedInSlides(carousel.slides) : ''
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
                    const { data: post, error } = await supabase
                        .from('instagram_posts')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (error) throw error;
                    data = {
                        ...post,
                        title: post.topic,
                        description: post.caption?.substring(0, 200) + '...'
                    };
                    break;
                }
            }

            setContent(data);
        } catch (error) {
            console.error('Error fetching content:', error);
            toast.error('Erro ao carregar conteúdo');
        } finally {
            setIsLoading(false);
        }
    };

    const formatLinkedInSlides = (slides: any): string => {
        if (!Array.isArray(slides)) return '';
        return slides.map((slide: any, idx: number) =>
            `## Slide ${idx + 1}: ${slide.headline || ''}\n\n${slide.body || slide.copy || ''}`
        ).join('\n\n---\n\n');
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
        );
    }

    if (!content) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900">
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
                <div className="min-h-screen bg-slate-50 py-12">
                    <div className="container max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border p-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">{content.title}</h1>
                            <div className="prose prose-slate max-w-none">
                                <ReactMarkdownFallback content={content.content || ''} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {type === 'blog' && (
                <div className="min-h-screen bg-slate-50 py-12">
                    <div className="container max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border p-8">
                            <h1 className="text-3xl font-bold text-slate-900 mb-4">{content.title}</h1>
                            {content.excerpt && (
                                <p className="text-xl text-slate-600 mb-8">{content.excerpt}</p>
                            )}
                            <div
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{ __html: content.content || '' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {type === 'instagram' && (
                <div className="min-h-screen bg-slate-50 py-12">
                    <div className="container max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            {(content.image_urls?.[0] || content.slides?.[0]?.image_url || content.slides?.[0]?.imageUrl) && (
                                <img
                                    src={content.image_urls?.[0] || content.slides?.[0]?.image_url || content.slides?.[0]?.imageUrl}
                                    alt={content.title}
                                    className="w-full aspect-square object-cover"
                                />
                            )}
                            <div className="p-6">
                                <p className="text-slate-700">{content.caption}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </WebsitePreviewFrame>
    );
}

// Simple fallback for ReactMarkdown in case the import isn't available
function ReactMarkdownFallback({ content }: { content: string }) {
    return (
        <div className="whitespace-pre-wrap">{content}</div>
    );
}
