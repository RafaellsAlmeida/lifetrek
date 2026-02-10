import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type LinkedInCarousel = Tables<"linkedin_carousels">;

// Fetch all LinkedIn carousels (optionally filter by status)
export function useLinkedInPosts(status?: string) {
    return useQuery({
        queryKey: ["linkedin_carousels", status],
        queryFn: async () => {
            let query = supabase
                .from("linkedin_carousels")
                .select("*")
                .order("created_at", { ascending: false });

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as LinkedInCarousel[];
        },
    });
}

// Fetch single LinkedIn carousel by ID
export function useLinkedInPost(id: string) {
    return useQuery({
        queryKey: ["linkedin_carousel", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as LinkedInCarousel;
        },
        enabled: !!id,
    });
}

// Update LinkedIn carousel
export function useUpdateLinkedInPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<LinkedInCarousel>) => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as LinkedInCarousel;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] });
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousel", data.id] });
            toast.success("Post atualizado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Error updating LinkedIn carousel:", error);
            toast.error("Erro ao atualizar post");
        },
    });
}

// Approve LinkedIn carousel
export function useApproveLinkedInPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .update({
                    status: "approved",
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as LinkedInCarousel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] });
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
            toast.success("Post aprovado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Error approving carousel:", error);
            toast.error("Erro ao aprovar post");
        },
    });
}

// Reject LinkedIn carousel
export function useRejectLinkedInPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .update({
                    status: "archived",
                    rejection_reason: reason,
                    rejected_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as LinkedInCarousel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] });
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["rejected_content_items"] });
            toast.success("Post rejeitado");
        },
        onError: (error: any) => {
            console.error("Error rejecting carousel:", error);
            toast.error("Erro ao rejeitar post");
        },
    });
}

// Publish LinkedIn carousel (after approval)
export function usePublishLinkedInPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .update({
                    status: "published",
                })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as LinkedInCarousel;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] });
            toast.success("Post publicado no LinkedIn!");
        },
        onError: (error: any) => {
            console.error("Error publishing carousel:", error);
            toast.error("Erro ao publicar post");
        },
    });
}

// Fetch full LinkedIn carousel data (for preview - lazy load)
export function useLinkedInCarouselFull(id: string | null) {
    return useQuery({
        queryKey: ["linkedin_carousel_full", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("linkedin_carousels")
                .select("*")
                .eq("id", id!)
                .maybeSingle();

            if (error) throw error;
            return data as LinkedInCarousel | null;
        },
        enabled: !!id,
    });
}

// Delete LinkedIn carousel
export function useDeleteLinkedInPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("linkedin_carousels")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["linkedin_carousels"] });
            toast.success("Post deletado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Error deleting carousel:", error);
            toast.error("Erro ao deletar post");
        },
    });
}

// Get content approval items (combines blogs, LinkedIn carousels, and resources)
export function useContentApprovalItems() {
    return useQuery({
        queryKey: ["content_approval_items"],
        queryFn: async () => {
            console.log("[ContentApproval] Starting fetch...");

            try {
                // Fetch pending blogs
                const { data: blogs, error: blogsError } = await supabase
                    .from("blog_posts")
                    .select("*")
                    .eq("status", "pending_review")
                    .order("created_at", { ascending: false });

                if (blogsError) throw blogsError;

                // Fetch draft/pending LinkedIn carousels
                const { data: linkedInCarousels, error: linkedInError } = await supabase
                    .from("linkedin_carousels")
                    .select("id, topic, status, created_at, target_audience, pain_point, caption, desired_outcome, slides")
                    .in("status", ["draft", "pending_approval"])
                    .order("created_at", { ascending: false });

                if (linkedInError) throw linkedInError;

                // Fetch pending/draft Instagram posts
                const { data: instagramPosts, error: instagramError } = await (supabase
                    .from("instagram_posts" as any)
                    .select("id, topic, status, created_at, target_audience, pain_point, caption, desired_outcome, hashtags, post_type")
                    .in("status", ["draft", "pending_approval"])
                    .order("created_at", { ascending: false }) as any);

                if (instagramError) {
                    console.error("[ContentApproval] Error fetching Instagram posts:", instagramError);
                }

                // Fetch pending resources
                const { data: resources, error: resourcesError } = await (supabase
                    .from("resources" as any)
                    .select("*")
                    .eq("status", "pending_approval")
                    .order("created_at", { ascending: false }) as any);

                if (resourcesError) {
                    console.error("[ContentApproval] Error fetching resources:", resourcesError);
                    // Don't throw here to avoid blocking other content if resources table issues persist
                }

                // Combine and format
                const items = [
                    ...(blogs || []).map((blog: any) => ({
                        id: blog.id,
                        type: 'blog' as const,
                        title: blog.title,
                        content_preview: blog.excerpt || blog.content?.substring(0, 150) || '',
                        status: blog.status,
                        created_at: blog.created_at,
                        ai_generated: blog.ai_generated || false,
                        full_data: blog,
                    })),
                    ...(linkedInCarousels || []).map((carousel: any) => ({
                        id: carousel.id,
                        type: 'linkedin' as const,
                        title: carousel.topic,
                        content_preview: carousel.slides?.[0]?.headline || carousel.caption?.substring(0, 100) || '',
                        status: carousel.status,
                        created_at: carousel.created_at,
                        ai_generated: true,
                        full_data: carousel,
                    })),
                    ...(instagramPosts || []).map((post: any) => ({
                        id: post.id,
                        type: 'instagram' as const,
                        title: post.topic,
                        content_preview: post.caption?.substring(0, 100) || '',
                        status: post.status,
                        created_at: post.created_at,
                        ai_generated: true,
                        full_data: post,
                    })),
                    ...(resources || []).map((resource: any) => ({
                        id: resource.id,
                        type: 'resource' as const,
                        title: resource.title,
                        content_preview: resource.description || '',
                        status: resource.status,
                        created_at: resource.created_at,
                        ai_generated: false,
                        full_data: resource,
                    })),
                ];

                // Sort by created_at
                items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                return items;
            } catch (error) {
                console.error("[ContentApproval] Query failed:", error);
                throw error;
            }
        },
        retry: 2,
        staleTime: 30000,
    });
}

// Get rejected content items
export function useRejectedContentItems() {
    return useQuery({
        queryKey: ["rejected_content_items"],
        queryFn: async () => {
            const { data: blogs, error: blogsError } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("status", "rejected")
                .order("created_at", { ascending: false });

            if (blogsError) throw blogsError;

            const { data: linkedInCarousels, error: linkedInError } = await supabase
                .from("linkedin_carousels")
                .select("id, topic, status, created_at, rejected_at, rejection_reason, target_audience, caption")
                .eq("status", "archived")
                .order("rejected_at", { ascending: false });

            if (linkedInError) throw linkedInError;

            const { data: instagramPosts, error: instagramError } = await (supabase
                .from("instagram_posts" as any)
                .select("id, topic, status, created_at, rejected_at, rejection_reason, target_audience, caption, hashtags")
                .eq("status", "archived")
                .order("rejected_at", { ascending: false }) as any);

            if (instagramError) console.error("[ContentApproval] Error fetching rejected Instagram:", instagramError);

             // Fetch rejected resources
             const { data: resources, error: resourcesError } = await (supabase
             .from("resources" as any)
             .select("*")
             .eq("status", "rejected")
             .order("created_at", { ascending: false }) as any);

            const items = [
                ...(blogs || []).map((blog: any) => ({
                    id: blog.id,
                    type: 'blog' as const,
                    title: blog.title,
                    content_preview: blog.excerpt || blog.content.substring(0, 150),
                    status: blog.status,
                    created_at: blog.created_at,
                    rejected_at: blog.rejected_at,
                    rejection_reason: blog.rejection_reason,
                    ai_generated: blog.ai_generated || false,
                    full_data: blog,
                })),
                ...(linkedInCarousels || []).map((carousel: any) => ({
                    id: carousel.id,
                    type: 'linkedin' as const,
                    title: carousel.topic,
                    content_preview: carousel.slides?.[0]?.headline || carousel.caption?.substring(0, 100) || '',
                    status: carousel.status,
                    created_at: carousel.created_at,
                    rejected_at: carousel.rejected_at,
                    rejection_reason: carousel.rejection_reason,
                    ai_generated: true,
                    full_data: carousel,
                })),
                ...(instagramPosts || []).map((post: any) => ({
                    id: post.id,
                    type: 'instagram' as const,
                    title: post.topic,
                    content_preview: post.caption?.substring(0, 100) || '',
                    status: post.status,
                    created_at: post.created_at,
                    rejected_at: post.rejected_at,
                    rejection_reason: post.rejection_reason,
                    ai_generated: true,
                    full_data: post,
                })),
                ...(resources || []).map((resource: any) => ({
                    id: resource.id,
                    type: 'resource' as const,
                    title: resource.title,
                    content_preview: resource.description || '',
                    status: resource.status,
                    created_at: resource.created_at,
                    rejected_at: resource.updated_at,
                    rejection_reason: "Rejected by admin",
                    ai_generated: false,
                    full_data: resource,
                })),
            ];

            return items;
        },
    });
}

// Get approved content items
export function useApprovedContentItems() {
    return useQuery({
        queryKey: ["approved_content_items"],
        queryFn: async () => {
             const { data: blogs, error: blogsError } = await supabase
                .from("blog_posts")
                .select("*")
                .in("status", ["published", "scheduled"])
                .order("published_at", { ascending: false })
                .limit(50);

            if (blogsError) throw blogsError;

            const { data: linkedInCarousels, error: linkedInError } = await supabase
                .from("linkedin_carousels")
                .select("id, topic, status, created_at, updated_at, target_audience, caption, scheduled_for")
                .in("status", ["approved", "published", "scheduled"])
                .order("updated_at", { ascending: false })
                .limit(50);

            if (linkedInError) throw linkedInError;

            const { data: instagramPosts, error: instagramError } = await (supabase
                .from("instagram_posts" as any)
                .select("id, topic, status, created_at, updated_at, target_audience, caption, hashtags, scheduled_date")
                .in("status", ["approved", "published", "scheduled"])
                .order("updated_at", { ascending: false })
                .limit(50) as any);

            if (instagramError) console.error("[ContentApproval] Error fetching approved Instagram:", instagramError);

             // Fetch approved resources
             const { data: resources, error: resourcesError } = await (supabase
             .from("resources" as any)
             .select("*")
             .in("status", ["approved", "published", "scheduled"])
             .order("updated_at", { ascending: false })
             .limit(50) as any);

            const items = [
                ...(blogs || []).map((blog: any) => ({
                    id: blog.id,
                    type: 'blog' as const,
                    title: blog.title,
                    content_preview: blog.excerpt || blog.content.substring(0, 150),
                    status: blog.status,
                    created_at: blog.created_at,
                    approved_at: blog.published_at,
                    ai_generated: blog.ai_generated || false,
                    full_data: blog,
                })),
                ...(linkedInCarousels || []).map((carousel: any) => ({
                    id: carousel.id,
                    type: 'linkedin' as const,
                    title: carousel.topic,
                    content_preview: carousel.slides?.[0]?.headline || carousel.caption?.substring(0, 100) || '',
                    status: carousel.status,
                    created_at: carousel.created_at,
                    approved_at: carousel.updated_at,
                    ai_generated: true,
                    full_data: carousel,
                })),
                ...(instagramPosts || []).map((post: any) => ({
                    id: post.id,
                    type: 'instagram' as const,
                    title: post.topic,
                    content_preview: post.caption?.substring(0, 100) || '',
                    status: post.status,
                    created_at: post.created_at,
                    approved_at: post.updated_at,
                    ai_generated: true,
                    full_data: post,
                })),
                ...(resources || []).map((resource: any) => ({
                    id: resource.id,
                    type: 'resource' as const,
                    title: resource.title,
                    content_preview: resource.description || '',
                    status: resource.status,
                    created_at: resource.created_at,
                    approved_at: resource.updated_at,
                    ai_generated: false,
                    full_data: resource,
                })),
            ];

            items.sort((a, b) => {
                const dateA = a.approved_at ? new Date(a.approved_at).getTime() : new Date(a.created_at).getTime();
                const dateB = b.approved_at ? new Date(b.approved_at).getTime() : new Date(b.created_at).getTime();
                return dateB - dateA;
            });

            return items;
        },
    });
}

// Approve Resource
export function useApproveResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await (supabase
                .from("resources" as any)
                .update({ status: "published" })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["approved_content_items"] });
            toast.success("Recurso aprovado e publicado com sucesso!");
        },
        onError: (error: any) => {
            console.error("Error approving resource:", error);
            toast.error("Erro ao aprovar recurso");
        },
    });
}

// Reject Resource
export function useRejectResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
             const { data, error } = await (supabase
                .from("resources" as any)
                .update({ status: "rejected" })
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["content_approval_items"] });
            queryClient.invalidateQueries({ queryKey: ["rejected_content_items"] });
            toast.success("Recurso rejeitado");
        },
        onError: (error: any) => {
            console.error("Error rejecting resource:", error);
            toast.error("Erro ao rejeitar recurso");
        },
    });
}
