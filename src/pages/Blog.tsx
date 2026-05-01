import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Calendar, ArrowRight } from "lucide-react";

const BLOG_CARD_FALLBACK_IMAGE = "/images/blog/lifetrek-blog-cover-horizontal.png";

export default function Blog() {
  const { t } = useLanguage();
  const { data: blogPosts, isLoading } = useBlogPosts(true); // Fetch published posts only
  const visibleBlogPosts = (blogPosts || []).slice(0, 3);
  const tSafe = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6 font-display tracking-tight">
            {tSafe("blog.title", "Blog Lifetrek Medical")}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {tSafe("blog.subtitle", "Insights sobre manufatura médica, supply chain e inovação.")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {visibleBlogPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-500">{tSafe("blog.empty", "Nenhum artigo publicado no momento.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleBlogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="h-48 overflow-hidden bg-slate-100">
                  <img
                    src={post.featured_image || post.hero_image_url || BLOG_CARD_FALLBACK_IMAGE}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.published_at
                        ? format(new Date(post.published_at), "d MMMM, yyyy", { locale: ptBR })
                        : format(new Date(post.created_at), "d MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-primary mb-3 line-clamp-2 leading-tight">
                    {post.title}
                  </h2>

                  <p className="text-slate-600 mb-6 line-clamp-3 text-sm flex-grow">
                    {post.excerpt || post.content.substring(0, 150) + "..."}
                  </p>

                  <Link to={`/blog/${post.slug}`} className="mt-auto">
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-primary group">
                      {tSafe("blog.readMore", "Ler mais")}
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
