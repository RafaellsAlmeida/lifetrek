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

            // Directly query admin_permissions table - simpler and avoids RPC issues
            console.log("[DEBUG] Checking admin_permissions for email:", user.email);
            const { data: permData, error: permError } = await supabase
                .from("admin_permissions")
                .select("permission_level, display_name")
                .eq("email", user.email)
                .maybeSingle();

            console.log("[DEBUG] admin_permissions result:", { permData, permError });

            if (permData) {
                console.log("[DEBUG] Found in admin_permissions! Setting level:", permData.permission_level);
                setPermissionLevel(permData.permission_level as PermissionLevel);
                setDisplayName(permData.display_name);
            } else {
                // Check legacy admin_users table
                console.log("[DEBUG] Not in admin_permissions, checking admin_users, user_id:", user.id);
                const { data: legacyData, error: legacyError } = await supabase
                    .from("admin_users")
                    .select("permission_level")
                    .eq("user_id", user.id)
                    .maybeSingle();

                console.log("[DEBUG] admin_users result:", { legacyData, legacyError });

                if (legacyData) {
                    console.log("[DEBUG] Found in legacy admin_users table");
                    setPermissionLevel(legacyData.permission_level as PermissionLevel || "admin");
                } else {
                    console.warn("[DEBUG] User not found in any admin table, setting none");
                    setPermissionLevel("none");
                }
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
