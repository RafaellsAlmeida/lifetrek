import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
    chart: string;
}

// Initialize mermaid with custom theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#EAF2FA',
        primaryTextColor: '#1F2937',
        primaryBorderColor: '#004F8F',
        lineColor: '#004F8F',
        secondaryColor: '#F8FAFC',
        tertiaryColor: '#E2E8F0',
        edgeLabelBackground: '#F1F5F9',
        fontSize: '14px',
        fontFamily: 'Inter, system-ui, sans-serif'
    },
    flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: 60,
        rankSpacing: 80,
        padding: 20,
        wrappingWidth: 200
    },
    securityLevel: 'loose'
});

export default function Mermaid({ chart }: MermaidProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const renderChart = async () => {
            if (!containerRef.current || !chart) return;

            try {
                // Generate unique ID for this chart
                const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                // Clear previous content
                containerRef.current.innerHTML = '';

                // Render the chart
                const { svg: renderedSvg } = await mermaid.render(id, chart);
                setSvg(renderedSvg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Failed to render diagram');
            }
        };

        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">{chart}</pre>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="mermaid-container w-full overflow-x-auto"
            style={{ minHeight: '400px' }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
