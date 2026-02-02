import { ReactNode, useEffect } from "react";
import { AdminHeader } from "./AdminHeader";

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    // Removed forced dark mode to respect brand book's clean/white aesthetic
    
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
            <AdminHeader />
            <main className="flex-1">
                {/* Removed max-w-7xl constraint to allow CRM to breathe */}
                <div className="w-full px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:w-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
