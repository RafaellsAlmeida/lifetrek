
import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Save, Download, ArrowLeft } from "lucide-react";

const FILTER_TEMPLATES = {
    identity: { bg: '/assets/templates/identity_bg.png', textColor: '#ffffff' },
    capabilities: { bg: '/assets/templates/capabilities_bg.png', textColor: '#ffffff' },
    trust: { bg: '/assets/templates/trust_bg.png', textColor: '#ffffff' },
};

const URLImage = ({ src, x, y, width, height }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} x={x} y={y} width={width} height={height} />;
};

export default function ImageEditor() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("postId");
  const navigate = useNavigate();
  const stageRef = useRef<any>(null);

  const [post, setPost] = useState<any>(null);
  const [text, setText] = useState("Headline Goes Here");
  const [canvasSize] = useState({ width: 1080, height: 1080 }); // Square post
  const [bgUrl, setBgUrl] = useState("https://placehold.co/1080x1080/1a1a1a/FFF?text=Background");

  useEffect(() => {
    if (postId) loadPost();
  }, [postId]);

  const loadPost = async () => {
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .eq('id', postId!)
      .single();
    
    if (data) {
        setPost(data);
        setText(data.title || "New Post");
        // Simple logic to choose template
        if (data.pillar === 'Identity') setBgUrl(FILTER_TEMPLATES.identity.bg);
        // If image exists, maybe load it? 
    }
  };

  const handleDownload = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = `post-${postId || 'new'}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!postId) return;
    try {
        const uri = stageRef.current.toDataURL();
        const blob = await (await fetch(uri)).blob();
        const fileName = `posts/${postId}_${Date.now()}.png`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('content_assets') // Ensure this bucket exists
            .upload(fileName, blob);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('content_assets')
            .getPublicUrl(fileName);

        // Update Post
        const { error: updateError } = await supabase
            .from('content_templates')
            .update({ image_url: publicUrl })
            .eq('id', postId);
        
        if (updateError) throw updateError;

        toast.success("Image saved and linked to post!");
    } catch (e: any) {
        toast.error(`Error saving image: ${e.message}`);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Controls */}
      <div className="w-80 border-r p-4 space-y-6 bg-muted/10 h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-bold text-lg">Image Editor</h2>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Headline Text</Label>
                <Input value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <Label>Background URL</Label>
                <Input value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} />
            </div>
            
            <div className="pt-4 flex gap-2">
                <Button className="flex-1 gap-2" onClick={handleSave}>
                    <Save className="w-4 h-4" /> Save to Post
                </Button>
                <Button variant="outline" size="icon" onClick={handleDownload} title="Download PNG">
                    <Download className="w-4 h-4" />
                </Button>
            </div>
        </div>

        {post && (
            <div className="mt-8 p-4 bg-muted/20 rounded-lg text-xs space-y-2">
                <h3 className="font-semibold">Context</h3>
                <p><strong>Pillar:</strong> {post.pillar || 'N/A'}</p>
                <p><strong>Title:</strong> {post.title}</p>
            </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-900 overflow-auto p-8">
        <div className="shadow-2xl border-4 border-zinc-800 rounded-lg overflow-hidden">
             <Stage width={canvasSize.width * 0.6} height={canvasSize.height * 0.6} scaleX={0.6} scaleY={0.6} ref={stageRef}>
                <Layer>
                    <URLImage src={bgUrl} x={0} y={0} width={canvasSize.width} height={canvasSize.height} />
                    
                    {/* Overlay Dimmer */}
                    {/* <Rect width={1080} height={1080} fill="black" opacity={0.3} /> */}

                    {/* Text Layer */}
                    <Text 
                        text={text}
                        x={100} 
                        y={300}
                        width={880}
                        fontSize={80}
                        fontFamily="Arial"
                        fontStyle="bold"
                        fill="white"
                        align="center"
                        draggable
                    />
                    
                     <Text 
                        text="Lifetrek Medical"
                        x={100} 
                        y={900}
                        width={880}
                        fontSize={40}
                        fontFamily="Arial"
                        fill="white"
                        opacity={0.8}
                        align="center"
                    />
                </Layer>
             </Stage>
        </div>
      </div>
    </div>
  );
}
