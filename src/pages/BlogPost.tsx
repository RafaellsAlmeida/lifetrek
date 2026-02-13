import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { useBlogAnalytics } from "@/hooks/useBlogAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const SITE_URL = "https://lifetrek-medical.com";

const resolveAbsoluteUrl = (value: string | null | undefined) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
};

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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || "");
  const { trackCtaClick } = useBlogAnalytics(post?.id);

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || post?.seo_description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Artigo não encontrado</h1>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const publishedAt = post.published_at || post.created_at;
  const plainTextContent = stripHtml(post.content || "");
  const metaDescription = clampText(post.seo_description || post.excerpt || plainTextContent, 160);
  const readTimeMinutes = estimateReadTime(plainTextContent);
  const wordCount = plainTextContent.split(/\s+/).filter(Boolean).length;
  const articleKeywords = Array.from(new Set((post.keywords || []).filter(Boolean)));
  const featuredImageUrl = resolveAbsoluteUrl(post.featured_image);
  const metadataSources = Array.isArray((post as any)?.metadata?.sources)
    ? (post as any).metadata.sources.filter((url: unknown) => typeof url === "string" && url.startsWith("http"))
    : [];
  const articleSources = Array.from(new Set([
    ...((post as any).news_sources || []),
    ...metadataSources,
  ])).filter((url) => typeof url === "string" && url.startsWith("http"));
  const faqEntries = extractFaqEntries(post.content || "");
  const displayAuthor = post.author_name || "Equipe Lifetrek Medical";
  const headline = post.seo_title || post.title;

  return (
    <>
      <Helmet>
        <title>{headline} | Lifetrek Medical Blog</title>
        <meta name="description" content={metaDescription} />
        {articleKeywords.length > 0 && <meta name="keywords" content={articleKeywords.join(", ")} />}
        <meta name="author" content={displayAuthor} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
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
        {featuredImageUrl && <meta property="og:image" content={featuredImageUrl} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={headline} />
        <meta name="twitter:description" content={metaDescription} />
        {featuredImageUrl && <meta name="twitter:image" content={featuredImageUrl} />}
        
        {/* Article Schema */}
        <meta httpEquiv="content-language" content="pt-BR" />
        <meta name="robots" content="index, follow" />
        
        {/* Article Schema with Reading Time */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: headline,
            description: metaDescription,
            image: featuredImageUrl,
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
            wordCount,
            timeRequired: `PT${readTimeMinutes}M`,
            citation: articleSources,
          })}
        </script>
        
        {/* Breadcrumb Schema for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://lifetrek-medical.com" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://lifetrek-medical.com/blog" },
              { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl }
            ]
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

      <article className="min-h-screen bg-background">
        {/* Hero Banner with Gradient Overlay */}
        <div className="relative w-full min-h-[50vh] md:min-h-[60vh] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5">
          {post.featured_image ? (
            <>
              <img
                src={post.featured_image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted/30 to-secondary/20" />
          )}
          
          {/* Content Overlay */}
          <div className="relative z-10 container mx-auto px-4 max-w-4xl h-full flex flex-col justify-end py-16">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Blog
            </Link>

            {post.category && (
              <Badge variant="secondary" className="mb-6 w-fit bg-primary/10 text-primary border-primary/20">
                {post.category.name}
              </Badge>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.published_at
                  ? format(new Date(post.published_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : format(new Date(post.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {readTimeMinutes} min de leitura
              </span>
              <span>Por {displayAuthor}</span>
              <Button variant="ghost" size="sm" onClick={handleShare} className="ml-auto">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>

        {/* Content with Improved Spacing and Gradient Decorations */}
        <div className="container mx-auto px-4 max-w-3xl py-20">
          <div
            className="prose prose-lg max-w-none dark:prose-invert 
              prose-headings:text-foreground prose-headings:font-bold
              prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-20 prose-h2:mb-10 prose-h2:relative prose-h2:pl-6
              prose-h2:before:content-[''] prose-h2:before:absolute prose-h2:before:left-0 prose-h2:before:top-0 prose-h2:before:bottom-0 prose-h2:before:w-1 prose-h2:before:rounded-full
              prose-h2:before:bg-gradient-to-b prose-h2:before:from-primary prose-h2:before:via-green-500 prose-h2:before:to-orange-400
              prose-h3:text-xl prose-h3:mt-16 prose-h3:mb-8
              prose-p:text-muted-foreground prose-p:leading-[1.9] prose-p:mb-8 prose-p:text-base prose-p:md:text-lg
              prose-li:text-muted-foreground prose-li:leading-[1.9] prose-li:my-3
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-gradient-to-r prose-blockquote:from-primary/10 prose-blockquote:to-transparent prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:rounded-r-lg prose-blockquote:my-12 prose-blockquote:italic
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
              prose-ul:my-10 prose-ol:my-10 prose-ul:space-y-2 prose-ol:space-y-2
              [&>p:first-of-type]:text-xl [&>p:first-of-type]:md:text-2xl [&>p:first-of-type]:font-medium [&>p:first-of-type]:text-foreground [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* CTA Section with Gradient Background */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted/50 to-secondary/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-50" />
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Precisa de implantes médicos de alta precisão?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Entre em contato para discutir seu projeto e descobrir como podemos ajudar.
            </p>
            <Link to="/contact" onClick={() => trackCtaClick()}>
              <Button size="lg" className="px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-shadow">
                Fale Conosco
              </Button>
            </Link>
          </div>
        </section>
      </article>
    </>
  );
};

export default BlogPost;
