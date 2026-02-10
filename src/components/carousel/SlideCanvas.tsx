import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";


export type SlideTheme = "corporate" | "modern" | "bold";
export type SlideLayout = "standard" | "big-statement" | "split" | "data" | "quote";

interface ThemeColors {
    background: string;
    text: string;
    accent: string;
    accentSecondary: string;
    overlay: string;
    overlayGradient: string;
    badgeBg: string; // Default badge bg
    badgeText: string;
    cardBg: string; // For the "LM" logo box
    borderColor: string;
}

// LIFETREK BRAND IDENTITY (Visual Lock)
const LIFETREK_COLORS = {
    DEEP_BLUE: "hsl(210 100% 18%)",
    TECH_GREEN: "hsl(142 70% 35%)",
    ACCENT_ORANGE: "hsl(25 90% 52%)",
    TEXT_WHITE: "hsl(0 0% 100%)",
};

const THEMES: Record<SlideTheme, ThemeColors> = {
    corporate: {
        background: LIFETREK_COLORS.DEEP_BLUE,
        text: LIFETREK_COLORS.TEXT_WHITE,
        accent: LIFETREK_COLORS.TECH_GREEN,
        accentSecondary: LIFETREK_COLORS.ACCENT_ORANGE,
        overlay: `linear-gradient(135deg, ${LIFETREK_COLORS.DEEP_BLUE} 0%, hsl(210 100% 28%) 100%)`,
        overlayGradient: `linear-gradient(to top, ${LIFETREK_COLORS.DEEP_BLUE.replace(")", " / 0.95)")} 0%, ${LIFETREK_COLORS.DEEP_BLUE.replace(")", " / 0.6)")} 40%, ${LIFETREK_COLORS.DEEP_BLUE.replace(")", " / 0.3)")} 100%)`,
        badgeBg: "hsl(0 0% 100% / 0.15)",
        badgeText: "white",
        cardBg: "hsl(0 0% 100% / 0.15)",
        borderColor: "hsl(0 0% 100% / 0.15)",
    },
    modern: {
        background: "hsl(210 20% 98%)", // Off White
        text: "hsl(222 47% 11%)", // Dark Slate
        accent: "hsl(221 83% 53%)", // Bright Blue
        accentSecondary: "hsl(262 83% 58%)", // Purple
        overlay: "linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(210 20% 96%) 100%)",
        overlayGradient: "linear-gradient(to top, hsl(0 0% 100% / 0.95) 0%, hsl(0 0% 100% / 0.6) 40%, hsl(0 0% 100% / 0.3) 100%)",
        badgeBg: "hsl(222 47% 11% / 0.1)",
        badgeText: "hsl(222 47% 11%)",
        cardBg: "hsl(222 47% 11% / 0.05)",
        borderColor: "hsl(222 47% 11% / 0.1)",
    },
    bold: {
        background: "hsl(0 0% 0%)", // Pure Black
        text: "hsl(0 0% 100%)",
        accent: "hsl(47 100% 50%)", // Yellow
        accentSecondary: "hsl(0 100% 60%)", // Red
        overlay: "linear-gradient(135deg, hsl(0 0% 0%) 0%, hsl(0 0% 10%) 100%)",
        overlayGradient: "linear-gradient(to top, hsl(0 0% 0% / 0.95) 0%, hsl(0 0% 0% / 0.6) 40%, hsl(0 0% 0% / 0.3) 100%)",
        badgeBg: "hsl(0 0% 100%)",
        badgeText: "black",
        cardBg: "hsl(0 0% 100% / 0.2)",
        borderColor: "hsl(0 0% 100% / 0.3)",
    }
};

interface SlideCanvasProps {
    mode: "edit" | "preview" | "export";
    theme?: SlideTheme;
    layout?: SlideLayout;
    slide: {
        type: "hook" | "content" | "cta";
        headline: string;
        body: string;
        imageUrl?: string;
        textPlacement?: "burned_in" | "overlay";
    };
    className?: string;
    aspectRatio?: "square" | "portrait";
}

export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
    ({ mode, slide, className, aspectRatio = "square", theme = "corporate", layout = "standard" }, ref) => {
        const containerClasses = cn(
            "relative overflow-hidden flex flex-col",
            aspectRatio === "square" ? "aspect-square" : "aspect-[4/5]",
            className
        );

        const isExport = mode === "export";
        const currentTheme = THEMES[theme];
        // ALWAYS render ONLY the image when imageUrl exists (Nano Banana generates burned-in text)
        const hasGeneratedImage = !!slide.imageUrl;

        // If image exists, render ONLY the image without any text/badges/overlays
        // Nano Banana generates images with text burned-in, no overlay needed


        // Brand type labels
        const typeLabels: Record<string, string> = {
            hook: "GANCHO",
            content: "CONTEÚDO",
            cta: "CTA",
        };

        const getAccentColor = (type: string) => {
            if (type === "cta") return currentTheme.accentSecondary;
            return currentTheme.accent;
        }

        // --- Layout Content Renderers ---

        const renderStandardLayout = () => (
            <div className="flex flex-col gap-8 mt-auto mb-auto pb-12">
                <h2
                    className={cn(
                        "font-bold leading-tight tracking-tight",
                        slide.type === "hook" ? "text-6xl" : "text-5xl"
                    )}
                    style={{
                        textShadow: theme === "modern" ? "none" : "0 2px 12px rgba(0,0,0,0.5)",
                        color: currentTheme.text
                    }}
                >
                    {slide.headline}
                </h2>
                <div
                    className="w-20 h-2 rounded-full"
                    style={{ backgroundColor: getAccentColor(slide.type) }}
                />
                <p
                    className={cn(
                        "font-medium whitespace-pre-line leading-relaxed",
                        slide.type === "hook" ? "text-2xl" : "text-xl"
                    )}
                    style={{
                        color: currentTheme.text,
                        opacity: 0.9,
                        textShadow: theme === "modern" ? "none" : "0 1px 4px rgba(0,0,0,0.4)"
                    }}
                >
                    {slide.body}
                </p>
            </div>
        );

        const renderBigStatementLayout = () => (
            <div className="flex flex-col gap-6 mt-auto mb-auto items-center text-center">
                <div
                    className="w-24 h-2 rounded-full mb-4"
                    style={{ backgroundColor: getAccentColor(slide.type) }}
                />
                <h2
                    className="font-black leading-[0.9] tracking-tighter"
                    style={{
                        fontSize: "clamp(3rem, 8vw, 6rem)", // Responsive massive font
                        textShadow: theme === "modern" ? "none" : "0 4px 20px rgba(0,0,0,0.6)",
                        color: currentTheme.text
                    }}
                >
                    {slide.headline.toUpperCase()}
                </h2>
                {slide.body && (
                    <p
                        className="text-xl font-medium max-w-[80%]"
                        style={{ color: currentTheme.text, opacity: 0.8 }}
                    >
                        {slide.body}
                    </p>
                )}
            </div>
        );

        const renderQuoteLayout = () => (
            <div className="flex flex-col gap-6 mt-auto mb-auto relative">
                <span
                    className="absolute -top-12 -left-4 text-9xl leading-none opacity-20 font-serif"
                    style={{ color: getAccentColor(slide.type) }}
                >
                    &ldquo;
                </span>
                <p
                    className="font-serif italic leading-relaxed text-3xl z-10 relative"
                    style={{
                        color: currentTheme.text,
                        textShadow: theme === "modern" ? "none" : "0 2px 4px rgba(0,0,0,0.4)"
                    }}
                >
                    {slide.headline}
                </p>
                <div className="flex items-center gap-3">
                    <div className="h-[1px] w-12" style={{ backgroundColor: getAccentColor(slide.type) }} />
                    <p className="font-bold uppercase tracking-wider text-sm" style={{ color: currentTheme.text, opacity: 0.8 }}>
                        {slide.body}
                    </p>
                </div>
            </div>
        );

        const renderDataLayout = () => (
            <div className="flex flex-col gap-2 mt-auto mb-auto items-center text-center">
                <h2
                    className="font-black leading-none tracking-tighter"
                    style={{
                        fontSize: "clamp(6rem, 15vw, 10rem)",
                        color: getAccentColor(slide.type),
                        textShadow: theme === "modern" ? "none" : "0 4px 30px rgba(0,0,0,0.5)",
                    }}
                >
                    {slide.headline.replace(/[^0-9%]/g, "")}
                    <span className="text-4xl align-top ml-1">
                        {slide.headline.replace(/[0-9]/g, "")}
                    </span>
                </h2>
                <div className="h-2 w-full max-w-[200px] rounded-full my-4 opacity-50" style={{ backgroundColor: currentTheme.text }} />

                <p
                    className="font-bold text-2xl leading-tight max-w-[80%]"
                    style={{ color: currentTheme.text }}
                >
                    {slide.body}
                </p>
            </div>
        );

        // Split Layout Handler (Needs structural change in main return)
        const isSplit = layout === "split";


        return (
            <div
                ref={ref}
                className={containerClasses}
                style={{
                    width: isExport ? "1080px" : "100%",
                    height: isExport ? "1080px" : "auto",
                    backgroundColor: currentTheme.background,
                }}
            >
                {/* Background Image Layer */}
                <div className={cn("absolute inset-0 z-0", isSplit ? "h-[50%] top-0 bottom-auto aspect-square w-full" : "")}>
                    {slide.imageUrl ? (
                        <>
                            <img
                                src={slide.imageUrl}
                                alt="Background"
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                            {/* Brand-colored overlay gradient */}
                            <div
                                className="absolute inset-0"
                                style={{ background: isSplit ? "transparent" : currentTheme.overlayGradient }}
                            />
                        </>
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: isSplit ? "hsl(0 0% 50% / 0.1)" : currentTheme.overlay }}
                        >
                            {!isSplit && (
                                <span className="text-sm font-medium opacity-40" style={{ color: currentTheme.text }}>
                                    Sem imagem de fundo
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Layer */}
                <div
                    className={cn(
                        "relative z-10 flex-1 flex flex-col p-10 h-full justify-between",
                        isSplit ? "mt-[50%] bg-transparent" : "" // Push content down in split mode
                    )}
                    style={{
                        color: currentTheme.text,
                        background: isSplit ? currentTheme.background : "transparent"
                    }}
                >
                    {/* Header / Brand Area */}
                    {!isSplit && (
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                                    style={{
                                        backgroundColor: currentTheme.cardBg,
                                        backdropFilter: "blur(8px)",
                                    }}
                                >
                                    <span className="font-bold text-sm" style={{ color: currentTheme.text }}>LM</span>
                                </div>
                            </div>
                            <Badge
                                variant="secondary"
                                className="border-0 uppercase tracking-wider text-[10px] font-semibold"
                                style={{
                                    backgroundColor: slide.type === "cta" || slide.type === "hook"
                                        ? getAccentColor(slide.type) // Use specific accent 
                                        : currentTheme.badgeBg,
                                    color: slide.type === "cta" || slide.type === "hook"
                                        ? "white" // Accents usually white text
                                        : currentTheme.badgeText,
                                    opacity: slide.type === "content" ? 1 : 0.9
                                }}
                            >
                                {typeLabels[slide.type] || slide.type.toUpperCase()}
                            </Badge>
                        </div>
                    )}

                    {/* Main Content Area Routing */}
                    {layout === "big-statement" ? renderBigStatementLayout() :
                        layout === "quote" ? renderQuoteLayout() :
                            layout === "data" ? renderDataLayout() :
                                renderStandardLayout()
                    }

                    {/* Footer Area */}
                    <div
                        className="pt-6 flex justify-between items-center text-sm font-medium"
                        style={{
                            borderTop: `1px solid ${currentTheme.borderColor}`,
                            color: currentTheme.text,
                            opacity: 0.7
                        }}
                    >
                        <span>Lifetrek Medical</span>
                        <span>lifetrek-medical.com</span>
                    </div>
                </div>
            </div>
        );
    }
);

SlideCanvas.displayName = "SlideCanvas";
