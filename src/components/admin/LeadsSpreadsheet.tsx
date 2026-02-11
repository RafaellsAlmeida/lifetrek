import { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, RefreshCw, Search } from "lucide-react";
import Papa from "papaparse";

export interface Lead {
  id: string;
  company?: string;
  name: string;
  email: string;
  website?: string;
  phone?: string;
  industry?: string;
  city?: string;
  state?: string;
  lead_score?: number;
  status: string;
  priority: string;
  source?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export const LeadsSpreadsheet = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lead_score", desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const { toast } = useToast();

  // Fetch leads from database
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_leads")
        .select("*")
        .eq("source", "website")
        .order("lead_score", { ascending: false })
        .limit(5000);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "No accounts",
          description: "No accounts found in the database",
        });
        setLeads([]);
      } else {
        setLeads(data as Lead[]);
      }
    } catch (error: any) {
      console.error("Database error:", error.message);
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel("leads_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_leads",
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCellUpdate = async (
    leadId: string,
    field: string,
    value: any
  ) => {
    try {
      const { error } = await supabase
        .from("contact_leads")
        .update({ [field]: value })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Account updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "company", e.target.value)
            }
            className="min-w-[200px]"
          />
        ),
      },
      {
        accessorKey: "industry",
        header: "Industry",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "industry", e.target.value)
            }
            className="min-w-[150px]"
          />
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <div className="max-w-[200px] truncate text-xs" title={getValue() as string}>
            {(getValue() as string) || "-"}
          </div>
        ),
      },
      {
        accessorKey: "website",
        header: "Website",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "website", e.target.value)
            }
            className="min-w-[150px]"
          />
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "phone", e.target.value)
            }
            className="min-w-[120px]"
          />
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "city", e.target.value)
            }
            className="min-w-[100px]"
          />
        ),
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "state", e.target.value)
            }
            className="min-w-[80px]"
          />
        ),
      },
      {
        accessorKey: "lead_score",
        header: "Score",
        cell: ({ getValue }) => {
          const score = getValue() as number | null;
          return (
            <div className="font-bold text-center">
              {typeof score === 'number' ? score : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row, getValue }) => {
          const status = getValue() as string;
          const colors: Record<string, string> = {
            new: "bg-yellow-100 text-yellow-800",
            contacted: "bg-blue-100 text-blue-800",
            in_progress: "bg-purple-100 text-purple-800",
            quoted: "bg-indigo-100 text-indigo-800",
            closed: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
          };
          return (
            <select
              value={status}
              onChange={(e) =>
                handleCellUpdate(row.original.id, "status", e.target.value)
              }
              className={`px-2 py-1 rounded text-sm ${colors[status] || "bg-gray-100"}`}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="quoted">Quoted</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row, getValue }) => {
          const priority = getValue() as string;
          const colors: Record<string, string> = {
            low: "bg-gray-100 text-gray-800",
            medium: "bg-blue-100 text-blue-800",
            high: "bg-orange-100 text-orange-800",
          };
          return (
            <select
              value={priority}
              onChange={(e) =>
                handleCellUpdate(row.original.id, "priority", e.target.value)
              }
              className={`px-2 py-1 rounded text-sm ${colors[priority] || "bg-gray-100"}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          );
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ getValue }) => (
          <div className="text-xs text-gray-600">
            {(getValue() as string) || "-"}
          </div>
        ),
      },
      {
        accessorKey: "admin_notes",
        header: "Notes",
        cell: ({ row, getValue }) => (
          <Input
            defaultValue={(getValue() as string) || ""}
            onBlur={(e) =>
              handleCellUpdate(row.original.id, "admin_notes", e.target.value)
            }
            className="min-w-[200px]"
          />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExport = () => {
    const csv = Papa.unparse(leads);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounts_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: `${leads.length} accounts exported to CSV`,
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const response = await supabase.functions.invoke("import-leads", {
            body: { leads: results.data },
          });

          if (response.error) throw response.error;

          toast({
            title: "Import successful",
            description: `Imported ${results.data.length} accounts`,
          });

          fetchLeads();
        } catch (error: any) {
          toast({
            title: "Import failed",
            description: error.message,
            variant: "destructive",
          });
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 mr-2 text-gray-400" />
          <Input
            placeholder="Search accounts..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLeads} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </span>
            </Button>
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-600">
        <span>Total: {leads.length}</span>
        <span>
          Closed: {leads.filter((l) => l.status === "closed").length}
        </span>
        <span>
          New: {leads.filter((l) => l.status === "new").length}
        </span>
      </div>

      <div className="border rounded-lg overflow-auto h-[600px]">
        <table className="w-full relative">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" ? " 🔼" : header.column.getIsSorted() === "desc" ? " 🔽" : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  No accounts found. Import a CSV to get started.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
