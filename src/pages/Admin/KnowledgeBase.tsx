// @ts-nocheck
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { KnowledgeBaseCore } from "@/components/admin/content/KnowledgeBaseCore";

export default function KnowledgeBase() {
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                <AdminSidebar />
                <main className="flex-1 overflow-auto">
                    <header className="border-b bg-card h-16 flex items-center px-4 md:px-6 justify-between sticky top-0 z-10 w-full">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <h2 className="text-xl font-semibold">Base de Conhecimento</h2>
                        </div>
                    </header>
                    
                    <div className="p-4 md:p-8">
                        <KnowledgeBaseCore />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
