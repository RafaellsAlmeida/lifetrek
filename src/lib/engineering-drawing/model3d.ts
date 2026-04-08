import type { AxisymmetricPartSpec, Planned3DModel } from "./types";

export function build3DModel(spec: AxisymmetricPartSpec): Planned3DModel {
  const unsupported = spec.unsupportedFeatures.map((feature) => feature.label);
  const blockingReasons: string[] = [];
  const nonRoundSegments = spec.segments.filter((segment) => segment.externalShape !== "round");

  if (unsupported.length > 0) {
    blockingReasons.push("Há features explicitamente fora do escopo axisimétrico.");
  }

  if (nonRoundSegments.length > 1) {
    blockingReasons.push("O preview 3D v1 suporta no máximo um segmento prismático (hex/quadrado).");
  }

  nonRoundSegments.forEach((segment) => {
    if (!segment.acrossFlatsMm || segment.lengthMm === null || segment.lengthMm <= 0) {
      blockingReasons.push(`O segmento ${segment.label} precisa de comprimento e entre faces para o 3D.`);
    }
    if (segment.kind !== "cylinder") {
      blockingReasons.push(`O segmento ${segment.label} precisa ser prismático reto para o 3D v1.`);
    }
  });

  if (blockingReasons.length > 0) {
    return {
      status: unsupported.length > 0 ? "blocked" : "partial",
      readyForImplementation: false,
      message: "O preview 3D está bloqueado até que a geometria suportada seja confirmada.",
      unsupportedFeatures: unsupported,
      blockingReasons,
    };
  }

  return {
    status: "ready",
    readyForImplementation: true,
    message: "A peça revisada está pronta para preview 3D paramétrico e export GLB.",
    unsupportedFeatures: [],
    blockingReasons: [],
  };
}
