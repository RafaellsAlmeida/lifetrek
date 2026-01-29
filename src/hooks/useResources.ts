import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Resource, ResourceInsert, ResourceUpdate } from "@/types/resources";
import { toast } from "sonner";

// Mock data since 'resources' table doesn't exist yet
const MOCK_RESOURCES: Resource[] = [
    {
        id: "1",
        title: "Calculadora de TCO: Importação vs. Local",
        description: "Compare o custo total de propriedade entre importar dispositivos médicos e fabricar localmente. Inclui custos ocultos como estoque, lead time e compliance.",
        content: "",
        type: "calculator",
        persona: "Supply Chain / CFO",
        status: "published",
        slug: "calculadora-tco",
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "2",
        title: "Checklist de Auditoria ISO 13485",
        description: "7 pontos críticos de validação para auditar fornecedores de dispositivos médicos. Baseado nas melhores práticas da Lifetrek Medical.",
        content: "",
        type: "checklist",
        persona: "Quality / Regulatory",
        status: "published",
        slug: "checklist-iso-13485",
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "3",
        title: "Guia: Swiss Turning vs. CNC Convencional",
        description: "Entenda quando usar cada tecnologia para fabricação de implantes e micromecânica de precisão. Inclui comparativo de tolerâncias e acabamentos.",
        content: "",
        type: "guide",
        persona: "Engineering / R&D",
        status: "published",
        slug: "guia-swiss-turning",
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: "4",
        title: "Guia de Validação de Fadiga para Implantes",
        description: "Metodologia completa para testes de fadiga em implantes ortopédicos e espinhais segundo normas ASTM e ISO.",
        content: "",
        type: "guide",
        persona: "Engineering / Quality",
        status: "published",
        slug: "validacao-fadiga",
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export function useResources(publishedOnly = true) {
    return useQuery({
        queryKey: ["resources", publishedOnly],
        queryFn: async () => {
            // Return mock data - deduplicated by slug
            const seen = new Set<string>();
            return MOCK_RESOURCES.filter(r => {
                if (seen.has(r.slug)) return false;
                seen.add(r.slug);
                return publishedOnly ? r.status === "published" : true;
            });
        },
    });
}

export function useResource(slug: string) {
    return useQuery({
        queryKey: ["resource", slug],
        queryFn: async () => {
            const resource = MOCK_RESOURCES.find(r => r.slug === slug);
            if (!resource) throw new Error("Resource not found");
            return resource;
        },
        enabled: !!slug,
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (resource: ResourceInsert) => {
            // Mock - would normally insert to DB
            toast.info("Recursos estão em modo mock - tabela não existe ainda");
            return { ...resource, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            toast.success("Recurso criado (mock)!");
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
            // Mock
            toast.info("Recursos estão em modo mock");
            return { id, ...updates };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            toast.success("Recurso atualizado (mock)!");
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
            // Mock
            toast.info("Recursos estão em modo mock");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            toast.success("Recurso excluído (mock)!");
        },
        onError: (error) => {
            console.error("Error deleting resource:", error);
            toast.error("Erro ao excluir recurso");
        },
    });
}
