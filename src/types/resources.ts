export interface Resource {
    id: string;
    title: string;
    description: string;
    content: string;
    type: 'checklist' | 'guide' | 'calculator';
    persona?: string;
    thumbnail_url?: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected';
    slug: string;
    metadata: Record<string, unknown> | null;
    user_id?: string;
    created_at: string;
    updated_at: string;
}

export type ResourceInsert = Omit<Resource, 'id' | 'created_at' | 'updated_at'>;
export type ResourceUpdate = Partial<ResourceInsert> & { id: string };
