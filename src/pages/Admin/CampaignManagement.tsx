// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Image as ImageIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CampaignManagement() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["linkedin_generation_logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("linkedin_generation_logs")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const stats = {
        total: logs?.length || 0,
        success: logs?.filter(l => l.status === "completed").length || 0,
        failed: logs?.filter(l => l.status === "failed").length || 0,
        totalImages: logs?.reduce((acc, curr) => acc + (curr.images_generated_count || 0), 0) || 0,
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Campanhas</h1>
                <p className="text-muted-foreground">Histórico e performance das gerações de conteúdo.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Gerações</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Falhas</CardTitle>
                        <XCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Imagens Geradas</CardTitle>
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.totalImages}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Execução</CardTitle>
                    <CardDescription>Logs detalhados das últimas gerações de carrosséis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Tópico</TableHead>
                                <TableHead>Público</TableHead>
                                <TableHead className="text-center">Imagens</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.slice(0, 50).map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate" title={log.topic || ''}>
                                        {log.topic || 'N/A'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={log.target_audience || ''}>
                                        {log.target_audience || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {log.images_generated_count > 0 ? (
                                            <Badge variant="secondary">{log.images_generated_count}</Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {log.execution_time_ms ? `${(log.execution_time_ms / 1000).toFixed(1)}s` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={log.status === "completed" ? "default" : log.status === "failed" ? "destructive" : "outline"}>
                                            {log.status === "completed" ? "Sucesso" : log.status === "failed" ? "Falha" : "Em andamento"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
