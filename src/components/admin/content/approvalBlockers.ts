interface ApprovalBlockerOptions {
  carousel?: any;
  instagram?: any;
}

export interface ApprovalBlockerSummary {
  messages: string[];
  canEdit: boolean;
  canRegenerateImages: boolean;
}

function getTrimmedMediaUrl(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLinkedInSlides(rawSlides: any) {
  if (Array.isArray(rawSlides)) return rawSlides;
  if (Array.isArray(rawSlides?.slides)) return rawSlides.slides;
  return [];
}

export function getApprovalBlockers(
  item: any | null,
  options: ApprovalBlockerOptions = {},
): ApprovalBlockerSummary {
  if (!item) {
    return { messages: [], canEdit: false, canRegenerateImages: false };
  }

  const messages: string[] = [];
  let canEdit = false;
  let canRegenerateImages = false;

  if (item.type === "linkedin") {
    const carousel = options.carousel || item.full_data || item;
    const slides = getLinkedInSlides(carousel?.slides);

    if (!slides.length) {
      messages.push('Nenhum slide encontrado. Clique em "Editar" para revisar o carrossel antes de aprovar.');
      canEdit = true;
    } else if (slides.some((slide: any) => !getTrimmedMediaUrl(slide?.image_url || slide?.imageUrl))) {
      messages.push('Imagem não gerada em um ou mais slides. Clique em "Regenerar Imagens" abaixo.');
      canRegenerateImages = true;
    }

    if (!carousel?.caption?.trim()) {
      messages.push('Legenda ausente. Clique em "Editar" para completar a legenda antes de aprovar.');
      canEdit = true;
    }
  }

  if (item.type === "instagram") {
    const post = options.instagram || item.full_data || item;
    const imageUrl = getTrimmedMediaUrl(post?.image_url);
    const fallbackImage = Array.isArray(post?.image_urls)
      ? post.image_urls.find((value: unknown) => getTrimmedMediaUrl(value).length > 0)
      : "";

    if (!imageUrl && !fallbackImage) {
      messages.push('Imagem não gerada. Clique em "Regenerar Imagens" abaixo.');
      canRegenerateImages = true;
    }

    if (!post?.caption?.trim()) {
      messages.push('Legenda ausente. Clique em "Editar" para completar o texto antes de aprovar.');
      canEdit = true;
    }
  }

  if (item.type === "blog") {
    const blog = item.full_data || item;
    const metadata = blog?.metadata || {};

    if (!(typeof metadata?.icp_primary === "string" && metadata.icp_primary.trim())) {
      messages.push('ICP primário ausente. Clique em "Editar" para preencher os metadados do artigo.');
      canEdit = true;
    }

    if (!(typeof metadata?.pillar_keyword === "string" && metadata.pillar_keyword.trim())) {
      messages.push('Pillar keyword ausente. Clique em "Editar" para completar os metadados do artigo.');
      canEdit = true;
    }

    if (!blog?.content?.trim()) {
      messages.push('Conteúdo vazio. Clique em "Editar" para concluir o artigo antes de aprovar.');
      canEdit = true;
    }
  }

  if (item.type === "resource") {
    const resource = item.full_data || item;
    if (!resource?.title?.trim()) {
      messages.push('Título ausente. Clique em "Editar" para completar o recurso antes de aprovar.');
      canEdit = true;
    }
  }

  return { messages, canEdit, canRegenerateImages };
}
