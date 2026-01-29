// @ts-nocheck
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StorageImageSelector } from "@/components/admin/StorageImageSelector";
import { videoStudioPlan } from "@/data/videoStudioPlan";

import receptionHero from "@/assets/facility/reception-hero.webp";
import cleanroomHero from "@/assets/facility/cleanroom.webp";
import cleanroomHeroAlt from "@/assets/facility/cleanroom-hero.webp";
import exteriorHero from "@/assets/facility/exterior-hero.webp";
import citizenCnc from "@/assets/equipment/citizen-l32.webp";
import tornosGt26 from "@/assets/equipment/tornos-gt26.webp";
import robodrill from "@/assets/equipment/robodrill.webp";
import zeissMetrology from "@/assets/metrology/zeiss-contura.webp";
import olympusMicroscope from "@/assets/metrology/olympus-microscope.webp";
import labOverview from "@/assets/metrology/lab-overview.webp";
import surgicalInstruments from "@/assets/products/surgical-instruments-new.webp";
import orthopedicScrews from "@/assets/products/orthopedic-screws-optimized.webp";
import spinalImplants from "@/assets/products/spinal-implants-optimized.webp";
import isoBadge from "@/assets/certifications/iso.jpg";

const localAssetMap: Record<string, string> = {
  "/src/assets/facility/reception-hero.webp": receptionHero,
  "/src/assets/facility/cleanroom.webp": cleanroomHero,
  "/src/assets/facility/cleanroom-hero.webp": cleanroomHeroAlt,
  "/src/assets/facility/exterior-hero.webp": exteriorHero,
  "/src/assets/equipment/citizen-l32.webp": citizenCnc,
  "/src/assets/equipment/tornos-gt26.webp": tornosGt26,
  "/src/assets/equipment/robodrill.webp": robodrill,
  "/src/assets/metrology/zeiss-contura.webp": zeissMetrology,
  "/src/assets/metrology/olympus-microscope.webp": olympusMicroscope,
  "/src/assets/metrology/lab-overview.webp": labOverview,
  "/src/assets/products/surgical-instruments-new.webp": surgicalInstruments,
  "/src/assets/products/orthopedic-screws-optimized.webp": orthopedicScrews,
  "/src/assets/products/spinal-implants-optimized.webp": spinalImplants,
  "/src/assets/certifications/iso.jpg": isoBadge,
};

export default function VideoStudio() {
  const [script, setScript] = useState(videoStudioPlan.script);
  const [headline, setHeadline] = useState(videoStudioPlan.headline);
  const [linkedinLine, setLinkedinLine] = useState(videoStudioPlan.linkedinLine);
  const [sceneOverrides, setSceneOverrides] = useState<Record<string, string>>({});
  const [fallbackOverrides, setFallbackOverrides] = useState<Record<string, string>>({});
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedSceneKind, setSelectedSceneKind] = useState<"image" | "broll" | null>(null);
  const [failedBrolls, setFailedBrolls] = useState<Record<string, boolean>>({});

  const scenesWithOverrides = useMemo(() => {
    return videoStudioPlan.scenes.map((scene) => {
      const updatedScene = { ...scene };
      if (scene.kind === "image") {
        updatedScene.asset = sceneOverrides[scene.id] ?? scene.asset;
      }
      if (scene.kind === "broll" && scene.fallbackAsset) {
        updatedScene.fallbackAsset = fallbackOverrides[scene.id] ?? scene.fallbackAsset;
      }
      return updatedScene;
    });
  }, [sceneOverrides, fallbackOverrides]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiado`);
    } catch (error) {
      toast.error("Nao foi possivel copiar agora");
    }
  };

  const handleExport = () => {
    const payload = {
      ...videoStudioPlan,
      script,
      headline,
      linkedinLine,
      scenes: scenesWithOverrides,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lifetrek-video-plan.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openSelectorForScene = (sceneId: string, kind: "image" | "broll") => {
    setSelectedSceneId(sceneId);
    setSelectedSceneKind(kind);
    setIsSelectorOpen(true);
  };

  const handleSelectImage = (imageUrl: string) => {
    if (!selectedSceneId || !selectedSceneKind) return;
    if (selectedSceneKind === "image") {
      setSceneOverrides((prev) => ({
        ...prev,
        [selectedSceneId]: imageUrl,
      }));
      toast.success("Imagem atualizada para a cena selecionada");
      return;
    }

    setFallbackOverrides((prev) => ({
      ...prev,
      [selectedSceneId]: imageUrl,
    }));
    toast.success("Fallback atualizado para a cena selecionada");
  };

  const handleApplyAlternate = (sceneId: string, asset: string, kind: "image" | "broll") => {
    if (kind === "image") {
      setSceneOverrides((prev) => ({
        ...prev,
        [sceneId]: asset,
      }));
      toast.success("Imagem alternativa aplicada");
      return;
    }

    setFallbackOverrides((prev) => ({
      ...prev,
      [sceneId]: asset,
    }));
    toast.success("Fallback alternativo aplicado");
  };

  const handleBrollError = (sceneId: string) => {
    setFailedBrolls((prev) => {
      if (prev[sceneId]) return prev;
      return { ...prev, [sceneId]: true };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Video Studio</h1>
        <p className="text-muted-foreground">
          Planeje o video master da Lifetrek, organize cenas e exporte o roteiro.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Master Showcase Video</CardTitle>
          <CardDescription>
            Video institucional renderizado - 70 segundos, 1920x1080, 30fps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <video
              src="/remotion/master-showcase-v2.mp4"
              controls
              className="h-full w-full"
            >
              Seu navegador nao suporta o elemento de video.
            </video>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">Duracao: 70s</Badge>
            <Badge variant="secondary">Resolucao: 1920x1080</Badge>
            <Badge variant="secondary">Codec: H.264</Badge>
            <Badge variant="secondary">Tamanho: 37 MB</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Brief e Copy Base</CardTitle>
            <CardDescription>
              Ajuste a headline e o texto base antes de gerar o roteiro final.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Headline do site</label>
              <div className="flex gap-2">
                <Input value={headline} onChange={(event) => setHeadline(event.target.value)} />
                <Button variant="outline" onClick={() => handleCopy(headline, "Headline")}>Copiar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Linha do LinkedIn</label>
              <div className="flex gap-2">
                <Input
                  value={linkedinLine}
                  onChange={(event) => setLinkedinLine(event.target.value)}
                />
                <Button variant="outline" onClick={() => handleCopy(linkedinLine, "Linha do LinkedIn")}>
                  Copiar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Roteiro (PT-BR)</label>
                <Button variant="outline" onClick={() => handleCopy(script, "Roteiro")}>Copiar roteiro</Button>
              </div>
              <Textarea
                value={script}
                onChange={(event) => setScript(event.target.value)}
                className="min-h-[240px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Idioma: {videoStudioPlan.language}</Badge>
              <Badge variant="secondary">Duracao alvo: {videoStudioPlan.targetDurationSeconds}s</Badge>
              <Badge variant="secondary">Tom: {videoStudioPlan.tone}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exportacao e Render</CardTitle>
            <CardDescription>
              Gere o JSON do plano e rode a renderizacao no Remotion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExport} className="w-full">
              Exportar plano em JSON
            </Button>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">Render local (Remotion)</p>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">Studio interativo:</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npm run remotion:studio</code>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">Video silencioso:</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npm run remotion:render -- MasterShowcase out/video.mp4</code>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">Com voiceover:</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npm run remotion:render -- MasterShowcaseVoiceover out/video-vo.mp4</code>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">Producao completa (VO + musica):</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npm run remotion:render -- MasterShowcaseFull out/video-full.mp4</code>
              </div>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Geracao de assets</p>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">Voiceover (ElevenLabs):</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npx ts-node scripts/generate-voiceover.ts</code>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-xs text-foreground/70">B-roll AI (Runway):</p>
                <code className="block bg-muted px-2 py-1 rounded text-xs">npx ts-node scripts/generate-runway-broll.ts</code>
              </div>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">B-roll esperado (public/remotion/broll)</p>
              <ul className="mt-2 space-y-1">
                <li>broll-01-drone-rise.mp4</li>
                <li>broll-02-facade-push.mp4</li>
                <li>broll-03-cleanroom.mp4</li>
                <li>broll-04-cnc.mp4</li>
                <li>broll-05-metrology.mp4</li>
                <li>broll-06-packaging.mp4</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shot List (com preview)</CardTitle>
          <CardDescription>
            Organize as cenas e substitua imagens usando os assets do storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenesWithOverrides.map((scene) => {
            const previewSrc = localAssetMap[scene.asset] ?? scene.asset;
            const fallbackSrc =
              scene.fallbackAsset ? localAssetMap[scene.fallbackAsset] ?? scene.fallbackAsset : null;
            const isBrollMissing = scene.kind === "broll" && failedBrolls[scene.id];
            return (
              <div key={scene.id} className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center">
                <div className="w-full overflow-hidden rounded-lg bg-muted lg:w-56">
                  {scene.kind === "broll" ? (
                    isBrollMissing ? (
                      fallbackSrc ? (
                        <img
                          src={fallbackSrc}
                          alt={`${scene.label} (fallback)`}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center text-xs text-muted-foreground">
                          B-roll ausente: {scene.asset}
                        </div>
                      )
                    ) : (
                      <video
                        src={previewSrc}
                        className="h-36 w-full object-cover"
                        muted
                        playsInline
                        poster={fallbackSrc ?? undefined}
                        onError={() => handleBrollError(scene.id)}
                      />
                    )
                  ) : (
                    <img
                      src={previewSrc}
                      alt={scene.label}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{scene.label}</h3>
                    <Badge variant="outline">{scene.kind}</Badge>
                    <Badge variant="secondary">{scene.durationSeconds}s</Badge>
                    {scene.optional ? <Badge variant="outline">Opcional</Badge> : null}
                    {isBrollMissing ? <Badge variant="secondary">Arquivo ausente</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{scene.notes}</p>
                  {scene.onScreen ? (
                    <p className="text-xs text-muted-foreground">On-screen: {scene.onScreen}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Asset: {scene.asset}</p>
                  {fallbackSrc ? (
                    <p className="text-xs text-muted-foreground">Fallback: {scene.fallbackAsset}</p>
                  ) : null}
                  {scene.altAssets?.length ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Alternativas locais</p>
                      <div className="flex flex-wrap gap-3">
                        {scene.altAssets.map((asset) => {
                          const altPreview = localAssetMap[asset] ?? asset;
                          return (
                            <div key={asset} className="w-24 space-y-1">
                              <img
                                src={altPreview}
                                alt={`Alternativa ${scene.label}`}
                                className="h-16 w-full rounded-md border object-cover"
                                loading="lazy"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplyAlternate(scene.id, asset, scene.kind)}
                              >
                                Usar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                {scene.kind === "image" ? (
                  <Button variant="outline" onClick={() => openSelectorForScene(scene.id, "image")}>
                    Trocar imagem
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => openSelectorForScene(scene.id, "broll")}>
                    Trocar fallback
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prompts para VEO</CardTitle>
          <CardDescription>
            Use manualmente no VEO para gerar b-roll cinematografico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {videoStudioPlan.veoPrompts.map((prompt) => (
            <div key={prompt.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{prompt.label}</p>
                  <Badge variant="secondary">{prompt.durationSeconds}s</Badge>
                </div>
                <Button variant="outline" onClick={() => handleCopy(prompt.prompt, "Prompt")}>Copiar</Button>
              </div>
              <p className="text-sm text-muted-foreground">{prompt.prompt}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <StorageImageSelector
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        onSelect={handleSelectImage}
      />
    </div>
  );
}
