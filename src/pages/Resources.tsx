import { useResources } from "@/hooks/useResources";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import {
    Tabs,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    FileText,
    Calculator,
    CheckSquare,
    ArrowRight,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import {
    TRACEABILITY_CHECKLIST_DESCRIPTION,
    TRACEABILITY_CHECKLIST_PERSONA,
    TRACEABILITY_CHECKLIST_SLUG,
    TRACEABILITY_CHECKLIST_TITLE,
} from "@/constants/traceabilityChecklistFullContent";

export default function Resources() {
    const { language } = useLanguage();
    const { data: resources, isLoading, error } = useResources(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const seo = language === "pt"
        ? {
            title: "Recursos Técnicos | Lifetrek Medical",
            description: "Checklists, guias e calculadoras para fabricação de dispositivos médicos. Recursos técnicos gratuitos da Lifetrek Medical.",
            locale: "pt_BR",
        }
        : {
            title: "Technical Resources | Lifetrek Medical",
            description: "Technical checklists, guides, and calculators for medical device manufacturing, supply chain, and engineering teams.",
            locale: "en_US",
        };

    const getDisplayFields = (resource: NonNullable<typeof resources>[number]) => ({
        title: resource.slug === TRACEABILITY_CHECKLIST_SLUG ? TRACEABILITY_CHECKLIST_TITLE : resource.title,
        description:
            resource.slug === TRACEABILITY_CHECKLIST_SLUG
                ? TRACEABILITY_CHECKLIST_DESCRIPTION
                : resource.description,
        persona:
            resource.slug === TRACEABILITY_CHECKLIST_SLUG
                ? TRACEABILITY_CHECKLIST_PERSONA
                : resource.persona,
    });

    const filteredResources = resources?.filter(resource => {
        const display = getDisplayFields(resource);
        const matchesSearch = display.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            display.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeTab === "all" || resource.type === activeTab;

        return matchesSearch && matchesType;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'calculator': return <Calculator className="w-5 h-5" />;
            case 'checklist': return <CheckSquare className="w-5 h-5" />;
            case 'guide': return <FileText className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'calculator': return "Calculadora Interativa";
            case 'checklist': return "Checklist Técnico";
            case 'guide': return "Guia Prático";
            default: return "Recurso";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Helmet>
                <title>{seo.title}</title>
                <meta name="description" content={seo.description} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://lifetrek-medical.com/resources" />

                <meta property="og:title" content={seo.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://lifetrek-medical.com/resources" />
                <meta property="og:locale" content={seo.locale} />
                <meta property="og:site_name" content="Lifetrek Medical" />

                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={seo.title} />
                <meta name="twitter:description" content={seo.description} />
            </Helmet>

            {/* Header Section */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 font-display tracking-tight">
                        Central de Recursos <span className="text-primary">Estratégicos</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                        Ferramentas, calculadoras e checklists desenvolvidos para líderes de manufatura médica, supply chain e engenharia.
                    </p>

                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Buscar recursos (ex: TCO, ISO 13485, DFM)..."
                            className="pl-12 py-6 text-lg rounded-full shadow-lg border-slate-200 focus-visible:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-12">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-10">
                    <div className="flex justify-center">
                        <TabsList className="bg-white p-1 shadow-sm border h-auto rounded-full">
                            <TabsTrigger value="all" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Todos
                            </TabsTrigger>
                            <TabsTrigger value="calculator" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Calculadoras
                            </TabsTrigger>
                            <TabsTrigger value="checklist" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Checklists
                            </TabsTrigger>
                            <TabsTrigger value="guide" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                                Guias
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-96 bg-gray-200 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">Erro ao carregar recursos</h3>
                        <p className="text-slate-500 mt-2">Verifique o ambiente do Supabase e tente novamente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredResources?.map((resource) => {
                            const {
                                title: displayTitle,
                                description: displayDescription,
                                persona: displayPersona,
                            } = getDisplayFields(resource);

                            return (
                                <Card key={resource.id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden flex flex-col h-full bg-white">
                                    <div className={`h-3 w-full ${resource.type === 'calculator' ? 'bg-green-500' : resource.type === 'checklist' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 gap-1.5 py-1.5">
                                                {getIcon(resource.type)}
                                                {getTypeLabel(resource.type)}
                                            </Badge>
                                            {displayPersona && (
                                                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                                                    Para {displayPersona.split('/')[0]}
                                                </span>
                                            )}
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                                            {displayTitle}
                                        </CardTitle>
                                        <CardDescription className="text-base mt-2 line-clamp-3">
                                            {displayDescription}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {/* Placeholder for future specific metadata visualization */}
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-6">
                                        <div className="w-full flex gap-3">
                                            <Link to={`/resources/${resource.slug}`} className="w-full">
                                                <Button className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 group-hover:translate-y-[-2px] transition-all">
                                                    Acessar Recurso
                                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {filteredResources?.length === 0 && (
                    <div className="text-center py-20">
                        <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">Nenhum recurso encontrado</h3>
                        <p className="text-slate-500 mt-2">Tente ajustar sua busca ou filtro.</p>
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-slate-900 py-24 mt-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">precisa de uma análise personalizada?</h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                        Nossos engenheiros podem avaliar seu projeto específico e desenvolver uma estratégia de redução de custos.
                    </p>
                    <Link to="/contact">
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                            Falar com Engenharia
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
