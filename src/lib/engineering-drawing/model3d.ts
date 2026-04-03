import type { AxisymmetricPartSpec, Planned3DModel } from "./types";

export function build3DModel(spec: AxisymmetricPartSpec): Planned3DModel {
  const unsupported = spec.unsupportedFeatures.map((feature) => feature.label);

  if (unsupported.length > 0) {
    return {
      status: "partial",
      readyForImplementation: false,
      message:
        "A arquitetura do 3D já usa o mesmo spec paramétrico, mas esta peça ainda tem features fora do escopo da V1.",
      unsupportedFeatures: unsupported,
    };
  }

  return {
    status: "planned",
    readyForImplementation: true,
    message:
      "O mesmo AxisymmetricPartSpec já está pronto para alimentar um preview 3D paramétrico em uma próxima etapa.",
    unsupportedFeatures: [],
  };
}
