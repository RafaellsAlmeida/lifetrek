
import React, { useState, useRef } from 'react';
import { Stage, Layer, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wand2, Loader2, StopCircle } from "lucide-react";

// Reuse similar logic from ImageEditor or shared constants
const TEMPLATES = {
    Identity: { bg: '/assets/templates/identity_bg.png', color: '#ffffff' },
    Capabilities: { bg: '/assets/templates/capabilities_bg.png', color: '#ffffff' },
    Trust: { bg: '/assets/templates/trust_bg.png', color: '#ffffff' },
    Default: { bg: 'https://placehold.co/1080x1080/2a2a2a/FFF?text=Lifetrek', color: '#ffffff' }
};

const URLImage = ({ src, x, y, width, height }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

export function BatchImageGenerator({ onComplete }: { onComplete: () => void }) {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentPost, setCurrentPost] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const stageRef = useRef<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [stopRequested, setStopRequested] = useState(false);

    // Canvas state for the hidden renderer
    const [canvasState, setCanvasState] = useState({
        bgUrl: TEMPLATES.Default.bg,
        text: "Loading...",
        pillar: "Default"
    });

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

    const runBatch = async () => {
        setProcessing(true);
        setStopRequested(false);
        setProgress(0);
        setLogs([]);

        // 1. Fetch Candidates
        addLog("Fetching posts without images...");
        const { data: posts, error } = await supabase
            .from('content_templates')
            .select('*')
            .is('image_url', null)
            .in('status', ['draft', 'pending', 'approved']); // Process mostly active ones
        
        if (error || !posts || posts.length === 0) {
            addLog("No posts found needing images.");
            setProcessing(false);
            return;
        }

        addLog(`Found ${posts.length} posts.`);
        let completed = 0;

        for (const post of posts) {
            if (stopRequested) {
                addLog("Stopped by user.");
                break;
            }

            setCurrentPost(post);
            
            // 2. Prepare Canvas
            const pillar = post.pillar && TEMPLATES[post.pillar as keyof typeof TEMPLATES] ? post.pillar : 'Default';
            const template = TEMPLATES[pillar as keyof typeof TEMPLATES];
            
            setCanvasState({
                bgUrl: template.bg,
                text: post.title || "Lifetrek Medical",
                pillar
            });

            // Wait for render (crucial for Konva/React update)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 3. Generate Blob
            try {
                if (!stageRef.current) throw new Error("Stage not ready");
                
                const uri = stageRef.current.toDataURL();
                const blob = await (await fetch(uri)).blob();
                const fileName = `generated/${post.id}_${Date.now()}.png`;

                // 4. Upload
                const { error: uploadError } = await supabase.storage
                    .from('content_assets')
                    .upload(fileName, blob);
                
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('content_assets')
                    .getPublicUrl(fileName);

                // 5. Update DB
                await supabase
                    .from('content_templates')
                    .update({ image_url: publicUrl })
                    .eq('id', post.id);

                addLog(`Generated for: ${post.title?.substring(0, 20)}...`);
            } catch (err: any) {
                addLog(`Failed ${post.id}: ${err.message}`);
                console.error(err);
            }

            completed++;
            setProgress((completed / posts.length) * 100);
        }

        setProcessing(false);
        setCurrentPost(null);
        toast.success(`Batch complete. Processed ${completed} images.`);
        onComplete();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Auto-Generate Images
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Batch Image Generator</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    {processing ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span>Processing...</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} />
                            <div className="bg-muted p-2 rounded text-xs font-mono h-24 overflow-y-auto">
                                {logs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                            <Button variant="destructive" onClick={() => setStopRequested(true)} className="w-full">
                                <StopCircle className="w-4 h-4 mr-2" /> Stop
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                This will find all posts without images and generate a standard image based on their Pillar (Identity, Capabilities, Trust).
                            </p>
                            <Button onClick={runBatch} className="w-full">
                                <Wand2 className="w-4 h-4 mr-2" /> Start Generation
                            </Button>
                        </div>
                    )}

                    {/* Hidden Stage for Rendering */}
                    <div className="overflow-hidden h-0 w-0 opacity-0 absolute">
                         <Stage width={1080} height={1080} ref={stageRef}>
                            <Layer>
                                <URLImage src={canvasState.bgUrl} x={0} y={0} width={1080} height={1080} />
                                <Text 
                                    text={canvasState.text}
                                    x={100} 
                                    y={300}
                                    width={880}
                                    fontSize={80}
                                    fontFamily="Inter"
                                    fontStyle="bold"
                                    fill={TEMPLATES[canvasState.pillar as keyof typeof TEMPLATES]?.color || 'white'}
                                    align="center"
                                />
                                <Text 
                                    text="Lifetrek Medical"
                                    x={100} 
                                    y={900}
                                    width={880}
                                    fontSize={40}
                                    fontFamily="Inter"
                                    fill="white"
                                    opacity={0.8}
                                    align="center"
                                />
                            </Layer>
                         </Stage>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
