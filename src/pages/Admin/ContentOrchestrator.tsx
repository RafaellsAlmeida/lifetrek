// @ts-nocheck
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ContentOrchestratorCore } from "@/components/admin/content/ContentOrchestratorCore";

export default function ContentOrchestrator() {
    return (
        <AdminLayout>
            <ContentOrchestratorCore />
        </AdminLayout>
    );
}
