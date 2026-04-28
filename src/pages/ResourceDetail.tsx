import { useParams, Link } from "react-router-dom";
import { useResource } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Share2, Download, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Mermaid from "@/components/agents/Mermaid";
import { useEffect, useState } from "react";
import { trackResourceView, trackResourceDownload } from "@/utils/trackAnalytics";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ResourceInteractiveBlocks from "@/components/resources/ResourceInteractiveBlocks";
import { flushPendingLeads, saveLeadWithCompat } from "@/utils/contactLeadCapture";
import { Helmet } from "react-helmet-async";
import {
    CHECKLIST_DFM_IMPLANTES_FULL_MARKDOWN,
    isChecklistDfmImplantesTeaserContent,
} from "@/constants/checklistDfmImplantesFullContent";

const LEAD_MAGNET_PDF_SLUGS = new Set([
    "scorecard-risco-supply-chain-2026",
    "checklist-transferencia-npi-producao",
    "checklist-producao-local",
]);

const stripMarkdown = (value: string) =>
    value
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/[*_~>-]/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const buildPublicPreview = (content: string) => {
    const normalized = content.replace(/\r\n/g, "\n").trim();
    if (!normalized) return "";

    const lines = normalized
        .split("\n")
        .filter((line) => !line.trim().startsWith("```"));
    const selected: string[] = [];
    let textLength = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (selected.length > 0 && selected[selected.length - 1] !== "") {
                selected.push("");
            }
            continue;
        }

        selected.push(line);
        textLength += stripMarkdown(trimmed).length;

        if (textLength >= 900 && selected.some((entry) => /^#{2,3}\s/.test(entry.trim()))) {
            break;
        }
    }

    return selected.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const extractMarkdownFaqEntries = (content: string) => {
    const faqStart = content.search(/^#{2,3}\s+.*(perguntas frequentes|faq).*/im);
    if (faqStart === -1) return [];

    const faqContent = content.slice(faqStart);
    const entries: Array<{ question: string; answer: string }> = [];
    const sections = faqContent.split(/\n(?=#{3,4}\s+)/g).slice(1);

    for (const section of sections) {
        const questionMatch = section.match(/^#{3,4}\s+(.+)$/m);
        if (!questionMatch) continue;

        const question = stripMarkdown(questionMatch[1] || "");
        const answer = stripMarkdown(section.replace(/^#{3,4}\s+.+$/m, "")).slice(0, 500);

        if (question.length >= 8 && answer.length >= 20) {
            entries.push({ question, answer });
        }

        if (entries.length >= 5) break;
    }

    return entries;
};

export default function ResourceDetail() {
    const { slug } = useParams();
    const { data: resource, isLoading, error } = useResource(slug || "");
    const { toast } = useToast();
    const [hasAccess, setHasAccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: ""
    });

    const rawResourceContent = (resource?.content ?? "").replace(/\\n/g, "\n");
    const resourceContent =
        resource?.slug === "checklist-dfm-implantes" &&
        isChecklistDfmImplantesTeaserContent(rawResourceContent)
            ? CHECKLIST_DFM_IMPLANTES_FULL_MARKDOWN
            : rawResourceContent;
    const resolvedSlug = resource?.slug ?? slug ?? "resource";
    const metadata = (resource?.metadata ?? {}) as Record<string, unknown>;
    const downloadUrl = typeof metadata.download_url === "string" ? metadata.download_url : undefined;
    const publicPreviewMarkdown = buildPublicPreview(resourceContent);
    const schemaContent = hasAccess ? resourceContent : publicPreviewMarkdown;
    const faqEntries = extractMarkdownFaqEntries(schemaContent);

    const roadmapFlowchart = `
    flowchart LR
      A[Fase 1: Diagnóstico] --> B[Fase 2: Prototipagem]
      B --> C[Fase 3: Lote Piloto]
      C --> D[Fase 4: Escala]
    `;

    // Check if user has already unlocked this resource
    useEffect(() => {
        if (slug) {
            const unlocked = localStorage.getItem(`resource_unlocked_${slug}`);
            if (unlocked) {
                setHasAccess(true);
            }
        }
    }, [slug]);

    useEffect(() => {
        if (!resource?.slug) return;
        trackResourceView(resource.slug, resource.title);
    }, [resource?.slug, resource?.title]);

    useEffect(() => {
        void flushPendingLeads();
        const handleOnline = () => {
            void flushPendingLeads();
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, []);

    if (isLoading) return <LoadingSpinner />;
    if (error || !resource) return <div className="p-8 text-center">Recurso não encontrado.</div>;

    const SITE_URL = "https://lifetrek-medical.com";
    const canonicalUrl = `${SITE_URL}/resources/${resource.slug}`;
    const metaDescription = resource.description || resource.title;

    const getStructuredData = () => {
        switch (resource.type) {
            case 'guide':
                return {
                    "@context": "https://schema.org",
                    "@type": "TechArticle",
                    headline: resource.title,
                    description: metaDescription,
                    author: { "@type": "Organization", name: "Lifetrek Medical" },
                    publisher: {
                        "@type": "Organization",
                        name: "Lifetrek Medical",
                        url: SITE_URL,
                        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
                    },
                    datePublished: resource.created_at,
                    dateModified: resource.updated_at || resource.created_at,
                    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
                    inLanguage: "pt-BR",
                    url: canonicalUrl,
                };
            case 'checklist': {
                const headings = schemaContent
                    .split("\n")
                    .filter((line: string) => /^#{1,3}\s/.test(line))
                    .map((line: string) => line.replace(/^#{1,3}\s+/, "").trim());
                return {
                    "@context": "https://schema.org",
                    "@type": "HowTo",
                    name: resource.title,
                    description: metaDescription,
                    step: headings.map((text: string, i: number) => ({
                        "@type": "HowToStep",
                        position: i + 1,
                        name: text,
                    })),
                    inLanguage: "pt-BR",
                    url: canonicalUrl,
                };
            }
            case 'calculator':
                return {
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    name: resource.title,
                    description: metaDescription,
                    url: canonicalUrl,
                    applicationCategory: "BusinessApplication",
                    operatingSystem: "Any",
                    inLanguage: "pt-BR",
                };
            default:
                return {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: resource.title,
                    description: metaDescription,
                    url: canonicalUrl,
                    inLanguage: "pt-BR",
                };
        }
    };
    const structuredData = getStructuredData();
    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Recursos", item: `${SITE_URL}/resources` },
            { "@type": "ListItem", position: 3, name: resource.title, item: canonicalUrl },
        ],
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUnlocking(true);

        const unlockLocally = () => {
            if (slug) {
                localStorage.setItem(`resource_unlocked_${slug}`, "true");
            }
            setHasAccess(true);
            setIsModalOpen(false);
        };

        try {
            const saveResult = await saveLeadWithCompat({
                name: formData.name?.trim() || "Lead de recurso",
                email: formData.email,
                company: formData.company || undefined,
                phone: "Nao informado",
                project_type: "other_medical",
                project_types: ["other_medical"],
                technical_requirements: `Resource unlock: ${resolvedSlug}`,
                message: `Mini auth unlock for /resources/${resolvedSlug}`,
                source: "website",
            });

            unlockLocally();

            if (saveResult.status === "saved") {
                toast({
                    title: "Recurso desbloqueado!",
                    description: "Boa leitura.",
                });
            } else {
                toast({
                    title: "Recurso desbloqueado!",
                    description: "Sincronizacao do lead pendente. Vamos tentar novamente automaticamente.",
                });
            }
        } catch (error) {
            console.error("Unexpected error while unlocking resource:", error);
            unlockLocally();
            toast({
                title: "Recurso desbloqueado!",
                description: "Sincronizacao do lead pendente. Vamos tentar novamente automaticamente.",
            });
        } finally {
            setIsUnlocking(false);
            void flushPendingLeads();
        }
    };

    const handleShare = async () => {
        const currentUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: resource.title,
                    text: resource.description,
                    url: currentUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(currentUrl);
            toast({
                title: "Link copiado",
                description: "O link do recurso foi copiado para a area de transferencia.",
            });
        } catch (error) {
            console.error("Error sharing resource:", error);
            toast({
                variant: "destructive",
                title: "Nao foi possivel compartilhar",
                description: "Tente novamente em alguns instantes.",
            });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        try {
            const currentUrl = window.location.href;

            if (downloadUrl) {
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.click();
                await trackResourceDownload(resolvedSlug, resource.title, "external");
                return;
            }

            if (LEAD_MAGNET_PDF_SLUGS.has(resolvedSlug)) {
                const { jsPDF } = await import("jspdf");
                const doc = new jsPDF({ unit: "pt", format: "a4" });
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 56;
                const maxWidth = pageWidth - margin * 2;
                const contentText = stripMarkdown(resourceContent);
                const lines = doc.splitTextToSize(contentText, maxWidth) as string[];

                doc.setFillColor(0, 79, 143);
                doc.rect(0, 0, pageWidth, 84, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.text("Lifetrek Medical", margin, 34);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.text("Resource Brief", margin, 54);

                doc.setTextColor(17, 24, 39);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(19);
                doc.text(resource.title, margin, 128, { maxWidth });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.setTextColor(71, 85, 105);
                doc.text(`Fonte: ${currentUrl}`, margin, 152, { maxWidth });
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.text(lines, margin, 184, {
                    maxWidth,
                    lineHeightFactor: 1.45,
                });

                doc.save(`${resolvedSlug}.pdf`);
                await trackResourceDownload(resolvedSlug, resource.title, "pdf");
                toast({
                    title: "Download iniciado",
                    description: "PDF gerado com identidade visual da Lifetrek.",
                });
                return;
            }

            const generatedFile = [
                `# ${resource.title}`,
                "",
                resource.description,
                "",
                `Fonte: ${currentUrl}`,
                "",
                resourceContent,
                "",
            ].join("\n");

            const blob = new Blob([generatedFile], { type: "text/markdown;charset=utf-8" });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${resolvedSlug}.md`;
            link.click();
            URL.revokeObjectURL(blobUrl);

            await trackResourceDownload(resolvedSlug, resource.title, "md");
            toast({
                title: "Download iniciado",
                description: "Material exportado em formato Markdown.",
            });
        } catch (error) {
            console.error("Error downloading resource:", error);
            toast({
                variant: "destructive",
                title: "Falha no download",
                description: "Nao foi possivel gerar o arquivo.",
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Helmet>
                <title>{resource.title} | Lifetrek Medical</title>
                <meta name="description" content={metaDescription} />
                <meta name="robots" content="index, follow" />
                <meta httpEquiv="content-language" content="pt-BR" />
                <link rel="canonical" href={canonicalUrl} />

                <meta property="og:title" content={resource.title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:locale" content="pt_BR" />
                <meta property="og:site_name" content="Lifetrek Medical" />

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={resource.title} />
                <meta name="twitter:description" content={metaDescription} />

                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbData)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
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

            {/* Header Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="container mx-auto px-4 py-8">
                    <Link to="/resources" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Recursos
                    </Link>

                    <div className="flex flex-wrap gap-3 mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            {resource.type === 'calculator' ? 'Ferramenta Interativa' :
                                resource.type === 'checklist' ? 'Checklist' : 'Guia Prático'}
                        </Badge>
                        <Badge variant="outline" className="text-slate-500 border-slate-200">
                            Tempo de leitura: {resource.read_time_minutes || 5} min
                        </Badge>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                        {resource.title}
                    </h1>

                    <p className="text-lg text-slate-600 max-w-3xl mb-6 leading-relaxed">
                        {resource.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{resource.created_at ? format(new Date(resource.created_at), "d 'de' MMMM, yyyy", { locale: ptBR }) : 'Data não disponível'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Equipe Lifetrek</span>
                        </div>
                        <div className="flex-1"></div>
                        <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Compartilhar
                        </Button>
                        <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {!hasAccess ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {publicPreviewMarkdown && (
                            <div className="bg-white rounded-xl shadow-sm border p-8 md:p-10">
                                <div className="mb-6">
                                    <Badge variant="outline" className="border-primary/30 text-primary">
                                        Resumo publico
                                    </Badge>
                                </div>
                                <div className="prose prose-slate prose-lg max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-slate-900 mb-6" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-slate-800 mb-4 mt-8 pb-2 border-b" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-slate-800 mb-3 mt-6" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-6" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-slate-700 leading-relaxed" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-slate-700 leading-relaxed mb-6" {...props} />,
                                            table: ({ node, ...props }) => (
                                                <div className="overflow-x-auto my-8 border rounded-lg">
                                                    <table className="min-w-full divide-y divide-slate-200" {...props} />
                                                </div>
                                            ),
                                            thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                            tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200 bg-white" {...props} />,
                                            th: ({ node, ...props }) => (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />
                                            ),
                                            td: ({ node, ...props }) => <td className="px-6 py-4 text-sm text-slate-500 align-top" {...props} />,
                                        }}
                                    >
                                        {publicPreviewMarkdown}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Desbloqueie o recurso completo</h2>
                            <p className="text-slate-600 mb-6">
                                Informe seu email corporativo para acessar o conteudo completo. Nome e empresa sao opcionais.
                            </p>
                            <Button size="lg" onClick={() => setIsModalOpen(true)}>
                                Desbloquear agora
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border p-8 md:p-12">
                        <div className="prose prose-slate prose-lg max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-10" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-slate-800 mb-4 mt-8 pb-2 border-b" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-2 mb-6" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-slate-700 leading-relaxed" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-slate-700 leading-relaxed mb-6" {...props} />,
                                    a: ({ href, children, ...props }) => (
                                        <a
                                            href={href}
                                            className="text-primary font-medium underline underline-offset-2 hover:text-primary/90"
                                            target={href?.startsWith("http") ? "_blank" : undefined}
                                            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                                            {...props}
                                        >
                                            {children}
                                        </a>
                                    ),
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto my-8 border rounded-lg">
                                            <table className="min-w-full divide-y divide-slate-200" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                    tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200 bg-white" {...props} />,
                                    tr: ({ node, ...props }) => <tr {...props} />,
                                    th: ({ node, ...props }) => (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />
                                    ),
                                    td: ({ node, ...props }) => <td className="px-6 py-4 text-sm text-slate-500 align-top" {...props} />,
                                    code: ({ className, children, ...props }) => {
                                        const language = className?.replace("language-", "");
                                        if (language === "mermaid") {
                                            return (
                                                <div className="my-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                    <Mermaid chart={String(children).trim()} />
                                                </div>
                                            );
                                        }
                                        return (
                                            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm text-slate-800" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-primary bg-slate-50 p-4 rounded-r italic text-slate-700 my-6" {...props} />
                                    )
                                }}
                            >
                                {resourceContent}
                            </ReactMarkdown>
                        </div>


                        {resource.slug === "roadmap-90-dias-migracao-skus" && (
                            <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-slate-900">Linha do tempo visual</h3>
                                </div>
                                <Mermaid chart={roadmapFlowchart} />
                            </div>
                        )}

                        <ResourceInteractiveBlocks
                            slug={resource.slug}
                            formData={formData}
                            setIsModalOpen={setIsModalOpen}
                        />

                        {/* CTA Footer */}
                        <div className="mt-16 pt-8 border-t bg-slate-50 -mx-8 -mb-8 md:-mx-12 md:-mb-12 p-8 md:p-12 text-center rounded-b-xl">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Gostou deste recurso?</h3>
                            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                                Nossa equipe de engenharia pode ajudar sua empresa a implementar essas estrategias na pratica.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link to="/contact">
                                    <Button size="lg" className="px-8">
                                        Falar com um Especialista
                                    </Button>
                                </Link>
                                <Button variant="outline" size="lg" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar material
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Desbloquear recurso</DialogTitle>
                        <DialogDescription>
                            Insira seu email para acessar o conteudo completo. Nome e empresa sao opcionais.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUnlock} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo (opcional)</Label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email corporativo</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="voce@empresa.com"
                                value={formData.email}
                                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa (opcional)</Label>
                            <Input
                                id="company"
                                placeholder="Nome da sua empresa"
                                value={formData.company}
                                onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={isUnlocking}>
                                {isUnlocking ? "Liberando..." : "Desbloquear recurso"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
