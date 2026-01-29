// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PermissionLevel = "super_admin" | "admin" | "none";

interface AdminPermission {
    email: string;
    permission_level: PermissionLevel;
    display_name: string | null;
}

export function useAdminPermissions() {
    const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>("none");
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            console.log("[DEBUG useAdminPermissions] User from auth:", user);

            if (!user) {
                console.warn("[DEBUG] No user, setting none");
                setPermissionLevel("none");
                setIsLoading(false);
                return;
            }

            setUserEmail(user.email ?? null);

            // Use the server-side security definer function to check roles
            // This is more robust as it bypasses RLS and checks both tables atomically
            console.log("[DEBUG] Calling has_role RPC with:", { p_uid: user.id, p_role: 'admin' });
            const { data: hasAdminRole, error } = await supabase
                .rpc('has_role', {
                    p_uid: user.id,
                    p_role: 'admin'
                });

            console.log("[DEBUG] has_role response:", { hasAdminRole, error });

            if (error) {
                console.error("[DEBUG] RPC ERROR, setting none:", error);
                setPermissionLevel("none");
            } else if (hasAdminRole) {
                // Fetch display name separately if needed, or default to admin
                // For now, we assume 'admin' level if has_role is true
                // To distinguish super_admin vs admin we might need to enhance has_role or keep a simple query

                // Optimization: Just check if they are super admin specifically?
                // For now, let's keep it simple: if has_role('admin') -> set as 'admin' 
                // We can query details if we want to distinguish super_admin specific features

                // If we strictly need super_admin for some features, we should query admin_permissions
                // BUT to solve the login loop, basic access is the priority.

                // Let's try to get details safely
                console.log("[DEBUG] Fetching from admin_permissions, email:", user.email);
                const { data: permData, error: permError } = await supabase
                    .from("admin_permissions")
                    .select("permission_level, display_name")
                    .eq("email", user.email)
                    .maybeSingle();

                console.log("[DEBUG] admin_permissions result:", { permData, permError });

                if (permData) {
                    console.log("[DEBUG] Found! Setting level:", permData.permission_level);
                    setPermissionLevel(permData.permission_level as PermissionLevel);
                    setDisplayName(permData.display_name);
                } else {
                    // Check legacy
                    console.log("[DEBUG] Not in admin_permissions, checking admin_users, user_id:", user.id);
                    const { data: legacyData, error: legacyError } = await supabase
                        .from("admin_users")
                        .select("permission_level")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    console.log("[DEBUG] admin_users result:", { legacyData, legacyError });

                    if (legacyData) {
                        console.log("[DEBUG] Found in legacy table, setting admin");
                        setPermissionLevel("admin"); // Legacy usually implies admin/super_admin
                    } else {
                        console.log("[DEBUG] Not in either table but has_role=true, defaulting to admin");
                        setPermissionLevel("admin"); // Fallback if has_role said yes
                    }
                }
            } else {
                console.warn("[DEBUG] has_role returned FALSE or NULL, setting none");
                setPermissionLevel("none");
            }
        } catch (error) {
            console.error("Error checking permissions:", error);
            setPermissionLevel("none");
        } finally {
            setIsLoading(false);
        }
    };

    const isSuperAdmin = permissionLevel === "super_admin";
    const isAdmin = permissionLevel === "admin" || permissionLevel === "super_admin";

    // Define what each role can access
    const canAccessLinkedIn = isSuperAdmin;
    const canAccessCampaigns = isSuperAdmin;
    const canAccessKnowledgeBase = isSuperAdmin;
    const canAccessRejectionAnalytics = isSuperAdmin;
    const canAccessProductAssets = isSuperAdmin;
    const canAccessEnvironmentAssets = isSuperAdmin;

    // All admins can access these
    const canAccessDashboard = isAdmin;
    const canAccessGallery = isAdmin;
    const canAccessBlog = isAdmin;
    const canAccessContentApproval = isAdmin;

    return {
        permissionLevel,
        displayName,
        userEmail,
        isLoading,
        isSuperAdmin,
        isAdmin,
        // Feature permissions
        canAccessLinkedIn,
        canAccessCampaigns,
        canAccessKnowledgeBase,
        canAccessRejectionAnalytics,
        canAccessProductAssets,
        canAccessEnvironmentAssets,
        canAccessDashboard,
        canAccessGallery,
        canAccessBlog,
        canAccessContentApproval,
    };
}
