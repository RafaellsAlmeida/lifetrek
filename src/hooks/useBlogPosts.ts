import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogPostInsert, BlogPostUpdate, BlogCategory } from "@/types/blog";
import { toast } from "sonner";

export function useBlogPosts(publishedOnly = true) {
    return useQuery({
        queryKey: ["blog-posts", publishedOnly],
        queryFn: async () => {
            let query = supabase
                .from("blog_posts")
                .select("*, category:blog_categories(*)");

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
                .select("*, category:blog_categories(*)")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            return data as unknown as BlogPost;
        },
        enabled: !!slug,
    });
}

export function useBlogCategories() {
    return useQuery({
        queryKey: ["blog-categories"],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from("blog_categories" as any)
                .select("*")
                .order("name") as any);

            if (error) throw error;
            return data as BlogCategory[];
        },
    });
}

export function useCreateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (post: BlogPostInsert) => {
            const { data, error } = await supabase
                .from("blog_posts")
                .insert(post)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo criado com sucesso!");
        },
        onError: (error) => {
            console.error("Error creating blog post:", error);
            toast.error("Erro ao criar artigo");
        },
    });
}

export function useUpdateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: BlogPostUpdate) => {
            const { data, error } = await supabase
                .from("blog_posts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
            toast.success("Artigo atualizado com sucesso!");
        },
        onError: (error) => {
            console.error("Error updating blog post:", error);
            toast.error("Erro ao atualizar artigo");
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
            toast.error("Erro ao excluir artigo");
        },
    });
}

export function usePublishBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from("blog_posts")
                .update({ status: "published", published_at: new Date().toISOString() })
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
            toast.error("Erro ao publicar artigo");
        },
    });
}
