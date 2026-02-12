import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";

export default function Blog() {
  const { t } = useLanguage();
  const { data: blogPosts, isLoading } = useBlogPosts(true); // Fetch published posts only

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
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-display tracking-tight">
            {t("blog.title")}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t("blog.subtitle")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {(!blogPosts || blogPosts.length === 0) ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-500">{t("blog.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                {post.featured_image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
                    {post.category && (
                      <Badge variant="secondary" className="font-normal">
                        {post.category.name}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.published_at
                        ? format(new Date(post.published_at), "d MMMM, yyyy", { locale: ptBR })
                        : format(new Date(post.created_at), "d MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 leading-tight">
                    {post.title}
                  </h2>

                  <p className="text-slate-600 mb-6 line-clamp-3 text-sm flex-grow">
                    {post.excerpt || post.content.substring(0, 150) + "..."}
                  </p>

                  <Link to={`/blog/${post.slug}`} className="mt-auto">
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent hover:text-primary group">
                      {t("blog.readMore")}
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
