import React, { useState } from 'react';
import { X, Globe, Monitor, Smartphone, Tablet, Share2, ArrowLeft } from 'lucide-react';
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

type DeviceType = 'desktop' | 'tablet' | 'mobile';

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
    const [device, setDevice] = useState<DeviceType>('desktop');

    const deviceStyles = {
        desktop: 'w-full h-full transition-all duration-500',
        tablet: 'w-[768px] h-[90%] mx-auto my-auto rounded-3xl border-[12px] border-slate-900 shadow-2xl transition-all duration-500 overflow-hidden',
        mobile: 'w-[375px] h-[80%] mx-auto my-auto rounded-[3rem] border-[12px] border-slate-900 shadow-2xl transition-all duration-500 overflow-hidden'
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 font-sans">
            {/* Premium Preview Mode Banner */}
            <div className="bg-gradient-to-r from-[#0a66c2] via-[#004182] to-[#0a66c2] px-4 py-1.5 flex items-center justify-between text-white text-[11px] font-medium shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0">
                        Admin Preview
                    </Badge>
                    <span className="opacity-80">Simulação de visualização em produção</span>
                </div>
                <div className="flex items-center gap-4 opacity-70">
                    <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> Desktop</span>
                    <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Responsivo</span>
                </div>
            </div>

            {/* Modern Browser Chrome */}
            <div className="bg-[#1e293b] border-b border-slate-800 px-3 md:px-4 py-2 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-2 pr-2 border-r border-slate-700/50">
                        <button
                            onClick={onClose}
                            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 transition-all flex items-center justify-center group"
                            aria-label="Voltar para Aprovação"
                            title="Voltar para Aprovação"
                        >
                            <X className="h-2 w-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Voltar para Aprovação"
                        className="h-8 px-2 md:px-3 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/80 shrink-0"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Voltar para Aprovação</span>
                        <span className="sm:hidden">Voltar</span>
                    </Button>

                    <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700/30 shrink-0">
                        <button
                            onClick={() => setDevice('desktop')}
                            className={`p-1.5 rounded-md transition-all ${device === 'desktop' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Desktop View"
                        >
                            <Monitor className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDevice('tablet')}
                            className={`p-1.5 rounded-md transition-all ${device === 'tablet' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Tablet View"
                        >
                            <Tablet className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDevice('mobile')}
                            className={`p-1.5 rounded-md transition-all ${device === 'mobile' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Mobile View"
                        >
                            <Smartphone className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="order-3 md:order-none basis-full md:basis-auto md:flex-1 min-w-0 flex items-center">
                        <div className="bg-slate-900/80 rounded-full px-3 md:px-4 py-1.5 flex items-center gap-2 text-sm border border-slate-700/50 w-full shadow-inner min-w-0">
                            <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="text-slate-400 truncate font-mono text-xs tracking-tight min-w-0">
                                {url}
                            </span>
                            <Share2 className="h-3.5 w-3.5 text-slate-600 ml-auto shrink-0 cursor-pointer hover:text-slate-400 transition-colors" />
                        </div>
                    </div>

                    <div className="order-4 basis-full md:basis-auto md:order-none flex items-center justify-end gap-2 md:gap-3 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 text-xs font-semibold px-3"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onReject}
                            disabled={isRejecting}
                            className="h-8 text-xs font-bold px-4 bg-red-600/90 hover:bg-red-600 shadow-lg shadow-red-900/20"
                        >
                            {isRejecting ? 'Negando...' : 'Reprovar'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={onApprove}
                            disabled={isApproving}
                            className="h-8 text-xs font-bold px-4 bg-[#0a66c2] hover:bg-[#004182] text-white shadow-lg shadow-blue-900/20"
                        >
                            {isApproving ? 'Agendando...' : 'Aprovar Conteúdo'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area - Simulated Website */}
            <div className="flex-1 overflow-auto bg-[#0f172a] flex items-center justify-center p-4">
                <div className={deviceStyles[device]}>
                    <div className="bg-white h-full w-full overflow-auto scrollbar-thin scrollbar-thumb-slate-300">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};
