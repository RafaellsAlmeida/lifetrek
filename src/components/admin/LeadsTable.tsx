// @ts-nocheck
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadPriorityIndicator } from "./LeadPriorityIndicator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  dental_implants: "Implantes Dentários",
  orthopedic_implants: "Implantes Ortopédicos",
  spinal_implants: "Implantes Espinhais",
  veterinary_implants: "Implantes Veterinários",
  surgical_instruments: "Instrumentos Cirúrgicos",
  micro_precision_parts: "Micro Precisão",
  custom_tooling: "Ferramentas Sob Medida",
  medical_devices: "Dispositivos Médicos",
  measurement_tools: "Ferramentas de Medição",
  other_medical: "Outros Médicos",
};

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string;
  project_type?: string | null;
  project_types: string[] | null;
  annual_volume: string | null;
  technical_requirements: string;
  message: string | null;
  status: 'new' | 'contacted' | 'in_progress' | 'quoted' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  admin_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  lead_score: number | null;
  score_breakdown: any | null;
  source?: 'website' | 'unipile' | string | null;
}

interface LeadsTableProps {
  leads: Lead[];
  onViewDetails: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export const LeadsTable = ({ leads, onViewDetails, onDelete }: LeadsTableProps) => {
  const getProjectTypes = (lead: Lead) => {
    if (lead.project_types && lead.project_types.length > 0) {
      return lead.project_types;
    }
    if (lead.project_type) {
      return [lead.project_type];
    }
    return [];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pontuação</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Tipos de Projeto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                Nenhum lead encontrado
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  {lead.lead_score !== null ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          lead.lead_score >= 80 ? "default" : 
                          lead.lead_score >= 60 ? "secondary" : 
                          "outline"
                        }
                        className={
                          lead.lead_score >= 80 ? "bg-red-500 hover:bg-red-600" : 
                          lead.lead_score >= 60 ? "bg-amber-500 hover:bg-amber-600" : 
                          ""
                        }
                      >
                        {lead.lead_score >= 80 ? "🔥" : lead.lead_score >= 60 ? "⚡" : "❄️"} {lead.lead_score}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <LeadPriorityIndicator priority={lead.priority} />
                </TableCell>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company || '-'}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {getProjectTypes(lead).length > 0 ? (
                      getProjectTypes(lead).map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {PROJECT_TYPE_LABELS[type] || type}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <LeadStatusBadge status={lead.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">
                    {lead.source === "unipile" ? "Unipile" : "Website"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Atualizado {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(lead)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(lead.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};