import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstagramPost {
    id: string;
    status: string;
    rejection_reason?: string | null;
    rejected_at?: string | null;
    [key: string]: any;
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
            const { data, error } = await (supabase
                .from("instagram_posts" as any)
                .update({ status: "approved" })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data as InstagramPost;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["instagram_posts"] });
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
            toast.success("Post Instagram aprovado!");
        },
        onError: (error: any) => {
            console.error("Error approving Instagram post:", error);
            toast.error("Erro ao aprovar post Instagram");
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
            toast.error("Erro ao rejeitar post Instagram");
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
            toast.error("Erro ao publicar post Instagram");
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
            toast.error("Erro ao deletar post Instagram");
        },
    });
}
