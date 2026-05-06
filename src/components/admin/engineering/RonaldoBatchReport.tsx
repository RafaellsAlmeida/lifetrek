import type { ReactNode } from "react";
import { AlertTriangle, Cuboid, Download, ExternalLink, FileImage, FileText, Layers3, Ruler } from "lucide-react";

import { EngineeringDrawingGlbPreview } from "@/components/admin/engineering/EngineeringDrawingGlbPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BATCH_BASE = "/assets/engineering/ronaldo-2026-05-05";

type BatchPiece = {
  id: string;
  title: string;
  sourceName: string;
  summary: string;
  dimensions: string;
  reviewFocus: string[];
  knownLimits: string[];
};

const batchPieces: BatchPiece[] = [
  {
    id: "cylinder-pointed-bur-12s-mcxl-nova",
    title: "Cylinder Pointed Bur 12s MCXL nova chinesa",
    sourceName: "Cylinder Pointed Bur 12s MCXL nova chinesa.pptx",
    summary: "Desenho Ronaldo, A3, PPTX, GLB e STEP preliminares gerados a partir do PowerPoint.",
    dimensions: "Bounding box estimado: 38,00 x 6,50 x 6,50 mm.",
    reviewFocus: [
      "Confirmar se os trechos verdes do diamantado/corte devem aparecer como anotacao 2D, geometria 3D real ou ambos.",
      "Validar a ponta conica e a leitura de Ø1,20 mm no extremo ativo.",
      "Checar a sobra de 0,40 mm entre a soma das cotas segmentadas e o comprimento total do desenho.",
    ],
    knownLimits: [
      "Diamantado, canaletas e acabamento de superficie ainda estao simplificados.",
      "STEP e GLB ainda nao sao arquivos de fabricacao; servem para revisao visual e tecnica.",
    ],
  },
  {
    id: "cylinder-pointed-bur-20s-mcxl-usada",
    title: "Cylinder Pointed Bur 20s MCXL usada",
    sourceName: "Cylinder Pointed Bur 20s MCXL usada.pptx",
    summary: "Mesmo fluxo do Cylinder 12s, com corpo mais longo e furo transversal marcado no desenho.",
    dimensions: "Bounding box estimado: 46,00 x 6,50 x 6,50 mm.",
    reviewFocus: [
      "Confirmar posicao e funcao do furo Ø0,50 mm transversal.",
      "Validar se a transicao de 45° precisa virar chanfro real no 3D ou nota tecnica no 2D.",
      "Checar a sobra de 0,40 mm entre a soma das cotas segmentadas e o comprimento total do desenho.",
    ],
    knownLimits: [
      "Furo transversal e detalhes de corte ainda precisam sair do renderer simplificado para geometria real.",
      "O STEP preliminar pode abrir em CAD, mas ainda nao representa a definicao final para fornecedor.",
    ],
  },
  {
    id: "step-bur-20s-mcxl-usada",
    title: "Step Bur 20s MCXL usada",
    sourceName: "Step Bur 20s MCXL usada.pdf / PPTX convertido",
    summary: "Peça escalonada organizada no mesmo padrao visual, com saidas 2D, A3, GLB e STEP.",
    dimensions: "Bounding box estimado: 46,00 x 6,50 x 6,50 mm.",
    reviewFocus: [
      "Confirmar se o ultimo trecho Ø1,00 D 4,00 mm foi interpretado corretamente.",
      "Validar se o furo Ø0,50 mm transversal deve ser cota, corte 3D ou feature obrigatoria no STEP.",
      "Checar se o padrao de cotas do desenho limpo esta alinhado ao padrao interno que Ronaldo usa no PowerPoint.",
    ],
    knownLimits: [
      "A origem PDF/PPTX foi tratada como fonte visual, ainda sem parser estrutural completo de shapes.",
      "A geometria 3D esta adequada para revisao visual inicial, nao para liberar fabricacao.",
    ],
  },
];

function assetPath(pieceId: string, fileName: string) {
  return `${BATCH_BASE}/${pieceId}/${fileName}`;
}

function DownloadButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download>
        <Download className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}

function VisualPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

export function RonaldoBatchReport() {
  return (
    <Card id="ronaldo-lote-2026-05-05" className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-sky-600" />
              Lote Ronaldo - 05/05
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              Relatorio visual separado por peça, com fonte, desenho 2D, A3, preview 3D GLB e downloads tecnicos. JSONs e specs
              ficam internos para desenvolvimento.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href={`${BATCH_BASE}/relatorio-lote.md`} target="_blank" rel="noreferrer">
              <FileText className="h-4 w-4" />
              Abrir relatorio bruto
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={batchPieces[0].id} className="space-y-5">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-slate-100 p-1">
            {batchPieces.map((piece) => (
              <TabsTrigger key={piece.id} value={piece.id} className="data-[state=active]:bg-white">
                {piece.title.replace(" MCXL", "")}
              </TabsTrigger>
            ))}
          </TabsList>

          {batchPieces.map((piece) => (
            <TabsContent key={piece.id} value={piece.id} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">3D visivel no app</Badge>
                    <Badge variant="outline">STEP preliminar</Badge>
                    <Badge variant="outline">Revisao Ronaldo pendente</Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{piece.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{piece.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Ruler className="h-4 w-4 text-slate-500" />
                    {piece.dimensions}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    Validacao necessaria
                  </div>
                  <p className="mt-2">
                    Os arquivos existem para revisar leitura, cotas e formato. Ainda nao devem ser enviados como desenho final de
                    fornecedor.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <VisualPanel title="Fonte recebida" icon={<FileImage className="h-4 w-4 text-slate-500" />}>
                  <div className="mb-2 text-xs text-slate-500">{piece.sourceName}</div>
                  <img
                    src={assetPath(piece.id, "fonte.png")}
                    alt={`Fonte recebida - ${piece.title}`}
                    className="h-[280px] w-full rounded-md border border-slate-200 bg-slate-50 object-contain"
                  />
                </VisualPanel>

                <VisualPanel title="Desenho limpo para revisao" icon={<FileImage className="h-4 w-4 text-slate-500" />}>
                  <div className="mb-2 text-xs text-slate-500">Padrao visual Ronaldo, exportavel em PPTX.</div>
                  <img
                    src={assetPath(piece.id, "desenho-limpo.png")}
                    alt={`Desenho limpo - ${piece.title}`}
                    className="h-[280px] w-full rounded-md border border-slate-200 bg-slate-50 object-contain"
                  />
                </VisualPanel>
              </div>

              <VisualPanel title="Preview 3D gerado" icon={<Cuboid className="h-4 w-4 text-slate-500" />}>
                <EngineeringDrawingGlbPreview url={assetPath(piece.id, "modelo.glb")} />
              </VisualPanel>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Pontos para Ronaldo revisar</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {piece.reviewFocus.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Limites conhecidos desta versao</h4>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {piece.knownLimits.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <DownloadButton href={assetPath(piece.id, "desenho-limpo.pptx")} label="PPTX 2D" />
                <DownloadButton href={assetPath(piece.id, "desenho-limpo.svg")} label="SVG 2D" />
                <DownloadButton href={assetPath(piece.id, "desenho-tecnico-a3.svg")} label="A3 SVG" />
                <DownloadButton href={assetPath(piece.id, "modelo.glb")} label="GLB 3D" />
                <DownloadButton href={assetPath(piece.id, "modelo.step")} label="STEP" />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
