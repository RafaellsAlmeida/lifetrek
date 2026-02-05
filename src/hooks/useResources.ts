import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resource, ResourceInsert, ResourceUpdate } from "@/types/resources";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useResources(publishedOnly = true) {
    return useQuery({
        queryKey: ["resources", publishedOnly],
        queryFn: async () => {
            let query = (supabase
                .from("resources" as any)
                .select("*") as any);

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
            const { data, error } = await (supabase
                .from("resources" as any)
                .select("*")
                .eq("slug", slug)
                .eq("status", "published")
                .single() as any);

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
            const { data, error } = await (supabase
                .from("resources" as any)
                .insert(resource)
                .select()
                .single() as any);

            if (error) throw error;
            return data as Resource;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
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
            const { data, error } = await (supabase
                .from("resources" as any)
                .update(updates)
                .eq("id", id)
                .select()
                .single() as any);

            if (error) throw error;
            return data as Resource;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
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
            const { error } = await (supabase
                .from("resources" as any)
                .delete()
                .eq("id", id) as any);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            toast.success("Recurso excluído com sucesso!");
        },
        onError: (error) => {
            console.error("Error deleting resource:", error);
            toast.error("Erro ao excluir recurso");
        },
    });
}
