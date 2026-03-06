import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import {
  ICP_EXPERIMENT_POSTS,
  WEBSITE_ICP_AUDIENCES,
  type IcpExperimentPost,
} from "@/config/linkedinIcpExperiment";

type JobStatus = "idle" | "loading" | "success" | "error";

export default function AdminGenerator() {
  const [status, setStatus] = useState<Record<string, JobStatus>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const postsByIcp = useMemo(() => {
    return WEBSITE_ICP_AUDIENCES.map((icp) => ({
      icp,
      posts: ICP_EXPERIMENT_POSTS.filter((post) => post.icpCode === icp.code),
    }));
  }, []);

  const addLog = (msg: string) =>
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const setPostStatus = (postId: string, next: JobStatus) =>
    setStatus((prev) => ({ ...prev, [postId]: next }));

  const generatePost = async (post: IcpExperimentPost) => {
    setPostStatus(post.id, "loading");
    addLog(`Iniciando geração [${post.icpCode}] ${post.topic}`);

    try {
      const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
        body: {
          platform: "linkedin",
          topic: post.topic,
          targetAudience: post.targetAudience,
          painPoint: post.painPoint,
          desiredOutcome: post.desiredOutcome,
          proofPoints: post.proofPoints.join("; "),
          ctaAction: post.ctaAction,
          format: "carousel",
          mode: "generate",
          numberOfCarousels: 1,
          researchLevel: "light",
          style_mode: "hybrid-composite",
          selectedEquipment: post.selectedEquipment || [],
          icpCode: post.icpCode,
          experimentId: post.id,
          visualDirection: post.visualDirection,
          copyDensity: post.copyDensity,
        },
      });

      if (error) throw error;
      const generatedTopic = data?.carousels?.[0]?.topic || post.topic;
      addLog(`✅ Gerado com sucesso: ${generatedTopic}`);
      setPostStatus(post.id, "success");
      toast.success(`Gerado: ${post.topic}`);
    } catch (err: any) {
      const message = err?.message || "Erro desconhecido";
      addLog(`❌ Erro em ${post.topic}: ${message}`);
      setPostStatus(post.id, "error");
      toast.error(`Falha: ${post.topic}`);
    }
  };

  const generateByIcp = async (icpCode: IcpExperimentPost["icpCode"]) => {
    const posts = ICP_EXPERIMENT_POSTS.filter((p) => p.icpCode === icpCode);
    for (const post of posts) {
      await generatePost(post);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  };

  const generateAll = async () => {
    for (const post of ICP_EXPERIMENT_POSTS) {
      await generatePost(post);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">ICP Content Test Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estratégia de testes para os 5 ICPs de "Quem Atendemos", com geração via{" "}
            <code>generate-linkedin-carousel</code> e prioridade de assets reais.
          </p>
        </div>
        <Button onClick={generateAll} size="lg">
          Gerar Todos os Testes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ICPs Ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {WEBSITE_ICP_AUDIENCES.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Posts de Teste</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{ICP_EXPERIMENT_POSTS.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Formato Padrão</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">Carrossel</CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {postsByIcp.map(({ icp, posts }) => (
          <Card key={icp.code}>
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  {icp.code} · {icp.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{icp.websiteSegment}</p>
                <p className="text-xs text-muted-foreground">
                  Buyer foco: {icp.primaryBuyer} · KPI principal: {icp.successMetric}
                </p>
              </div>
              <Button variant="outline" onClick={() => generateByIcp(icp.code)}>
                Gerar ICP {icp.code}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.map((post) => {
                const current = status[post.id] || "idle";
                return (
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{post.topic}</p>
                        <Badge variant={post.visualDirection === "machine_or_product" ? "default" : "secondary"}>
                          {post.visualDirection === "machine_or_product"
                            ? "Imagem: máquina/produto"
                            : "Imagem: processo/facility"}
                        </Badge>
                        <Badge variant="outline">{post.copyDensity === "low_text" ? "Texto curto" : "Texto médio"}</Badge>
                        <Badge variant="outline">Slides {post.slideBucket}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Público: {post.targetAudience}</p>
                      <p className="text-xs text-muted-foreground">Hipótese: {post.hypothesis}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {current === "loading" && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {current === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {current === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                      <Button
                        size="sm"
                        onClick={() => generatePost(post)}
                        disabled={current === "loading"}
                      >
                        Gerar Post
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-900 text-slate-50">
        <CardHeader>
          <CardTitle className="text-white">Log de Execução</CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xs space-y-1 h-64 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
          {logs.length === 0 && <div className="text-slate-500">Aguardando gerações...</div>}
        </CardContent>
      </Card>
    </div>
  );
}
