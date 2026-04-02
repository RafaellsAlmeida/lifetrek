import { Link } from "react-router-dom";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedResource } from "@/lib/featuredResource";

export function FeaturedResourceInlineCard({ resource }: { resource: FeaturedResource }) {
  return (
    <aside className="my-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Recurso relacionado</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">{resource.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{resource.description}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link to={`/resources/${resource.slug}`}>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            {resource.cta}
          </Button>
        </Link>
        <Link to="/resources" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          Ver todos os recursos
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
