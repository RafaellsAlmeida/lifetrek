import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LeadsSpreadsheet } from "@/components/admin/LeadsSpreadsheet";

const AdminLeads = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/admin-login");
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your accounts with real-time synchronization
        </p>
      </div>
      <LeadsSpreadsheet />
    </div>
  );
};

export default AdminLeads;
