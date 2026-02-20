import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
    fallbackClassName?: string;
    fallbackText?: string;
}

export function ImageWithFallback({
    src,
    alt,
    className,
    fallbackClassName,
    fallbackText = "Imagem indisponivel",
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);

    if (hasError || !src) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2",
                    fallbackClassName || className
                )}
            >
                <ImageOff className="h-8 w-8" />
                <span className="text-xs text-center px-2">{fallbackText}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
        />
    );
}
