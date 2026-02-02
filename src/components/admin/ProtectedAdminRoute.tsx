import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function ProtectedAdminRoute() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session?.user) {
                    console.log("[ProtectedAdminRoute] No valid session found");
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // Check Database Permissions
                const { data: permData } = await supabase
                  .from("admin_permissions")
                  .select("permission_level")
                  .eq("email", session.user.email)
                  .single();

                if (permData) {
                    // User is an admin in the DB
                    setIsAuthenticated(true);
                } else {
                    // Fallback: Check legacy admin_users if needed, or failure
                    // For now, strict DB check
                    console.warn(`[ProtectedAdminRoute] User ${session.user.email} not found in admin_permissions.`);
                    setIsAuthenticated(false);
                    
                    // Optional: Sign out if they shouldn't be here? 
                    // Keeping them signed in but blocking route is safer for UX if they are valid users but just not admins.
                }

            } catch (err) {
                console.error("[ProtectedAdminRoute] Error checking auth:", err);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
