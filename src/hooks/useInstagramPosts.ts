import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { showActionableError } from "@/lib/showActionableError";

interface InstagramPost {
    id: string;
    status: string;
    rejection_reason?: string | null;
    rejected_at?: string | null;
    approved_at?: string | null;
    approved_by?: string | null;
    [key: string]: any;
}

const approvalQueryKeys = [
    ["instagram_posts"],
    ["content_approval_items"],
    ["content-approval-items"],
    ["approved_content_items"],
    ["blog-posts"],
    ["linkedin_carousels"],
    ["resources"],
] as const;

function invalidateApprovalQueries(queryClient: ReturnType<typeof useQueryClient>) {
    return Promise.all(
        approvalQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
    );
}

function validateInstagramApproval(post: InstagramPost) {
    const primaryImage = typeof post.image_url === "string" ? post.image_url.trim() : "";
    const fallbackImage = Array.isArray(post.image_urls)
        ? post.image_urls.find((value: unknown) => typeof value === "string" && value.trim().length > 0)
        : "";

    if ((!primaryImage && !fallbackImage) || !post.caption?.trim()) {
        throw new Error("Post precisa de imagem e legenda para ser aprovado.");
    }
}

// Fetch all Instagram posts (optionally filter by status)
export function useInstagramPosts(status?: string) {
    return useQuery({
        queryKey: ["instagram_posts", status],
        queryFn: async () => {
            let query = (supabase
                .from("instagram_posts" as any)
                .select("*")
                .order("created_at", { ascending: false }) as any);

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as InstagramPost[];
        },
    });
}

// Fetch single Instagram post by ID
export function useInstagramPost(id: string | null) {
    return useQuery({
        queryKey: ["instagram_post", id],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from("instagram_posts" as any)
                .select("*")
                .eq("id", id!)
                .maybeSingle() as any);

            if (error) throw error;
            return data as InstagramPost | null;
        },
        enabled: !!id,
    });
}

// Approve Instagram post
export function useApproveInstagramPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: post, error: fetchError } = await (supabase
                .from("instagram_posts" as any)
                .select("*")
                .eq("id", id)
                .single() as any);

            if (fetchError) throw fetchError;

            validateInstagramApproval(post as InstagramPost);

            const { data: auth } = await supabase.auth.getUser();
            const approvedAt = new Date().toISOString();

            const { data, error } = await (supabase
                .from("instagram_posts" as any)
                .update({
                    status: "approved",
                    approved_at: approvedAt,
                    approved_by: auth.user?.id ?? null,
                })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data as InstagramPost;
        },
        onSuccess: () => {
            void invalidateApprovalQueries(queryClient);
            toast.success("Post Instagram aprovado!");
        },
        onError: (error: any) => {
            console.error("Error approving Instagram post:", error);
            showActionableError(error, 'aprovação de post Instagram');
        },
    });
}

// Reject Instagram post
export function useRejectInstagramPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const { data, error } = await (supabase
                .from("instagram_posts" as any)
                .update({
                    status: "archived",
                    rejection_reason: reason,
                    rejected_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data as InstagramPost;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["instagram_posts"] });
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["rejected_content_items"] });
            toast.success("Post Instagram rejeitado");
        },
        onError: (error: any) => {
            console.error("Error rejecting Instagram post:", error);
            showActionableError(error, 'rejeição de post Instagram');
        },
    });
}

// Publish Instagram post
export function usePublishInstagramPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await (supabase
                .from("instagram_posts" as any)
                .update({ status: "published" })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data as InstagramPost;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["instagram_posts"] });
            queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
            toast.success("Post publicado no Instagram!");
        },
        onError: (error: any) => {
            console.error("Error publishing Instagram post:", error);
            showActionableError(error, 'publicação de post Instagram');
        },
    });
}

// Delete Instagram post
export function useDeleteInstagramPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase
                .from("instagram_posts" as any)
                .delete()
                .eq("id", id) as any);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["instagram_posts"] });
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            toast.success("Post Instagram deletado!");
        },
        onError: (error: any) => {
            console.error("Error deleting Instagram post:", error);
            showActionableError(error, 'exclusão de post Instagram');
        },
    });
}
