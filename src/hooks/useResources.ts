import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resource, ResourceInsert, ResourceUpdate } from "@/types/resources";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const approvalQueryKeys = [
    ["resources"],
    ["content_approval_items"],
    ["content-approval-items"],
    ["approved_content_items"],
] as const;

function invalidateResourceQueries(queryClient: ReturnType<typeof useQueryClient>) {
    return Promise.all(
        approvalQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
    );
}

export function useResources(publishedOnly = true) {
    return useQuery({
        queryKey: ["resources", publishedOnly],
        queryFn: async () => {
            let query = supabase
                .from("resources")
                .select("*");

            if (publishedOnly) {
                query = query.eq("status", "published");
            }

            const { data, error } = await query.order("created_at", { ascending: false });

            if (error) throw error;
            return data as Resource[];
        },
    });
}

export function useResource(slug: string) {
    return useQuery({
        queryKey: ["resource", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("resources")
                .select("*")
                .eq("slug", slug)
                .eq("status", "published")
                .single();

            if (error) throw error;
            return data as Resource;
        },
        enabled: !!slug,
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: ResourceInsert) => {
            const { data, error } = await supabase
                .from("resources")
                .insert(resource as any)
                .select()
                .single();

            if (error) throw error;
            return data as Resource;
        },
        onSuccess: () => {
            void invalidateResourceQueries(queryClient);
            toast.success("Recurso criado com sucesso!");
        },
        onError: (error) => {
            console.error("Error creating resource:", error);
            toast.error("Erro ao criar recurso");
        },
    });
}

export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: ResourceUpdate) => {
            const { data, error } = await supabase
                .from("resources")
                .update(updates as any)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Resource;
        },
        onSuccess: () => {
            void invalidateResourceQueries(queryClient);
            toast.success("Recurso atualizado com sucesso!");
        },
        onError: (error) => {
            console.error("Error updating resource:", error);
            toast.error("Erro ao atualizar recurso");
        },
    });
}

export function useDeleteResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("resources")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            void invalidateResourceQueries(queryClient);
            toast.success("Recurso excluído com sucesso!");
        },
        onError: (error) => {
            console.error("Error deleting resource:", error);
            toast.error("Erro ao excluir recurso");
        },
    });
}

export function usePublishResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data: currentResource, error: fetchError } = await supabase
                .from("resources")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;
            if (!currentResource?.content?.trim()) {
                throw new Error("Preencha o conteúdo do recurso antes de publicar.");
            }

            const now = new Date().toISOString();
            const metadata = ((currentResource as any)?.metadata || {}) as Record<string, unknown>;

            const { data, error } = await supabase
                .from("resources")
                .update({
                    status: "published",
                    metadata: {
                        ...metadata,
                        published_at: now,
                    },
                } as any)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Resource;
        },
        onSuccess: () => {
            void invalidateResourceQueries(queryClient);
            toast.success("Recurso publicado com sucesso!");
        },
        onError: (error) => {
            console.error("Error publishing resource:", error);
            toast.error("Erro ao publicar recurso");
        },
    });
}
