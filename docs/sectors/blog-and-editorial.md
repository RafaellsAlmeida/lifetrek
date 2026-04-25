# Blog e Editorial

## Objetivo

Transformar o blog em um sistema editorial técnico, com geração assistida, edição humana, SEO e publicação controlada.

## Fluxo principal

1. Definir tema, ICP e palavra-chave pilar.
2. Gerar rascunho com `generate-blog-post`.
3. Editar artigo em `/admin/blog` no workspace editorial.
4. Ajustar corpo do texto, SEO, CTA, entidades e tags no painel lateral.
5. Validar o preview antes de salvar ou publicar.
6. Passar por aprovação.
7. Publicar com rastreabilidade.

## Rota principal

- `/admin/blog`

## Componentes e funções principais

- `src/pages/Admin/AdminBlog.tsx`
- `src/components/admin/content/EditorialWorkspace.tsx`
- `src/hooks/useBlogPosts.ts`
- `src/types/blog.ts`
- `supabase/functions/generate-blog-post/index.ts`
- `supabase/functions/generate-blog-images/index.ts`

## Dados principais

### `blog_posts`

Campos mais relevantes:

- `title`
- `slug`
- `excerpt`
- `content`
- `status`
- `seo_title`
- `seo_description`
- `featured_image`
- `hero_image_url`
- `keywords`
- `tags`
- `published_at`
- `metadata.icp_primary`
- `metadata.pillar_keyword`
- `metadata.entity_keywords`
- `metadata.cta_mode`

### `blog_categories`

Organiza temas editoriais.

## Regras editoriais

- Português do Brasil.
- Tom técnico e direto.
- Clareza antes de floreio.
- SEO técnico sem parecer texto promocional vazio.
- Conteúdo no centro do editor; metadados, SEO, ICP e CTA no painel lateral.
- Preview obrigatório no workspace antes de publicação quando houver mudança significativa.
- Revisão humana obrigatória antes de publicação.

## Padrão do workspace editorial

- Blog usa edição HTML visual porque a página pública renderiza `blog_posts.content` como HTML.
- Recursos usam Markdown porque `/resources/:slug` renderiza `resources.content` com `ReactMarkdown`.
- O workspace deve manter canvas de edição, toolbar, painel lateral de controle editorial, estatísticas de leitura e aba de preview.
- As ações `Salvar` e `Publicar` devem persistir no Supabase e invalidar as queries de aprovação/listagem.
- Deep links vindos da aprovação devem preservar `returnTo` e `stateKey` no retorno.

## Regras de aprovação

Antes de aprovar ou publicar, o post deve ter:

- conteúdo não vazio;
- ICP primário;
- palavra-chave pilar;
- SEO básico preenchido;
- revisão editorial humana.

## Riscos

- artigo tecnicamente fraco, mas formalmente “completo”;
- SEO preenchido sem coerência com o artigo;
- publicação sem contexto editorial mínimo;
- imagem recebendo mais atenção que o conteúdo.
