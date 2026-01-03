import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  Star,
  ExternalLink,
  Search,
  Filter,
  Download,
  Linkedin,
  Award,
  Globe
} from "lucide-react";

interface EnrichedLead {
  id: string;
  company: string;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  decision_maker: string | null;
  decision_makers_deep: any;
  scraped_emails: string | null;
  linkedin_person: string | null;
  lead_score: number | null;
  predicted_score: number | null;
  v2_score: number | null;
  renner_score: number | null;
  confidence_score: number | null;
  employees: number | null;
  years_active: number | null;
  products: string | null;
  fda_certified: boolean;
  ce_certified: boolean;
  linkedin_company: string | null;
  perplexity_segment: string | null;
  perplexity_city: string | null;
  perplexity_state: string | null;
  perplexity_decision_makers: string | null;
  perplexity_notes: string | null;
  status: string | null;
  source: string | null;
  enrichment_status: number;
  nome_empresa: string | null;
  created_at: string;
  updated_at: string;
}

interface EnrichedLeadsTableProps {
  leads: EnrichedLead[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function EnrichedLeadsTable({ leads, loading = false, onRefresh }: EnrichedLeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<EnrichedLead | null>(null);

  // Get unique segments and states for filters
  const segments = [...new Set(leads.map(l => l.perplexity_segment).filter(Boolean))];
  const states = [...new Set(leads.map(l => l.state).filter(Boolean))];

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === "" ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSegment = segmentFilter === "all" || lead.perplexity_segment === segmentFilter;

    const matchesScore = scoreFilter === "all" ||
      (scoreFilter === "high" && (lead.lead_score || 0) >= 80) ||
      (scoreFilter === "medium" && (lead.lead_score || 0) >= 60 && (lead.lead_score || 0) < 80) ||
      (scoreFilter === "low" && (lead.lead_score || 0) < 60);

    const matchesState = stateFilter === "all" || lead.state === stateFilter;

    return matchesSearch && matchesSegment && matchesScore && matchesState;
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const exportToCSV = () => {
    const csvContent = [
      // Headers
      ["Company", "Email", "Phone", "City", "State", "Score", "Segment", "Decision Maker", "Website"].join(","),
      // Data
      ...filteredLeads.map(lead => [
        lead.company,
        lead.email || "",
        lead.phone || "",
        lead.city || "",
        lead.state || "",
        lead.lead_score || "",
        lead.perplexity_segment || "",
        lead.decision_maker || "",
        lead.website || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enriched-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const LeadCard = ({ lead }: { lead: EnrichedLead }) => (
    <Card
      className="hover:shadow-md transition-all duration-200 border-l-4 cursor-pointer"
      style={{
        borderLeftColor: (lead.lead_score || 0) >= 80 ? "#22c55e" : (lead.lead_score || 0) >= 60 ? "#f59e0b" : "#6b7280"
      }}
      onClick={() => setSelectedLead(lead)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              {lead.company}
              {(lead.lead_score || 0) >= 80 && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </h4>
            {lead.perplexity_segment && (
              <Badge variant="outline" className="mt-1 text-xs">
                {lead.perplexity_segment}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getScoreColor(lead.lead_score)}>
              Score: {lead.lead_score || "N/A"}
            </Badge>
            {lead.confidence_score && (
              <Badge variant="secondary" className="text-xs">
                Confiança: {lead.confidence_score}%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          {lead.email && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.city && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{lead.city}, {lead.state}</span>
            </div>
          )}
          {lead.employees && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{lead.employees} funcionários</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {lead.fda_certified && (
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                FDA
              </Badge>
            )}
            {lead.ce_certified && (
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                CE
              </Badge>
            )}
          </div>
          {lead.website && (
            <Button variant="ghost" size="sm" asChild>
              <a href={lead.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const LeadDetailsModal = ({ lead }: { lead: EnrichedLead }) => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              {lead.company}
              {(lead.lead_score || 0) >= 80 && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {lead.perplexity_segment && (
                <Badge variant="outline">{lead.perplexity_segment}</Badge>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setSelectedLead(null)}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scores Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Lead Score</div>
            <div className="text-2xl font-bold">{lead.lead_score || "N/A"}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Confiança</div>
            <div className="text-2xl font-bold">{lead.confidence_score || "N/A"}%</div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Informações de Contato
          </h3>
          <div className="grid gap-2 text-sm">
            {lead.email && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Email:</span>
                <span className="font-medium">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Telefone:</span>
                <span className="font-medium">{lead.phone}</span>
              </div>
            )}
            {lead.decision_maker && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Decisor:</span>
                <span className="font-medium">{lead.decision_maker}</span>
              </div>
            )}
            {lead.linkedin_company && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">LinkedIn:</span>
                <a
                  href={lead.linkedin_company}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Linkedin className="h-4 w-4" />
                  Ver perfil
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Building className="h-4 w-4" />
            Detalhes da Empresa
          </h3>
          <div className="grid gap-2 text-sm">
            {lead.city && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Localização:</span>
                <span className="font-medium">{lead.city}, {lead.state}</span>
              </div>
            )}
            {lead.employees && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Funcionários:</span>
                <span className="font-medium">{lead.employees}</span>
              </div>
            )}
            {lead.years_active && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Anos Ativo:</span>
                <span className="font-medium">{lead.years_active} anos</span>
              </div>
            )}
            {lead.website && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-32">Website:</span>
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {lead.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        {lead.products && (
          <div className="space-y-2">
            <h3 className="font-semibold">Produtos</h3>
            <p className="text-sm text-muted-foreground">{lead.products}</p>
          </div>
        )}

        {/* Certifications */}
        <div className="flex gap-2">
          {lead.fda_certified && (
            <Badge variant="outline">
              <Award className="h-3 w-3 mr-1" />
              FDA Certificado
            </Badge>
          )}
          {lead.ce_certified && (
            <Badge variant="outline">
              <Award className="h-3 w-3 mr-1" />
              CE Certificado
            </Badge>
          )}
        </div>

        {/* Perplexity Notes */}
        {lead.perplexity_notes && (
          <div className="space-y-2">
            <h3 className="font-semibold">Notas de Enriquecimento</h3>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {lead.perplexity_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Leads Enriquecidos
              </CardTitle>
              <CardDescription>
                {filteredLeads.length} de {leads.length} leads
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Atualizar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Segmentos</SelectItem>
                {segments.map(segment => (
                  <SelectItem key={segment} value={segment || ""}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Scores</SelectItem>
                <SelectItem value="high">Alto (≥80)</SelectItem>
                <SelectItem value="medium">Médio (60-79)</SelectItem>
                <SelectItem value="low">Baixo (&lt;60)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Estados</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state || ""}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSegmentFilter("all");
                setScoreFilter("all");
                setStateFilter("all");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lead Details Modal */}
      {selectedLead && <LeadDetailsModal lead={selectedLead} />}

      {/* Leads List */}
      {!selectedLead && (
        <ScrollArea className="h-[600px]">
          <div className="grid gap-4 pr-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Carregando leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum lead encontrado com os filtros selecionados</p>
              </div>
            ) : (
              filteredLeads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
