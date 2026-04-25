import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogPostInsert, BlogPostUpdate, BlogCategory } from "@/types/blog";
import { toast } from "sonner";
import { showActionableError } from "@/lib/showActionableError";

const approvalQueryKeys = [
    ["blog-posts"],
    ["content_approval_items"],
    ["content-approval-items"],
    ["approved_content_items"],
    ["linkedin_carousels"],
    ["instagram_posts"],
    ["resources"],
] as const;

function invalidateApprovalQueries(queryClient: ReturnType<typeof useQueryClient>) {
    return Promise.all(
        approvalQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
    );
}

function getMissingSchemaColumn(error: unknown) {
    const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || "");
    const match = message.match(/Could not find the '([^']+)' column/);
    return match?.[1] || null;
}

function withoutColumn<T extends Record<string, unknown>>(payload: T, column: string) {
    const next = { ...payload };
    delete next[column];
    return next;
}

export function useBlogPosts(publishedOnly = true) {
    return useQuery({
        queryKey: ["blog-posts", publishedOnly],
        queryFn: async () => {
            let query = supabase
                .from("blog_posts")
                .select("*");

            if (publishedOnly) {
                query = query.eq("status", "published");
            }

            const { data, error } = await query.order("created_at", { ascending: false });
            if (error) throw error;
            return data as unknown as BlogPost[];
        },
    });
}

export function useBlogPost(slug: string) {
    return useQuery({
        queryKey: ["blog-post", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            return data as unknown as BlogPost;
        },
        enabled: !!slug,
    });
}

export function useBlogCategories(enabled = true) {
    return useQuery({
        queryKey: ["blog-categories"],
        enabled,
        queryFn: async () => {
            const { data, error } = await (supabase
                .from("blog_categories" as any)
                .select("*")
                .order("name") as any);

            // Some environments do not expose blog_categories or FK relations yet.
            if (error) {
                const code = (error as { code?: string }).code || "";
                if (code === "PGRST205") {
                    return [] as BlogCategory[];
                }
                throw error;
            }
            return data as BlogCategory[];
        },
    });
}

export function useCreateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (post: BlogPostInsert) => {
            let payload = post as Record<string, unknown>;
            let { data, error } = await supabase
                .from("blog_posts")
                .insert(payload as any)
                .select()
                .single();

            const missingColumn = error ? getMissingSchemaColumn(error) : null;
            if (missingColumn && missingColumn in payload) {
                payload = withoutColumn(payload, missingColumn);
                const retry = await supabase
                    .from("blog_posts")
                    .insert(payload as any)
                    .select()
                    .single();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo criado com sucesso!");
        },
        onError: (error) => {
            console.error("Error creating blog post:", error);
            showActionableError(error, 'criação de artigo');
        },
    });
}

export function useUpdateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: BlogPostUpdate) => {
            let payload = updates as Record<string, unknown>;
            let { data, error } = await supabase
                .from("blog_posts")
                .update(payload as any)
                .eq("id", id)
                .select()
                .single();

            const missingColumn = error ? getMissingSchemaColumn(error) : null;
            if (missingColumn && missingColumn in payload) {
                payload = withoutColumn(payload, missingColumn);
                const retry = await supabase
                    .from("blog_posts")
                    .update(payload as any)
                    .eq("id", id)
                    .select()
                    .single();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo atualizado com sucesso!");
        },
        onError: (error) => {
            console.error("Error updating blog post:", error);
            showActionableError(error, 'atualização de artigo');
        },
    });
}

export function useDeleteBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("blog_posts").delete().eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo excluído com sucesso!");
        },
        onError: (error) => {
            console.error("Error deleting blog post:", error);
            showActionableError(error, 'exclusão de artigo');
        },
    });
}

export function useApproveBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: currentPost, error: fetchError } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;

            const metadata = (currentPost as any)?.metadata || {};
            const icpPrimary = typeof metadata?.icp_primary === "string" ? metadata.icp_primary.trim() : "";
            const pillarKeyword = typeof metadata?.pillar_keyword === "string" ? metadata.pillar_keyword.trim() : "";

            if (!icpPrimary || !pillarKeyword) {
                throw new Error("Preencha metadata.icp_primary e metadata.pillar_keyword antes de aprovar.");
            }

            if (!currentPost.content?.trim()) {
                throw new Error("Preencha o conteúdo do artigo antes de aprovar.");
            }

            const { data: auth } = await supabase.auth.getUser();

            const now = new Date().toISOString();
            const nextMetadata = {
                ...metadata,
                approved_at: now,
            };

            const { data, error } = await supabase
                .from("blog_posts")
                .update({
                    status: "approved",
                    approved_at: now,
                    approved_by: auth.user?.id ?? null,
                    metadata: nextMetadata,
                } as any)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            void invalidateApprovalQueries(queryClient);
            toast.success("Artigo aprovado com sucesso!");
        },
        onError: (error) => {
            console.error("Error approving blog post:", error);
            showActionableError(error, 'aprovação de artigo');
        },
    });
}

export function usePublishBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: currentPost, error: fetchError } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;

            const metadata = (currentPost as any)?.metadata || {};
            const icpPrimary = typeof metadata?.icp_primary === "string" ? metadata.icp_primary.trim() : "";
            const pillarKeyword = typeof metadata?.pillar_keyword === "string" ? metadata.pillar_keyword.trim() : "";

            if (!icpPrimary || !pillarKeyword) {
                throw new Error("Preencha metadata.icp_primary e metadata.pillar_keyword antes de publicar.");
            }

            const now = new Date().toISOString();
            const approvedAt = metadata?.approved_at || now;
            const nextMetadata = {
                ...metadata,
                approved_at: approvedAt,
                published_at: now,
            };

            const { data, error } = await supabase
                .from("blog_posts")
                .update({
                    status: "published",
                    published_at: now,
                    metadata: nextMetadata
                } as any)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo publicado com sucesso!");
        },
        onError: (error) => {
            console.error("Error publishing blog post:", error);
            showActionableError(error, 'publicação de artigo');
        },
    });
}
