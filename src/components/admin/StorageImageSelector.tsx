// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface StorageAsset {
    id: string;
    url: string;
    name: string;
    type: 'environment' | 'product';
    category?: string;
}

interface StorageImageSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (imageUrl: string) => void;
}

export function StorageImageSelector({ open, onOpenChange, onSelect }: StorageImageSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    const { data: assets, isLoading } = useQuery({
        queryKey: ["all-storage-assets"],
        queryFn: async () => {
            // Fetch Content Assets (Environment)
            const { data: contentAssets, error: contentError } = await supabase
                .from("content_assets")
                .select("id, file_path, filename, category");

            if (contentError) throw contentError;

            // Fetch Product Images
            const { data: productAssets, error: productError } = await supabase
                .from("processed_product_images")
                .select("id, processed_bucket_path, product_name, category");

            if (productError) throw productError;

            const merged: StorageAsset[] = [
                ...(contentAssets || []).map(a => ({
                    id: a.id,
                    url: a.file_path,
                    name: a.filename,
                    type: 'environment' as const,
                    category: a.category || 'other'
                })),
                ...(productAssets || []).map(p => ({
                    id: p.id,
                    url: p.processed_bucket_path, // Note: This might need public URL resolution if not full URL
                    name: p.product_name,
                    type: 'product' as const,
                    category: p.category || 'product'
                }))
            ];

            return merged;
        },
        staleTime: 60000,
    });

    const filteredAssets = assets?.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || asset.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleSelect = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Image from Storage</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-4 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assets..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="environment">Environment</TabsTrigger>
                            <TabsTrigger value="product">Products</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredAssets?.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                            <p>No assets found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {filteredAssets?.map((asset) => (
                                <div
                                    key={asset.id}
                                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedAssetId === asset.id
                                            ? "border-primary ring-2 ring-primary ring-offset-2"
                                            : "border-transparent hover:border-muted-foreground"
                                        }`}
                                    onClick={() => {
                                        setSelectedAssetId(asset.id);
                                        setSelectedUrl(asset.url);
                                    }}
                                >
                                    <img
                                        src={asset.url}
                                        alt={asset.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 md:opacity-100">
                                        <p className="text-white text-xs font-medium truncate">{asset.name}</p>
                                        <Badge variant="secondary" className="text-[10px] w-fit mt-1 opacity-80 h-4 px-1">{asset.category}</Badge>
                                    </div>
                                    {selectedAssetId === asset.id && (
                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSelect} disabled={!selectedAssetId}>Select Image</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
