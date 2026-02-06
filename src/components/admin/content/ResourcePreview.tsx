
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, ExternalLink, Calendar, User } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";

interface ResourcePreviewProps {
    resource: any;
}

export const ResourcePreview: React.FC<ResourcePreviewProps> = ({ resource }) => {
    if (!resource) return null;

    const data = resource.full_data || resource;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Meta Information Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-amber-600" />
                                Informações do Recurso
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</span>
                                <p className="font-medium leading-snug">{resource.title}</p>
                            </div>

                            {data.type && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</span>
                                    <div>
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors">
                                            {data.type}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {data.persona && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Persona Alvo</span>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <User className="h-4 w-4 text-slate-400" />
                                        {data.persona}
                                    </div>
                                </div>
                            )}

                            {data.slug && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL Pública</span>
                                    <div className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 break-all">
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                        <span>/resources/{data.slug}</span>
                                    </div>
                                </div>
                            )}

                            {resource.created_at && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Criado em</span>
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {new Date(resource.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full gap-2 justify-start">
                                <Download className="h-4 w-4" />
                                Exportar PDF
                            </Button>
                            <Button variant="ghost" className="w-full gap-2 justify-start text-muted-foreground">
                                <ExternalLink className="h-4 w-4" />
                                Visualizar Publicado
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-2">
                    <Card className="h-full flex flex-col min-h-[500px]">
                        <CardHeader className="border-b bg-slate-50/50">
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-xl">Conteúdo</CardTitle>
                                {data.description && (
                                    <CardDescription>{data.description}</CardDescription>
                                )}
                            </div>
                        </CardHeader>
                        <ScrollArea className="flex-1 max-h-[700px]">
                            <CardContent className="p-6 md:p-8">
                                {data.content ? (
                                    <div className="prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-slate-600 prose-a:text-blue-600 max-w-none">
                                        <ReactMarkdown>{data.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Nenhum conteúdo textual disponível.</p>
                                    </div>
                                )}
                            </CardContent>
                        </ScrollArea>
                    </Card>
                </div>
            </div>
        </div>
    );
};
