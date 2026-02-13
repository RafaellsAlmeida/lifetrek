import { useParams, Link } from "react-router-dom";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Printer, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";

const SITE_URL = "https://lifetrek-medical.com";

const stripHtml = (html: string) =>
    html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const clampText = (value: string, maxLength: number) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

const decodeHtmlEntities = (text: string) => {
    const parser = new DOMParser();
    return parser.parseFromString(text, "text/html").documentElement.textContent || text;
};

const extractFaqEntries = (html: string) => {
    const faqSectionMatch = html.match(/<h2[^>]*>[^<]*(Perguntas frequentes|FAQ)[^<]*<\/h2>([\s\S]*)/i);
    if (!faqSectionMatch) return [];

    const sectionHtml = faqSectionMatch[2] || "";
    const entries: Array<{ question: string; answer: string }> = [];
    const qaRegex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match: RegExpExecArray | null = null;

    while ((match = qaRegex.exec(sectionHtml)) !== null && entries.length < 5) {
        const question = decodeHtmlEntities(stripHtml(match[1] || ""));
        const answer = decodeHtmlEntities(stripHtml(match[2] || ""));
        if (question.length >= 8 && answer.length >= 20) {
            entries.push({ question, answer });
        }
    }

    return entries;
};

const isLikelyHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content);

export default function BlogPostDetails() {
    const { slug } = useParams();
    const { data: post, isLoading, error } = useBlogPost(slug || "");

    const handleShare = async () => {
        if (!post) return;
        const shareData = {
            title: post.title,
            text: post.excerpt || post.seo_description || post.title,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch {
                // User cancelled; fallback to clipboard below.
            }
        }

        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a área de transferência.");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-slate-800">Artigo não encontrado</h1>
                <Link to="/blog">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Blog
                    </Button>
                </Link>
            </div>
        );
    }

    const content = post.content || "";
    const plainTextContent = stripHtml(content);
    const words = plainTextContent.split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
    const publishedAt = post.published_at || post.created_at;
    const headline = post.seo_title || post.title;
    const metaDescription = clampText(post.seo_description || post.excerpt || plainTextContent, 160);
    const metadataEntityKeywords = Array.isArray((post as any)?.metadata?.entity_keywords)
        ? ((post as any).metadata.entity_keywords as string[])
        : [];
    const metadataPillarKeyword = typeof (post as any)?.metadata?.pillar_keyword === "string"
        ? (post as any).metadata.pillar_keyword
        : "";
    const articleKeywords = Array.from(
        new Set(
            [
                ...((post.keywords || []) as string[]),
                ...metadataEntityKeywords,
                metadataPillarKeyword,
            ]
                .filter(Boolean)
                .map((keyword) => String(keyword).trim())
                .filter((keyword) => keyword.length > 0)
        )
    );
    const metadataSources = Array.isArray((post as any)?.metadata?.sources)
        ? (post as any).metadata.sources.filter((url: unknown) => typeof url === "string" && url.startsWith("http"))
        : [];
    const articleSources = Array.from(new Set(metadataSources));
    const faqEntries = extractFaqEntries(content);
    const displayAuthor = post.author_name || "Equipe Lifetrek Medical";
    const showHtmlContent = isLikelyHtml(content);

    return (
        <div className="min-h-screen bg-white pb-20">
            <Helmet>
                <title>{headline} | Lifetrek Medical Blog</title>
                <meta name="description" content={metaDescription} />
                {articleKeywords.length > 0 && <meta name="keywords" content={articleKeywords.join(", ")} />}
                <meta name="author" content={displayAuthor} />
                <meta httpEquiv="content-language" content="pt-BR" />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={canonicalUrl} />

                <meta property="og:title" content={headline} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:locale" content="pt_BR" />
                <meta property="og:site_name" content="Lifetrek Medical" />
                <meta property="article:published_time" content={publishedAt} />
                <meta property="article:modified_time" content={post.updated_at} />
                {post.category?.name && <meta property="article:section" content={post.category.name} />}
                {articleKeywords.map((keyword) => (
                    <meta key={keyword} property="article:tag" content={keyword} />
                ))}
                {post.featured_image && <meta property="og:image" content={post.featured_image} />}

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={headline} />
                <meta name="twitter:description" content={metaDescription} />
                {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline,
                        description: metaDescription,
                        image: post.featured_image,
                        author: {
                            "@type": "Person",
                            name: displayAuthor,
                        },
                        publisher: {
                            "@type": "Organization",
                            name: "Lifetrek Medical",
                            url: SITE_URL,
                            logo: {
                                "@type": "ImageObject",
                                url: `${SITE_URL}/logo.png`,
                            },
                        },
                        datePublished: publishedAt,
                        dateModified: post.updated_at,
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": canonicalUrl,
                        },
                        inLanguage: "pt-BR",
                        url: canonicalUrl,
                        articleSection: post.category?.name || "Blog",
                        keywords: articleKeywords.join(", "),
                        wordCount: words,
                        timeRequired: `PT${readTime}M`,
                        citation: articleSources,
                    })}
                </script>

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
                            { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
                        ],
                    })}
                </script>

                {faqEntries.length > 0 && (
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: faqEntries.map((entry) => ({
                                "@type": "Question",
                                name: entry.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: entry.answer,
                                },
                            })),
                        })}
                    </script>
                )}
            </Helmet>

            {/* Hero Section */}
            <div className="bg-slate-50 pt-16 pb-20 border-b">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link to="/blog" className="inline-flex items-center text-slate-500 hover:text-primary mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Blog
                    </Link>

                    <div className="flex gap-3 mb-6">
                        {post.category && (
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {post.category.name}
                            </Badge>
                        )}
                        <span className="flex items-center text-sm text-slate-500 gap-2">
                            <Clock className="w-4 h-4" />
                            {readTime} min de leitura
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-8">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{displayAuthor}</p>
                                <p className="text-xs text-slate-500">
                                    {post.published_at
                                        ? format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })
                                        : format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.print()}>
                                <Printer className="w-4 h-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
                <div className="container mx-auto px-4 max-w-5xl -mt-10 mb-12">
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-[400px] object-cover rounded-xl shadow-lg"
                    />
                </div>
            )}

            {/* Content using Markdown */}
            <div className="container mx-auto px-4 max-w-3xl">
                {showHtmlContent ? (
                    <article
                        className="prose prose-slate prose-lg max-w-none
                            prose-headings:text-slate-900 prose-headings:font-bold
                            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                            prose-p:text-slate-700 prose-p:leading-8 prose-p:mb-6
                            prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:mb-6
                            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:p-6 prose-blockquote:rounded-r"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                ) : (
                    <article className="prose prose-slate prose-lg max-w-none">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 className="hidden" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6" {...props} />,
                                p: ({ node, ...props }) => <p className="text-slate-700 leading-8 mb-6" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-6 text-slate-700" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                                img: ({ node, ...props }) => <img className="rounded-lg shadow-md my-8 w-full" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-primary bg-slate-50 p-6 rounded-r italic text-slate-700 my-8 font-serif text-lg" {...props} />
                                )
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </article>
                )}

                {/* Tags */}
                {articleKeywords.length > 0 && (
                    <div className="mt-12 pt-8 border-t">
                        <p className="text-sm font-semibold text-slate-500 mb-3">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {articleKeywords.map(tag => (
                                <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
