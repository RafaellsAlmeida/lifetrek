const uid = () => `${Date.now()}-${Math.floor(Math.random() * 9999)}`;

export type ContentPostInput = {
  topic: string;
  audience: string;
  pain_points: string;
  content_type: "value_post" | "commercial_post";
  platform: "linkedin" | "instagram";
};

export type BlogPostInput = {
  title: string;
  slug: string;
  content: string;
  language?: "pt" | "en";
  status?: "draft" | "published";
};

export const createContentPost = (
  overrides: Partial<ContentPostInput> = {}
): ContentPostInput => ({
  topic: `Fabricação de Dispositivos Médicos ${uid()}`,
  audience: "Gestores de compras em empresas de dispositivos médicos",
  pain_points: "Lead times longos, custo alto, conformidade de qualidade",
  content_type: "value_post",
  platform: "linkedin",
  ...overrides,
});

export const createCommercialPost = (
  overrides: Partial<ContentPostInput> = {}
): ContentPostInput =>
  createContentPost({ content_type: "commercial_post", ...overrides });

export const createBlogPost = (
  overrides: Partial<BlogPostInput> = {}
): BlogPostInput => {
  const id = uid();
  return {
    title: `Guia de Teste Playwright ${id}`,
    slug: `guia-teste-playwright-${id}`,
    content:
      "Conteúdo gerado automaticamente por Playwright para fins de teste. Pode ser removido.",
    language: "pt",
    status: "draft",
    ...overrides,
  };
};
