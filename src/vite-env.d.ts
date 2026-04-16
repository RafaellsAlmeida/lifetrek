/// <reference types="vite/client" />

declare module "opencascade.js" {
  export function initOpenCascade(): Promise<Record<string, unknown>>;
}

declare module "opencascade.js/dist/opencascade.wasm.js" {
  type OpenCascadeFactory = new (options: {
    locateFile?: (path: string, scriptDirectory?: string) => string;
  }) => Promise<Record<string, unknown>>;

  const factory: OpenCascadeFactory;
  export default factory;
}
