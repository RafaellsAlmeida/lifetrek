import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileWarning, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ValidationResult {
  rows_total: number;
  accepted_count: number;
  rejected_count: number;
  rejected_rows?: Array<{ row_number: number; reason: string }>;
  periods_detected?: string[];
  duplicate_periods?: string[];
  expected_columns?: string[];
}

interface IngestResult extends ValidationResult {
  inserted_count?: number;
  skipped_duplicate_hash_count?: number;
  deleted_for_overwrite_count?: number;
  conflict_policy?: string;
}

export function LinkedInCsvUploadPanel() {
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [conflictPolicy, setConflictPolicy] = useState<"skip" | "overwrite_period">("skip");
  const [isValidating, setIsValidating] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  const expectedColumns = useMemo(
    () => [
      "post date",
      "post url",
      "impressions",
      "clicks",
      "reactions",
      "comments",
      "shares",
      "engagement rate",
      "ctr",
      "post id",
    ],
    []
  );

  const handleFileChange = async (file?: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setValidationResult(null);
    setIngestResult(null);

    const text = await file.text();
    setCsvText(text);
  };

  const runValidation = async () => {
    if (!csvText.trim()) {
      toast.error("Selecione um arquivo CSV antes de validar.");
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-linkedin-analytics", {
        body: {
          mode: "validate",
          csv_text: csvText,
          file_name: fileName || null,
        },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || "Falha na validação");

      setValidationResult(data);
      toast.success("Validação concluída.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao validar CSV.");
    } finally {
      setIsValidating(false);
    }
  };

  const runIngest = async () => {
    if (!csvText.trim()) {
      toast.error("Selecione um arquivo CSV antes de importar.");
      return;
    }

    setIsIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-linkedin-analytics", {
        body: {
          mode: "ingest",
          conflict_policy: conflictPolicy,
          csv_text: csvText,
          file_name: fileName || null,
        },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || "Falha na importação");

      setIngestResult(data);
      toast.success("Importação concluída.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao importar CSV.");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-600" />
          LinkedIn CSV Upload
        </CardTitle>
        <CardDescription>
          Valide o schema antes da ingestão e revise o resultado de linhas aceitas/rejeitadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin-csv-upload">Arquivo CSV</Label>
          <input
            id="linkedin-csv-upload"
            type="file"
            accept=".csv,text/csv"
            className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            onChange={(e) => void handleFileChange(e.target.files?.[0])}
          />
          {fileName && <p className="text-xs text-muted-foreground">Arquivo selecionado: {fileName}</p>}
        </div>

        <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
          <p className="text-sm font-medium mb-2">Colunas esperadas</p>
          <p className="text-xs text-muted-foreground">{expectedColumns.join(", ")}</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:w-72">
            <Label>Política de conflito (período duplicado)</Label>
            <Select value={conflictPolicy} onValueChange={(value: "skip" | "overwrite_period") => setConflictPolicy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione política" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Pular duplicados (recomendado)</SelectItem>
                <SelectItem value="overwrite_period">Sobrescrever período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={runValidation} disabled={isValidating || isIngesting}>
              {isValidating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Validar
            </Button>
            <Button onClick={runIngest} disabled={isIngesting || isValidating}>
              {isIngesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Importar
            </Button>
          </div>
        </div>

        {validationResult && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Pré-validação</AlertTitle>
            <AlertDescription>
              Total: {validationResult.rows_total} | Aceitas: {validationResult.accepted_count} | Rejeitadas:{" "}
              {validationResult.rejected_count}
              {validationResult.periods_detected?.length
                ? ` | Períodos: ${validationResult.periods_detected.join(", ")}`
                : ""}
              {validationResult.duplicate_periods?.length
                ? ` | Duplicados: ${validationResult.duplicate_periods.join(", ")}`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        {ingestResult && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Resultado da ingestão</AlertTitle>
            <AlertDescription>
              Inseridas: {ingestResult.inserted_count || 0} | Rejeitadas: {ingestResult.rejected_count} | Duplicadas
              ignoradas: {ingestResult.skipped_duplicate_hash_count || 0}
              {(ingestResult.deleted_for_overwrite_count || 0) > 0
                ? ` | Removidas por overwrite: ${ingestResult.deleted_for_overwrite_count}`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        {(validationResult?.rejected_rows?.length || ingestResult?.rejected_rows?.length) ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
              <FileWarning className="h-4 w-4" />
              Linhas com erro (amostra)
            </div>
            <ul className="text-xs text-amber-900 space-y-1 list-disc pl-4">
              {(ingestResult?.rejected_rows || validationResult?.rejected_rows || []).slice(0, 8).map((item) => (
                <li key={`${item.row_number}-${item.reason}`}>
                  Linha {item.row_number}: {item.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

