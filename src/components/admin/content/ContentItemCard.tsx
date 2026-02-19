import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Eye,
    Image as ImageIcon,
    Globe,
    ThumbsUp,
    ThumbsDown,
    Linkedin,
    Instagram,
    FileText,
    BookOpen,
    Clock
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface ContentItemCardProps {
    item: any;
    onPreview: (item: any) => void;
    onApprove: (item: any) => void;
    onReject: (item: any) => void;
    onEdit?: (item: any) => void;
    onSchedule?: (item: any) => void;
    isApprovedView?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

export function ContentItemCard({
    item,
    onPreview,
    onApprove,
    onReject,
    onEdit,
    onSchedule,
    isApprovedView = false,
    isSelected = false,
    onSelect
}: ContentItemCardProps) {
    const navigate = useNavigate();

    const getPlatformIcon = () => {
        switch (item.type) {
            case 'blog': return <FileText className="h-4 w-4 text-blue-500" />;
            case 'resource': return <BookOpen className="h-4 w-4 text-amber-600" />;
            case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
            case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-600" />;
            default: return null;
        }
    };

    const getPlatformColor = () => {
        switch (item.type) {
            case 'blog': return 'border-blue-200 bg-blue-50/30';
            case 'resource': return 'border-amber-200 bg-amber-50/30';
            case 'instagram': return 'border-pink-200 bg-pink-50/30';
            case 'linkedin': return 'border-blue-200 bg-blue-50/30';
            default: return '';
        }
    };

    const imageUrl = item.image_urls?.[0] ||
        item.full_data?.image_urls?.[0] ||
        item.full_data?.slides?.[0]?.imageUrl ||
        item.full_data?.slides?.[0]?.image_url ||
        item.full_data?.cover_image ||
        item.full_data?.image;

    return (
        <Card className={`group relative overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md ${isApprovedView ? 'flex' : ''} ${isSelected ? 'ring-2 ring-primary border-primary/30' : ''}`}>
            {onSelect && (
                <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity" data-selected={isSelected}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelect(item.id)}
                        className="bg-white/90 backdrop-blur shadow-sm border-primary/20"
                    />
                </div>
            )}
            {isApprovedView && imageUrl && (
                <div className="w-32 h-auto bg-slate-100 relative shrink-0 overflow-hidden">
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            )}

            <div className="flex-1">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                {getPlatformIcon()}
                                <CardTitle className={`text-base font-semibold group-hover:text-primary transition-colors`}>
                                    {item.title}
                                </CardTitle>
                                {isApprovedView && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">Aprovado</Badge>
                                )}
                            </div>
                            <CardDescription className="line-clamp-2 text-xs opacity-80">
                                {item.content_preview || item.excerpt || 'Sem prévia disponível'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex gap-2 flex-wrap pb-4">
                    <Button variant="outline" size="sm" onClick={() => onPreview(item)} className="h-8 gap-2 text-xs">
                        <Eye className="h-3.5 w-3.5" /> Ver
                    </Button>

                    {!isApprovedView && (
                        <>
                            {(item.type === 'linkedin' || item.type === 'instagram') && onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(item)}
                                    className="h-8 gap-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                >
                                    <ImageIcon className="h-3.5 w-3.5" /> Design
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/admin/content-preview/${item.type}/${item.id}`)}
                                className="h-8 gap-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                            >
                                <Globe className="h-3.5 w-3.5" /> Site
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => onApprove(item)}
                                className="h-8 gap-2 text-xs bg-green-600 hover:bg-green-700 shadow-sm"
                            >
                                <ThumbsUp className="h-3.5 w-3.5" /> Aprovar
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onReject(item)}
                                className="h-8 gap-2 text-xs shadow-sm"
                            >
                                <ThumbsDown className="h-3.5 w-3.5" /> Rejeitar
                            </Button>
                        </>
                    )}

                    {isApprovedView && onSchedule && (
                        <Button
                            size="sm"
                            onClick={() => onSchedule(item)}
                            className="h-8 gap-2 text-xs bg-blue-600 hover:bg-blue-700 shadow-sm"
                        >
                            <Clock className="h-3.5 w-3.5" /> Agendar
                        </Button>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}
