import React from 'react';
import { X, ExternalLink, Globe, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WebsitePreviewFrameProps {
    url: string;
    children: React.ReactNode;
    onClose?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    isApproving?: boolean;
    isRejecting?: boolean;
    title?: string;
}

export const WebsitePreviewFrame: React.FC<WebsitePreviewFrameProps> = ({
    url,
    children,
    onClose,
    onApprove,
    onReject,
    isApproving,
    isRejecting,
    title
}) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
            {/* Preview Mode Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-center gap-3 text-white text-sm font-medium shadow-lg">
                <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs font-bold uppercase tracking-wider">
                    Modo Preview
                </Badge>
                <span>Esta é uma simulação de como o conteúdo aparecerá no site após aprovação</span>
            </div>

            {/* Browser Chrome */}
            <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-3">
                {/* Traffic Lights */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onClose}
                        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
                    >
                        <X className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1 ml-2">
                    <button className="p-1 rounded hover:bg-slate-700 text-slate-400">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-700 text-slate-400">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="p-1 rounded hover:bg-slate-700 text-slate-400">
                        <RotateCw className="h-4 w-4" />
                    </button>
                </div>

                {/* URL Bar */}
                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="bg-slate-700 rounded-lg px-4 py-1.5 flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="text-slate-300 truncate font-mono text-xs">
                            {url}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-auto cursor-pointer hover:text-slate-300" />
                    </div>
                </div>

                {/* Page Title */}
                {title && (
                    <div className="text-slate-400 text-xs truncate max-w-48">
                        {title}
                    </div>
                )}
            </div>

            {/* Content Area - Simulated Website */}
            <div className="flex-1 overflow-auto bg-white">
                {children}
            </div>

            {/* Action Footer */}
            <div className="bg-slate-800 border-t border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="text-slate-400 text-sm">
                    Revise o conteúdo acima antes de aprovar para publicação
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        Fechar Preview
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onReject}
                        disabled={isRejecting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isRejecting ? 'Rejeitando...' : 'Rejeitar'}
                    </Button>
                    <Button
                        onClick={onApprove}
                        disabled={isApproving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isApproving ? 'Aprovando...' : 'Aprovar e Publicar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
