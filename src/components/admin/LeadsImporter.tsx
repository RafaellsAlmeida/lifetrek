// @ts-nocheck
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

interface LeadsImporterProps {
    onImportComplete: () => void;
}

export function LeadsImporter({ onImportComplete }: LeadsImporterProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const [importStats, setImportStats] = useState<{
        total: number;
        success: number;
        failed: number;
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
                setFile(selectedFile);
                parsePreview(selectedFile);
                setImportStats(null);
            } else {
                toast.error("Por favor, selecione um arquivo CSV válido");
            }
        }
    };

    const parsePreview = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split("\n");
            const headers = lines[0].split(",").map(h => h.trim());

            const previewData = lines.slice(1, 6)
                .filter(line => line.trim())
                .map(line => {
                    const values = line.split(",").map(v => v.trim());
                    return headers.reduce((obj, header, index) => {
                        obj[header] = values[index];
                        return obj;
                    }, {} as any);
                });

            setPreview(previewData);
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split("\n");
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase()); // Normalize headers

            let successCount = 0;
            let failedCount = 0;

            // Identify column indexes
            const emailIdx = headers.findIndex(h => h.includes("email"));
            const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("nome"));
            const companyIdx = headers.findIndex(h => h.includes("company") || h.includes("empresa"));
            const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("telefone"));
            const notesIdx = headers.findIndex(h => h.includes("notes") || h.includes("obs"));

            const rows = lines.slice(1).filter(line => line.trim());

            for (const row of rows) {
                try {
                    // Handle CSV parsing better (respect quotes)
                    const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                        ?.map(v => v.replace(/^"|"$/g, '').trim()) || row.split(",").map(v => v.trim());

                    const email = values[emailIdx];

                    if (!email || !email.includes("@")) {
                        failedCount++;
                        continue;
                    }

                    const leadData = {
                        email: email,
                        name: nameIdx >= 0 ? values[nameIdx] : email.split("@")[0],
                        company_name: companyIdx >= 0 ? values[companyIdx] : null,
                        phone: phoneIdx >= 0 ? values[phoneIdx] : null,
                        notes: notesIdx >= 0 ? values[notesIdx] : "Imported via CSV",
                        source: "csv_import",
                        status: "new",
                        score: 0 // Default score
                    };

                    // Insert into Supabase
                    const { error } = await supabase
                        .from("leads")
                        .upsert(leadData, { onConflict: "email" });

                    if (error) throw error;
                    successCount++;

                } catch (error) {
                    console.error("Error processing row:", row, error);
                    failedCount++;
                }
            }

            setImportStats({
                total: rows.length,
                success: successCount,
                failed: failedCount
            });

            if (successCount > 0) {
                toast.success(`${successCount} leads importados com sucesso!`);
                onImportComplete();
            } else {
                toast.error("Nenhum lead foi importado. Verifique o formato do arquivo.");
            }

            setIsUploading(false);
            setFile(null);
            setPreview([]);
        };

        reader.readAsText(file);
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importar Leads (CSV)
                </CardTitle>
                <CardDescription>
                    Importe leads em massa. O arquivo deve conter cabeçalhos como: Email, Name, Company, Phone.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                {file ? file.name : "Selecionar Arquivo CSV"}
                            </label>
                        </div>

                        {file && (
                            <Button
                                onClick={() => setFile(null)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}

                        {file && (
                            <Button
                                onClick={processImport}
                                className="ml-auto"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Processar Importação
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {importStats && (
                        <Alert variant={importStats.success > 0 ? "default" : "destructive"}>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Importação Concluída</AlertTitle>
                            <AlertDescription>
                                Processados: {importStats.total} | Sucesso: {importStats.success} | Falhas: {importStats.failed}
                            </AlertDescription>
                        </Alert>
                    )}

                    {preview.length > 0 && (
                        <div className="mt-4 border rounded-md overflow-hidden">
                            <div className="bg-muted px-4 py-2 text-sm font-medium">Pré-visualização (5 primeiras linhas)</div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            {Object.keys(preview[0]).map((header) => (
                                                <th key={header} className="px-4 py-2 text-left font-medium text-muted-foreground">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="px-4 py-2 text-muted-foreground">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
