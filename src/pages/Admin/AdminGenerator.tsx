
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PRIORITY_TOPICS = [
    {
        topic: "Whitepaper: Usinagem Suíça para Dispositivos Médicos - Guia Técnico",
        targetAudience: "Engenheiros de Manufatura e R&D",
        painPoint: "Necessidade de alta precisão (<5 microns) em componentes complexos e pequenos",
        desiredOutcome: "Compreender como a usinagem suíça garante repetibilidade e acabamento superior",
        proofPoints: ["Capacidade de 12 eixos", "Micro-usinagem de titânio", "Acabamento sem rebarbas"],
        ctaAction: "Baixe o Whitepaper Técnico",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Guia: Sala Limpa ISO 7 e Montagem de Kits",
        targetAudience: "Gerentes de Qualidade e Operações",
        painPoint: "Risco de contaminação e conformidade com normas ANVISA/ISO",
        desiredOutcome: "Garantir processo de montagem estéril e seguro para kits cirúrgicos",
        proofPoints: ["Monitoramento de partículas 24/7", "Fluxo laminar", "Equipe treinada em paramentação"],
        ctaAction: "Conheça nossa infraestrutura de Sala Limpa",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Scorecard de Risco de Supply Chain 2026",
        targetAudience: "Diretores de Supply Chain",
        painPoint: "Vulnerabilidade da cadeia global e interrupções inesperadas",
        desiredOutcome: "Avaliar e mitigar riscos de fornecimento crítico (geopolítico, logístico)",
        proofPoints: ["Matriz de risco interativa", "Diversificação de base de fornecedores", "Estoque de segurança estratégico"],
        ctaAction: "Avalie seu risco agora com o Scorecard",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Fluxo de Validacao de Fadiga para Implantes",
        targetAudience: "Engenheiros de Desenvolvimento de Produto",
        painPoint: "Falhas prematuras em implantes e longos ciclos de validação",
        desiredOutcome: "Acelerar a validação de fadiga garantindo segurança do paciente",
        proofPoints: ["Ensaios dinâmicos ISO", "Corpo de prova padronizado", "Análise de falha por MEV"],
        ctaAction: "Veja o fluxo de validação completo",
        profileType: "company",
        researchLevel: "light"
    },
    {
        topic: "Roadmap de 90 Dias para Migrar 1–3 SKUs para Produção Local",
        targetAudience: "Diretores de Supply Chain e Gerentes de Operações",
        painPoint: "Dependência de importação, variação cambial e longos lead times",
        desiredOutcome: "Plano claro para nacionalizar a produção com qualidade equivalente",
        proofPoints: ["Casos de sucesso em migração", "Redução de lead time para 30 dias", "Metrologia integrada"],
        ctaAction: "Baixe o Roadmap e inicie sua estratégia",
        profileType: "company",
        researchLevel: "light"
    }
];

export default function AdminGenerator() {
    const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const generateItem = async (item: typeof PRIORITY_TOPICS[0]) => {
        setStatus(prev => ({ ...prev, [item.topic]: 'loading' }));
        addLog(`Starting generation for: ${item.topic}`);

        try {
            const { data, error } = await supabase.functions.invoke('generate-linkedin-carousel', {
                body: item
            });

            if (error) throw error;

            addLog(`✅ Success for ${item.topic}: ${JSON.stringify(data.carousel?.caption?.substring(0, 50))}...`);
            setStatus(prev => ({ ...prev, [item.topic]: 'success' }));
            toast.success(`Generated: ${item.topic}`);
        } catch (error: any) {
            console.error(error);
            addLog(`❌ Error for ${item.topic}: ${error.message || JSON.stringify(error)}`);
            setStatus(prev => ({ ...prev, [item.topic]: 'error' }));
            toast.error(`Failed: ${item.topic}`);
        }
    };

    const generateAll = async () => {
        for (const item of PRIORITY_TOPICS) {
            if (status[item.topic] === 'success') continue;
            await generateItem(item);
            // Wait 2s to allow UI updates and prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        }
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-3xl font-bold">Admin Content Generator (Force Priority)</h1>

            <div className="flex gap-4">
                <Button onClick={generateAll} size="lg" className="w-full md:w-auto">
                    Generate All Priority Content
                </Button>
            </div>

            <div className="grid gap-4">
                {PRIORITY_TOPICS.map((item) => (
                    <Card key={item.topic}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.topic}
                            </CardTitle>
                            {status[item.topic] === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                            {status[item.topic] === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {status[item.topic] === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4">
                                Target: {item.targetAudience}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateItem(item)}
                                disabled={status[item.topic] === 'loading'}
                            >
                                Force Generate Single
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-900 text-slate-50">
                <CardHeader>
                    <CardTitle className="text-white">Live Logs</CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xs space-y-1 h-64 overflow-y-auto">
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                    {logs.length === 0 && <div className="text-slate-500">Waiting for logs...</div>}
                </CardContent>
            </Card>
        </div>
    );
}
