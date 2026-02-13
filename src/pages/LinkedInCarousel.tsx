// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react"; // cache-bust
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Download, Star, Trash2, History, Image as ImageIcon, Wand2, Layout, Save, RefreshCw, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SlideCanvas, SlideLayout } from "@/components/carousel/SlideCanvas";
import { GenerationProgress, GenerationStep } from "@/components/carousel/GenerationProgress";
import { SlideCopyPanel } from "@/components/carousel/SlideCopyPanel";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import { Skeleton } from "@/components/ui/skeleton";
import { LINKEDIN_CAMPAIGN } from "@/config/linkedinCampaign";

interface CarouselSlide {
  headline: string;
  body: string;
  type: "hook" | "content" | "cta";
  imageUrl?: string;
  assetId?: string;
  backgroundType?: "asset" | "generate";
  layout?: SlideLayout;
  textPlacement?: "burned_in" | "overlay";
}

interface CarouselResult {
  id?: string;
  topic: string;
  targetAudience: string;
  slides: CarouselSlide[];
  caption: string;
  format?: string;
  imageUrls?: string[]; // Legacy support
}

interface CarouselHistoryItem {
  id: string;
  admin_user_id: string;
  topic: string;
  target_audience: string;
  pain_point: string | null;
  desired_outcome: string | null;
  proof_points: string | null;
  cta_action: string | null;
  slides: unknown;
  caption: string;
  format: string | null;
  image_urls: unknown;
  is_favorite: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  generation_settings: unknown;
  performance_metrics: unknown;
}

export default function LinkedInCarousel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Generation State
  const [topic, setTopic] = useState("");
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [painPoint, setPainPoint] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [proofPoints, setProofPoints] = useState("");
  const [referenceImage, setReferenceImage] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [ctaAction, setCtaAction] = useState("");
  const [format, setFormat] = useState<"carousel" | "single-image">("carousel");
  const [postType, setPostType] = useState<"value" | "commercial">("value");
  const [products, setProducts] = useState<{category: string; name: string; enhanced_url: string}[]>([]);

  // Workflow State
  const [currentStep, setCurrentStep] = useState<"content" | "design">("content");
  const [isGenerating, setIsGenerating] = useState(false);
  const [carouselResults, setCarouselResults] = useState<CarouselResult[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0); 
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselHistory, setCarouselHistory] = useState<CarouselHistoryItem[]>([]);
  const [carouselToDelete, setCarouselToDelete] = useState<string | null>(null);
  const [currentCarouselId, setCurrentCarouselId] = useState<string | null>(null);
  
  // Batch State
  const [numberOfCarousels, setNumberOfCarousels] = useState(1);
  const [currentTheme, setCurrentTheme] = useState<"corporate" | "modern" | "bold">("corporate");

  // Design State
  const slideRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null); // Hidden ref for high-res export
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [designLoading, setDesignLoading] = useState(false);

  // Generation Progress State
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string>("");
  const [strategistOutput, setStrategistOutput] = useState<string>("");
  const [analystOutput, setAnalystOutput] = useState<string>("");
  const [designerOutput, setDesignerOutput] = useState<string>("");
  const [agentStatus, setAgentStatus] = useState<{ agent: string; status: string; message: string } | undefined>();
  
  // Batch Campaign State
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentTopic: string } | null>(null);

  // Helper to get audience string from array
  const targetAudience = targetAudiences.length > 0 ? targetAudiences.join(", ") : "Geral";

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchCarouselHistory();
      fetchAssets();
      fetchProducts();
    }
  }, [isAdmin]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("processed_product_images")
        .select("category, name, enhanced_url")
        .eq("is_visible", true)
        .order("category");
      if (!error && data) setProducts(data);
    } catch (e) {
      console.error("Error fetching products:", e);
    }
  };

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/admin/login");
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (adminError || !adminData) {
        toast.error("Unauthorized access");
        navigate("/admin/login");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Access check error:", error);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchCarouselHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("linkedin_carousels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCarouselHistory(data || []);
    } catch (error) {
      console.error("Error fetching carousel history:", error);
      toast.error("Failed to load carousel history");
    }
  };

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("content_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Graceful fallback if table doesn't exist or other error
        console.warn("Could not fetch assets:", error.message);
        setAvailableAssets([]);
        return;
      }
      setAvailableAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAvailableAssets([]);
    }
  };

  const saveCarousel = async (result: CarouselResult, status: 'draft' | 'approved' | 'published' | 'archived' = 'approved') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        admin_user_id: user.id,
        topic,
        target_audience: targetAudience,
        pain_point: painPoint,
        desired_outcome: desiredOutcome,
        proof_points: proofPoints,
        cta_action: ctaAction,
        slides: result.slides as any,
        caption: result.caption,
        format: result.format || format,
        image_urls: result.slides.map(s => s.imageUrl || ""),
        status,
        generation_settings: {
          model: "google/gemini-3-pro-image-preview",
          timestamp: new Date().toISOString()
        }
      };

      if (currentCarouselId) {
        // Update
        const { error } = await supabase
          .from("linkedin_carousels")
          .update(payload)
          .eq("id", currentCarouselId);
        if (error) throw error;
        toast.success("Carousel updated");
      } else {
        // Insert
        const { data, error } = await supabase
          .from("linkedin_carousels")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setCurrentCarouselId(data.id);
        toast.success("Carousel saved");
      }

      await fetchCarouselHistory();
    } catch (error) {
      console.error("Error saving carousel:", error);
      toast.error("Failed to save carousel");
    }
  };

  // Auto-save carousel as draft and log generation
  const autoSaveCarousel = async (
    result: CarouselResult,
    generationTimeMs?: number,
    overrideStatus?: string,
    scheduledDate?: string,
    campaignId?: string,
    utmCampaign?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Auto-save: No user logged in");
        return;
      }

      // Ensure caption has a value (required field)
      const captionValue = result.caption || `Post sobre ${topic || result.topic}`;
      
      const payload = {
        admin_user_id: user.id,
        topic: result.topic || topic || "Sem tópico",
        target_audience: targetAudience || "Geral",
        pain_point: painPoint || null,
        desired_outcome: desiredOutcome || null,
        proof_points: proofPoints || null,
        cta_action: ctaAction || null,
        slides: result.slides as any,
        caption: captionValue,
        format: result.format || format,
        image_urls: result.slides.map(s => s.imageUrl || ""),
        status: overrideStatus || 'draft',
        scheduled_date: scheduledDate || null,
        campaign_id: campaignId || null,
        utm_campaign: utmCampaign || campaignId || null,
        generation_settings: {
          model: "google/gemini-3-pro-image-preview",
          timestamp: new Date().toISOString()
        }
      };

      console.log("Auto-save payload:", { 
        user_id: user.id, 
        topic: payload.topic,
        slides_count: payload.slides.length,
        has_caption: !!payload.caption
      });

      // Save carousel
      const { data: savedCarousel, error } = await supabase
        .from("linkedin_carousels")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Auto-save failed:", error.message, error.details, error.hint);
        toast.error(`Falha ao salvar: ${error.message}`);
        return;
      }

      console.log("Carousel saved successfully:", savedCarousel.id);

      // Log generation
      const { error: logError } = await supabase.from("linkedin_generation_logs").insert([{
        admin_user_id: user.id,
        carousel_id: savedCarousel.id,
        input_params: { topic, targetAudience, painPoint, desiredOutcome, proofPoints, ctaAction, format },
        final_output: result as any,
        generation_time_ms: generationTimeMs,
        image_count: result.slides.filter(s => s.imageUrl).length,
        model_used: "google/gemini-3-pro-image-preview"
      }]);

      if (logError) {
        console.error("Generation log failed:", logError);
      }

      await fetchCarouselHistory();
    } catch (error) {
      console.error("Auto-save error:", error);
      toast.error("Erro ao salvar carrossel");
    }
  };

  const loadCarousel = (carousel: any) => {
    if (!carousel.slides || !Array.isArray(carousel.slides)) {
      toast.error("Invalid carousel data");
      return;
    }

    setTopic(carousel.topic);
    setTargetAudiences(carousel.target_audience ? carousel.target_audience.split(", ").filter(Boolean) : []);
    setPainPoint(carousel.pain_point || "");
    setDesiredOutcome(carousel.desired_outcome || "");
    setProofPoints(carousel.proof_points || "");
    setCtaAction(carousel.cta_action || "");
    // Normalize slides to ensure they have imageUrl
    const normalizedSlides = carousel.slides.map((s: any, idx: number) => ({
      ...s,
      imageUrl: s.imageUrl || (carousel.image_urls?.[idx] || "")
    }));

    setCarouselResults([{
      id: carousel.id,
      topic: carousel.topic,
      targetAudience: carousel.target_audience,
      slides: normalizedSlides,
      caption: carousel.caption,
    }]);
    setCurrentCarouselIndex(0);
    setCurrentSlide(0);
    setCurrentCarouselId(carousel.id);
    setCurrentStep("design");
    setViewMode("editor");
    toast.success("Carrossel carregado");
  };

  // Plan Mode State
  const [plans, setPlans] = useState<CarouselResult[]>([]);
  const [viewMode, setViewMode] = useState<"input" | "plan_selection" | "editor">("input");

  const handleCreatePlan = async () => {
    if (!topic || !targetAudience) {
      toast.error("Please fill in Topic and Target Audience");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
        body: {
            topic,
            targetAudience,
            painPoint,
            desiredOutcome,
            proofPoints,
            ctaAction,
            format,
            numberOfCarousels: 3, // Force 3 options for planning
            mode: "plan"
        },
      });
      if (error) throw error;
      setPlans(data.carousels || []);
      setViewMode("plan_selection");
      toast.success("Strategy options generated! Choose one to produce.");
    } catch (error: any) {
        toast.error("Failed to generate plan");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleProduceFromPlan = async (selectedPlan: CarouselResult) => {
     setIsGenerating(true);
     try {
       // Use the plan's specific topic/angle
       const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
        body: {
            topic: selectedPlan.topic, // The specific angle from strategist
            targetAudience: selectedPlan.targetAudience,
            painPoint, // Keep original context
            desiredOutcome,
            proofPoints,
            ctaAction,
            format,
            numberOfCarousels: 1,
            mode: "generate"
        },
      });
      if (error) throw error;
      setCarouselResults(data.carousels || [data.carousel]);
      setViewMode("editor");
      setCurrentStep("design");
      toast.success("Carousel produced!");
     } catch (error) {
         toast.error("Production failed");
     } finally {
         setIsGenerating(false);
     }
  };

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Por favor, descreva sobre o que é o post");
      return;
    }

    setIsGenerating(true);
    setGenerationSteps([
      { id: "strategist", label: "Strategist", status: "pending", icon: "strategist" },
      { id: "analyst", label: "Analyst", status: "pending", icon: "analyst" },
      { id: "images", label: "Imagens", status: "pending", icon: "images" },
    ]);
    setCurrentPreview("");
    setStrategistOutput("");
    setAnalystOutput("");

    try {
      // Use streaming endpoint
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-linkedin-carousel`;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Faça login novamente para gerar conteúdo");
        navigate("/admin/login");
        return;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          topic,
          targetAudience,
          painPoint,
          desiredOutcome,
          referenceImage: referenceImage || undefined,
          selectedEquipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
          ctaAction,
          format,
          postType,
          numberOfCarousels,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start generation");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalCarousels: CarouselResult[] = [];
      const startTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          // Parse SSE event
          const eventMatch = chunk.match(/^event: (\w+)\ndata: (.+)$/s);
          if (!eventMatch) continue;

          const [, eventType, dataStr] = eventMatch;
          let data: any;
          try {
            data = JSON.parse(dataStr);
          } catch { continue; }

          switch (eventType) {
            case "step":
              setGenerationSteps((prev) =>
                prev.map((s) =>
                  s.id === data.step ? { ...s, status: data.status, content: data.message } : s
                )
              );
              break;

            case "preview":
              setCurrentPreview(data.content || "");
              break;

            case "agent_status":
              // Real-time agent status updates
              setAgentStatus({ 
                agent: data.agent, 
                status: data.status, 
                message: data.message 
              });
              break;

            case "strategist_result":
              // Store full strategist output
              if (data.fullOutput) {
                setStrategistOutput(data.fullOutput);
                setCurrentPreview("");
                setAgentStatus(undefined);
              } else if (data.preview) {
                setCurrentPreview(`Hook: ${data.preview}`);
              }
              break;

            case "analyst_result":
            case "copywriter_result":
              // Store full analyst/copywriter output
              if (data.fullOutput) {
                setAnalystOutput(data.fullOutput);
                setCurrentPreview("");
                setAgentStatus(undefined);
              }
              break;

            case "designer_result":
              // Store full designer output
              if (data.fullOutput) {
                setDesignerOutput(data.fullOutput);
                setAgentStatus(undefined);
              }
              break;

            case "image_progress":
              setGenerationSteps((prev) =>
                prev.map((s) =>
                  s.id === "images"
                    ? { ...s, content: `${data.completed || data.slideIndex + 1}/${data.total} imagens` }
                    : s
                )
              );
              break;

            case "complete":
              finalCarousels = data.carousels || [data];
              break;

            case "error":
              throw new Error(data.error);
          }
        }
      }

      const genTime = Date.now() - startTime;

      if (finalCarousels.length === 0) {
        throw new Error("No carousels generated");
      }

      setCarouselResults(finalCarousels);
      setCurrentCarouselIndex(0);
      setCurrentSlide(0);
      setCurrentStep("design");
      setViewMode("editor");
      setCurrentCarouselId(null);
      // Keep the outputs for history display, clear progress
      setGenerationSteps([]);
      setCurrentPreview("");

      // Auto-save all generated carousels as drafts
      for (const carousel of finalCarousels) {
        await autoSaveCarousel(carousel, genTime);
      }

      toast.success(`Gerado ${finalCarousels.length} carousel(s) - salvos como rascunho!`);
    } catch (error: any) {
      console.error("Error generating carousel:", error);
      toast.error(error.message || "Failed to generate carousel");
      setGenerationSteps([]);
      setCurrentPreview("");
      setStrategistOutput("");
      setAnalystOutput("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerateCampaign = async () => {
    const missingTopics = LINKEDIN_CAMPAIGN.carousels.filter(ct => 
      !carouselHistory.some(h => 
        h.topic.toLowerCase().includes(ct.name.toLowerCase()) || 
        ct.input.topic.toLowerCase().includes(h.topic.toLowerCase())
      )
    );

    if (missingTopics.length === 0) {
      toast.info("Todos os tópicos da campanha já foram gerados!");
      return;
    }

    if (!window.confirm(`Isso irá gerar ${missingTopics.length} carrosséis automáticos. Continuar?`)) {
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: missingTopics.length, currentTopic: "" });
    let successCount = 0;

    for (const [index, campaignTopic] of missingTopics.entries()) {
      setBatchProgress({ 
        current: index + 1, 
        total: missingTopics.length, 
        currentTopic: campaignTopic.name 
      });

      try {
        const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
          body: {
            ...campaignTopic.input,
            numberOfCarousels: 1, // Full automation: 1 high quality variation
            mode: "generate"
          },
        });

        if (error) throw error;
        
        const result = data.carousel || data.carousels?.[0];
        if (result) {
          // Force pending_approval status for campaign items
          await autoSaveCarousel(
            result,
            0,
            'pending_approval',
            campaignTopic.scheduledDate,
            campaignTopic.id,
            campaignTopic.id
          );
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to generate: ${campaignTopic.name}`, error);
        toast.error(`Erro ao gerar: ${campaignTopic.name}`);
      }

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsBatchGenerating(false);
    setBatchProgress(null);
    toast.success(`Batch concluído! ${successCount}/${missingTopics.length} carrosséis enviados para aprovação.`);
  };

  const handleUpdateSlideImage = (url: string) => {
    if (!carouselResults[currentCarouselIndex]) return;
    const newResults = [...carouselResults];
    const newSlides = [...newResults[currentCarouselIndex].slides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], imageUrl: url };
    newResults[currentCarouselIndex] = { ...newResults[currentCarouselIndex], slides: newSlides };
    setCarouselResults(newResults);
  };

  const readBlobAsDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(blob);
    });

  const resolveImageToDataUrl = async (src: string) => {
    if (!src) return "";
    if (src.startsWith("data:image/")) return src;

    // Fetch remote URL and convert to data URL so it can be embedded in PDF
    const resp = await fetch(src, { mode: "cors" });
    if (!resp.ok) throw new Error(`Failed to fetch image (${resp.status})`);
    const blob = await resp.blob();
    return readBlobAsDataUrl(blob);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Delay revoke to avoid Safari/Chrome race conditions
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportImages = async () => {
    const activeCarousel = carouselResults[currentCarouselIndex];
    if (!activeCarousel) return;

    setDesignLoading(true);
    const zip = new JSZip();

    try {
      // Prefer direct generated images (Nano Banana) instead of rendering/capturing DOM
      const slidesWithImages = activeCarousel.slides
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => Boolean(s.imageUrl));

      if (slidesWithImages.length === 0) {
        throw new Error("No images found on slides");
      }

      for (const { s, i } of slidesWithImages) {
        const src = s.imageUrl as string;

        if (src.startsWith("data:image/")) {
          const base64Data = src.split(",")[1];
          if (!base64Data) continue;
          zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
        } else {
          const resp = await fetch(src, { mode: "cors" });
          if (!resp.ok) throw new Error(`Failed to fetch slide ${i + 1} (${resp.status})`);
          const blob = await resp.blob();
          zip.file(`slide-${i + 1}.png`, blob);
        }
      }

      zip.file("caption.txt", activeCarousel.caption || "");

      const content = await zip.generateAsync({ type: "blob" });
      const safeTopic = (activeCarousel.topic || "carousel").replace(/\s+/g, "-").toLowerCase();
      downloadBlob(content, `carousel-${safeTopic}.zip`);
      toast.success(`${slidesWithImages.length} slides exportados com sucesso!`);
    } catch (error) {
      console.error("[Export] Error:", error);
      toast.error("Falha ao exportar imagens.");
    } finally {
      setDesignLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const activeCarousel = carouselResults[currentCarouselIndex];
    if (!activeCarousel) return;

    setDesignLoading(true);

    try {
      const { jsPDF } = await import(/* @vite-ignore */ "https://cdn.skypack.dev/jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1080, 1080],
      });

      const slides = activeCarousel.slides;
      const slidesWithImages = slides
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => Boolean(s.imageUrl));

      if (slidesWithImages.length === 0) {
        throw new Error("No images found on slides");
      }

      for (let idx = 0; idx < slidesWithImages.length; idx++) {
        const { s } = slidesWithImages[idx];
        const dataUrl = await resolveImageToDataUrl(s.imageUrl as string);
        if (!dataUrl) continue;

        if (idx > 0) pdf.addPage([1080, 1080]);
        pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1080);
      }

      const safeTopic = (activeCarousel.topic || "carousel").replace(/\s+/g, "-").toLowerCase();
      pdf.save(`carousel-${safeTopic}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("[PDF Export] Error:", error);
      toast.error("Falha ao exportar PDF.");
    } finally {
      setDesignLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    const activeCarousel = carouselResults[currentCarouselIndex];
    if (!activeCarousel) return;
    
    setDesignLoading(true);
    try {
        const slide = activeCarousel.slides[currentSlide];
        
        const { data, error } = await supabase.functions.invoke("generate-linkedin-carousel", {
            body: {
                mode: "image_only",
                headline: slide.headline,
                body: slide.body,
                imagePrompt: slide.imageUrl ? "Variation of existing visual" : "Professional medical visual"
            }
        });

        if (error) throw error;
        if (data.imageUrl) {
            handleUpdateSlideImage(data.imageUrl);
            toast.success("Image regenerated!");
        } else {
             throw new Error("No image returned");
        }

    } catch (error) {
        console.error("Regen error:", error);
        toast.error("Failed to regenerate image");
    } finally {
        setDesignLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from("linkedin_carousels")
        .update({ is_favorite: !currentFavorite })
        .eq("id", id);
      if (error) throw error;
      await fetchCarouselHistory();
      toast.success(currentFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const deleteCarousel = async () => {
    if (!carouselToDelete) return;
    try {
      const { error } = await supabase.from("linkedin_carousels").delete().eq("id", carouselToDelete);
      if (error) throw error;
      if (currentCarouselId === carouselToDelete) {
        setCarouselResults([]);
        setCurrentCarouselId(null);
        setCurrentStep("content");
      }
      await fetchCarouselHistory();
      toast.success("Carousel deleted");
    } catch (error) {
      toast.error("Failed to delete carousel");
    } finally {
      setCarouselToDelete(null);
    }
  };

  const assetsByCategory = availableAssets.reduce<Record<string, typeof availableAssets>>((acc, asset) => {
    const category = asset.category || "uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(asset);
    return acc;
  }, {});

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              {(viewMode === "editor" || viewMode === "plan_selection") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setViewMode("input");
                    setCarouselResults([]);
                    setPlans([]);
                    setCurrentCarouselId(null);
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {viewMode === "editor" ? "Editor de Carrossel" : 
                 viewMode === "plan_selection" ? "Selecionar Estratégia" : 
                 "Estúdio de Carrossel LinkedIn"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {viewMode === "editor" ? `Editando: ${carouselResults[currentCarouselIndex]?.topic || topic}` :
               viewMode === "plan_selection" ? "Escolha uma das opções abaixo" :
               "Geração estratégica de conteúdo B2B"}
            </p>
          </div>

          {/* Export Actions - only show when we have results */}
          {carouselResults.length > 0 && carouselResults[currentCarouselIndex]?.slides && viewMode === "editor" && (
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const activeCarousel = carouselResults[currentCarouselIndex];
                  if (activeCarousel) {
                    saveCarousel(activeCarousel);
                  }
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button 
                size="sm"
                onClick={handleExportPDF} 
                disabled={designLoading} 
                variant="secondary"
              >
                {designLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                PDF
              </Button>
              <Button 
                size="sm"
                onClick={handleExportImages} 
                disabled={designLoading}
              >
                {designLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                Imagens (ZIP)
              </Button>
            </div>
          )}
        </div>

        {/* Pro Tip - only show on input view */}
        {viewMode === "input" && carouselResults.length === 0 && (
          <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 text-sm">Dica Pro</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
              Crie slides educativos que abordem dores específicas. Use "Gerar Plano" para revisar opções estratégicas antes da produção final.
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Tabs (Stepper) */}
        {carouselResults.length === 0 && (
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mb-8">
              <TabsTrigger value="generate">Criar Novo</TabsTrigger>
              <TabsTrigger value="campaign">Visão de Campanha</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="campaign">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">{LINKEDIN_CAMPAIGN.metadata.campaign}</h2>
                    <p className="text-sm text-muted-foreground">Progresso da estratégia de conteúdo</p>
                  </div>
                  <Button 
                    onClick={handleBatchGenerateCampaign} 
                    disabled={isBatchGenerating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isBatchGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    Gerar Toda a Campanha
                  </Button>
                </div>

                {isBatchGenerating && batchProgress && (
                  <Card className="p-6 border-primary/50 bg-primary/5 shadow-lg animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Gerando Campanha Automática</p>
                          <h3 className="text-lg font-bold">Post {batchProgress.current} de {batchProgress.total}</h3>
                        </div>
                        <span className="text-sm font-medium">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Gerando: <span className="font-medium text-foreground">{batchProgress.currentTopic}</span>
                      </p>
                    </div>
                  </Card>
                )}

                <div className="grid gap-4">
                  {LINKEDIN_CAMPAIGN.carousels.map((campaignTopic) => {
                    const matchedPost = carouselHistory.find(h => 
                      h.topic.toLowerCase().includes(campaignTopic.name.toLowerCase()) ||
                      campaignTopic.input.topic.toLowerCase().includes(h.topic.toLowerCase())
                    );

                    const status = matchedPost?.status || "missing";
                    const scheduledDate = new Date(campaignTopic.scheduledDate);

                    return (
                      <Card key={campaignTopic.id} className="overflow-hidden border-l-4" style={{ 
                        borderLeftColor: status === 'published' ? '#10b981' : 
                                       status === 'approved' ? '#3b82f6' : 
                                       status === 'draft' ? '#f59e0b' : '#e2e8f0' 
                      }}>
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                {scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                              <h3 className="font-semibold text-lg">{campaignTopic.name}</h3>
                              {status === 'missing' ? (
                                <Badge variant="outline" className="text-muted-foreground border-dashed">Não Gerado</Badge>
                              ) : (
                                <Badge className={
                                  status === 'published' ? 'bg-green-100 text-green-800' :
                                  status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }>
                                  {status === 'published' ? 'Publicado' : 
                                   status === 'approved' ? 'Aprovado' : 'Rascunho'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 italic">
                              "{campaignTopic.input.topic}"
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {matchedPost ? (
                              <Button variant="outline" size="sm" onClick={() => loadCarousel(matchedPost)}>
                                <Layout className="w-4 h-4 mr-2" />
                                Abrir Editor
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                disabled={isGenerating}
                                onClick={async () => {
                                  // Set form fields from campaign topic
                                  const topicValue = campaignTopic.input.topic;
                                  const audienceValue = campaignTopic.input.targetAudience;
                                  const painValue = campaignTopic.input.painPoint;
                                  const ctaValue = campaignTopic.input.ctaAction || "";
                                  
                                  setTopic(topicValue);
                                  setTargetAudiences(audienceValue ? [audienceValue] : []);
                                  setPainPoint(painValue);
                                  setCtaAction(ctaValue);
                                  setIsGenerating(true);
                                  
                                  toast.info(`Gerando carrossel: ${campaignTopic.name}...`);
                                  
                                  try {
                                    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-linkedin-carousel`;
                                    const { data: { session } } = await supabase.auth.getSession();
                                    
                                    if (!session?.access_token) {
                                      toast.error("Faça login novamente");
                                      navigate("/admin/login");
                                      return;
                                    }
                                    
                                    const response = await fetch(url, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                                        Authorization: `Bearer ${session.access_token}`,
                                      },
                                      body: JSON.stringify({
                                        topic: topicValue,
                                        targetAudience: audienceValue,
                                        painPoint: painValue,
                                        ctaAction: ctaValue,
                                        format: "carousel",
                                        postType: "value",
                                        numberOfCarousels: 1,
                                        stream: false,
                                      }),
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error("Falha na geração");
                                    }
                                    
                                    const data = await response.json();
                                    const result = data.carousels?.[0] || data.carousel;
                                    
                                    if (result) {
                                      // Auto-save as draft with scheduled date
                                      await autoSaveCarousel(result, undefined, 'draft', campaignTopic.scheduledDate);
                                      
                                      // Load into editor
                                      setCarouselResults([result]);
                                      setCurrentCarouselIndex(0);
                                      setCurrentSlide(0);
                                      setViewMode("editor");
                                      setCurrentStep("design");
                                      toast.success(`Carrossel "${campaignTopic.name}" gerado com sucesso!`);
                                    }
                                  } catch (error: any) {
                                    console.error("Generation error:", error);
                                    toast.error("Erro ao gerar carrossel");
                                  } finally {
                                    setIsGenerating(false);
                                  }
                                }}
                              >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                Gerar Carrossel
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Briefing de Conteúdo</CardTitle>
                  <CardDescription>Descreva o que você quer criar. Campos opcionais ajudam a direcionar melhor o conteúdo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Main Content Field */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Label className="text-sm font-medium">Sobre o que é o post? *</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Descreva livremente: pode ser sobre a Lifetrek, um problema do mercado, uma tecnologia, um case, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea 
                      value={topic} 
                      onChange={e => setTopic(e.target.value)} 
                      placeholder="Ex: Nossas salas limpas ISO 7, como reduzir custos em implantes, 5 mitos sobre usinagem suíça..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Reference Image Upload */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Imagem de Referência (opcional)</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                          <ImageIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Arraste ou clique para adicionar uma imagem que a IA deve usar como referência</span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setProofPoints(ev.target?.result as string || "");
                              toast.success("Imagem de referência adicionada");
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </label>
                      {proofPoints && proofPoints.startsWith("data:image") && (
                        <div className="relative w-20 h-20">
                          <img src={proofPoints} alt="Referência" className="w-full h-full object-cover rounded-lg" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => setProofPoints("")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Target Audience - Multi-select */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Público Alvo (opcional, multi-select)</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Fabricantes ortopédicos",
                          "Fabricantes odontológicos",
                          "P&D de dispositivos médicos",
                          "Gestores de qualidade",
                          "Compradores hospitalares",
                          "Engenheiros de produção",
                          "Startups de medtech",
                          "Institucional Lifetrek"
                        ].map((audience) => (
                          <Badge 
                            key={audience}
                            variant={targetAudiences.includes(audience) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => {
                              if (targetAudiences.includes(audience)) {
                                setTargetAudiences(targetAudiences.filter(a => a !== audience));
                              } else {
                                setTargetAudiences([...targetAudiences, audience]);
                              }
                            }}
                          >
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Format */}
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Formato</Label>
                      <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carousel">Carrossel (IA decide nº de slides)</SelectItem>
                          <SelectItem value="single-image">Post Único (1 imagem)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Equipment Selection */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Equipamentos/Produtos (opcional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Selecione equipamentos ou produtos para a IA incluir nas imagens</p>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg">
                      {products.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Carregando...</span>
                      ) : (
                        products.map((p) => (
                          <Badge 
                            key={p.name}
                            variant={selectedEquipment.includes(p.name) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                            onClick={() => {
                              if (selectedEquipment.includes(p.name)) {
                                setSelectedEquipment(selectedEquipment.filter(e => e !== p.name));
                              } else {
                                setSelectedEquipment([...selectedEquipment, p.name]);
                              }
                            }}
                          >
                            {p.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pain Points - Optional Multi-select */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Dores do Mercado (opcional)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        "Recalls e problemas de qualidade",
                        "Custos altos de produção",
                        "Lead times longos",
                        "Dificuldade em escalar",
                        "Compliance regulatório",
                        "Falta de fornecedores qualificados",
                        "Tolerâncias apertadas",
                        "Acabamento superficial crítico"
                      ].map((pain) => (
                        <Badge 
                          key={pain}
                          variant={painPoint.includes(pain) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            if (painPoint.includes(pain)) {
                              setPainPoint(painPoint.replace(pain, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim());
                            } else {
                              setPainPoint(painPoint ? `${painPoint}, ${pain}` : pain);
                            }
                          }}
                        >
                          {pain}
                        </Badge>
                      ))}
                    </div>
                    <Input 
                      value={painPoint.split(",").filter(p => ![
                        "Recalls e problemas de qualidade",
                        "Custos altos de produção",
                        "Lead times longos",
                        "Dificuldade em escalar",
                        "Compliance regulatório",
                        "Falta de fornecedores qualificados",
                        "Tolerâncias apertadas",
                        "Acabamento superficial crítico"
                      ].includes(p.trim())).join(", ").trim()}
                      onChange={e => {
                        const selectedPains = painPoint.split(",").filter(p => [
                          "Recalls e problemas de qualidade",
                          "Custos altos de produção",
                          "Lead times longos",
                          "Dificuldade em escalar",
                          "Compliance regulatório",
                          "Falta de fornecedores qualificados",
                          "Tolerâncias apertadas",
                          "Acabamento superficial crítico"
                        ].includes(p.trim())).join(", ");
                        const customPain = e.target.value;
                        setPainPoint(selectedPains && customPain ? `${selectedPains}, ${customPain}` : selectedPains || customPain);
                      }}
                      placeholder="Ou digite outra dor específica..."
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Post Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setPostType("value")}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        postType === "value" 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${postType === "value" ? "bg-primary" : "bg-muted"}`} />
                        <span className="font-semibold text-sm">Post de Valor</span>
                        <Badge variant="secondary" className="text-[10px]">80%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Educacional, insight, behind-the-scenes. CTA leve.
                      </p>
                    </div>
                    <div
                      onClick={() => setPostType("commercial")}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        postType === "commercial" 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${postType === "commercial" ? "bg-primary" : "bg-muted"}`} />
                        <span className="font-semibold text-sm">Post Comercial</span>
                        <Badge variant="outline" className="text-[10px]">20%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ofertas diretas, capacidade, pilotos.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !topic} 
                      size="lg" 
                      className="w-full h-auto py-4 flex flex-col gap-1 items-center"
                    >
                      {isGenerating ? <Loader2 className="animate-spin mb-1" /> : <Wand2 className="mb-1 h-5 w-5" />}
                      <span className="font-semibold">Gerar Carrossel</span>
                      <span className="text-xs font-normal opacity-70">A IA vai criar o conteúdo completo</span>
                    </Button>
                  </div>

                  {/* Generation Progress */}
                  {isGenerating && generationSteps.length > 0 && (
                    <div className="mt-4">
                      <GenerationProgress 
                        steps={generationSteps} 
                        currentOutput={currentPreview}
                        strategistFullOutput={strategistOutput}
                        analystFullOutput={analystOutput}
                        designerFullOutput={designerOutput}
                        agentStatus={agentStatus}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carouselHistory.map(h => (
                  <Card key={h.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => loadCarousel(h)}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base truncate">{h.topic}</CardTitle>
                      <CardDescription className="text-xs">{new Date(h.created_at).toLocaleDateString('pt-BR')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex justify-between">
                      <Badge variant="secondary">{h.format}</Badge>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCarouselToDelete(h.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* WORKSPACE AREA */}
        {isGenerating ? (
           <div className="grid lg:grid-cols-[300px_1fr_300px] gap-8 h-[calc(100vh-200px)]">
             <Card className="h-full">
               <CardHeader><Skeleton className="h-4 w-[150px]" /></CardHeader>
               <CardContent className="space-y-4">
                 {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full" />)}
               </CardContent>
             </Card>
             <div className="h-full flex items-center justify-center bg-accent/20 rounded-xl p-8">
               <div className="space-y-4 w-full max-w-[600px]">
                 <Skeleton className="aspect-square w-full rounded-sm" />
                 <div className="flex justify-between">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <Skeleton className="h-4 w-[200px]" />
                   <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
               </div>
             </div>
             <Card className="h-full">
               <CardHeader><Skeleton className="h-4 w-[150px]" /></CardHeader>
               <CardContent className="grid grid-cols-2 gap-2">
                 {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square w-full" />)}
               </CardContent>
             </Card>
           </div>
        ) : viewMode === "plan_selection" && plans.length > 0 ? (
           <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between mb-8">
                   <div>
                     <h2 className="text-3xl font-bold">Selecionar Estratégia</h2>
                     <p className="text-muted-foreground">O Agente Estrategista propôs 3 ângulos distintos.</p>
                   </div>
                  <Button variant="ghost" onClick={() => setViewMode("input")}>Cancelar</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {plans.map((plan, idx) => (
                    <Card key={idx} className="hover:border-primary cursor-pointer transition-all hover:shadow-lg flex flex-col">
                       <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex justify-between items-start mb-2">
                             <Badge variant="outline" className="bg-background">Opção {idx + 1}</Badge>
                              {idx === 0 && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Recomendado</Badge>}
                          </div>
                          <CardTitle className="text-xl leading-tight">{plan.topic}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-2">{plan.targetAudience}</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-6 flex-1 pt-6">
                           <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
                              <span className="text-xs font-bold uppercase text-muted-foreground block mb-1">O Gancho</span>
                              <p className="font-medium text-sm leading-relaxed">"{plan.slides?.[0]?.headline || 'Sem título'}"</p>
                           </div>
                           
                           <div className="space-y-2">
                              <span className="text-xs font-bold uppercase text-muted-foreground">Estrutura</span>
                             <div className="space-y-2">
                                {plan.slides.slice(0, 3).map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <span className="truncate opacity-80">{s.headline}</span>
                                    </div>
                                ))}
                                {plan.slides.length > 3 && <div className="text-xs text-muted-foreground pl-3.5 italic">...e mais {plan.slides.length - 3}</div>}
                             </div>
                          </div>
                       </CardContent>
                       <div className="p-6 pt-0 mt-auto">
                        <Button className="w-full gap-2" onClick={() => handleProduceFromPlan(plan)}>
                             <Wand2 className="h-4 w-4" />
                             Selecionar & Produzir Ativos
                          </Button>
                       </div>
                    </Card>
                 ))}
              </div>
           </div>
        ) : carouselResults.length > 0 && carouselResults[currentCarouselIndex]?.slides && (
          <div className="grid lg:grid-cols-[280px_1fr_320px] gap-6 h-[calc(100vh-200px)]">

            {/* LEFT PANEL: Slides List */}
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-sm">Conteúdo dos Slides</CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Batch Selector & Theme Control */}
                {carouselResults.length > 0 && (
                  <div className="mb-6 space-y-4">
                     <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Variações</Label>
                        <Select value={currentTheme} onValueChange={(v: any) => setCurrentTheme(v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Tema" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="corporate">Corporativo</SelectItem>
                                <SelectItem value="modern">Moderno</SelectItem>
                                <SelectItem value="bold">Ousado</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>

                     {carouselResults.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {carouselResults.map((result, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => { setCurrentCarouselIndex(idx); setCurrentSlide(0); }}
                                    className={`relative flex-shrink-0 w-24 aspect-[4/5] rounded-md overflow-hidden cursor-pointer border-2 transition-all group ${currentCarouselIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                                >
                                     <div className="absolute inset-0 pointer-events-none transform scale-[0.25] origin-top-left w-[400%] h-[400%]">
                                         {result.slides?.length > 0 && (
                                           <SlideCanvas 
                                              mode="preview" 
                                              slide={result.slides[0]} 
                                              aspectRatio="portrait"
                                              theme={currentTheme}
                                              layout={result.slides[0]?.layout}
                                           />
                                         )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    {currentCarouselIndex === idx && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">
                                            ✓
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                     )}
                  </div>
                )}

                {carouselResults[currentCarouselIndex]?.slides?.map((slide, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${currentSlide === idx ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs w-6 h-6 flex items-center justify-center p-0 rounded-full">{idx + 1}</Badge>
                      <span className="text-xs font-semibold uppercase">{slide.type}</span>
                    </div>
                    <p className="text-xs font-medium line-clamp-2 text-foreground/80">{slide.headline}</p>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-bold mb-2">Legenda</h4>
                  <p className="text-xs text-muted-foreground line-clamp-6">{carouselResults[currentCarouselIndex]?.caption}</p>
                </div>
              </div>
            </Card>

            {/* CENTER PANEL: Canvas */}
            <div className="h-full flex flex-col items-center justify-center bg-accent/20 rounded-xl p-8 relative">
              <div className="w-full max-w-[600px] shadow-2xl rounded-sm overflow-hidden ring-1 ring-slate-900/5">
                {carouselResults[currentCarouselIndex]?.slides?.[currentSlide] && (
                  <SlideCanvas
                    mode="preview"
                    slide={carouselResults[currentCarouselIndex].slides[currentSlide]}
                    aspectRatio="square"
                    theme={currentTheme}
                    layout={carouselResults[currentCarouselIndex].slides[currentSlide].layout}
                  />
                )}
              </div>

              {/* Hidden Export Area - positioned offscreen with real dimensions for capture */}
              <div 
                className="fixed pointer-events-none"
                style={{ 
                  left: '-9999px', 
                  top: 0,
                  width: '1080px',
                  zIndex: -1,
                }}
                aria-hidden="true"
              >
                {carouselResults[currentCarouselIndex]?.slides?.map((s, idx) => (
                  <div 
                    id={`export-slide-${idx}`} 
                    key={idx}
                    style={{ 
                      width: '1080px', 
                      height: '1080px',
                      marginBottom: '10px',
                    }}
                  >
                    <SlideCanvas mode="export" slide={s} aspectRatio="square" theme={currentTheme} layout={s.layout} />
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4 mt-8">
                <Button variant="outline" size="icon" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">Slide {currentSlide + 1} de {carouselResults[currentCarouselIndex]?.slides?.length || 0}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentSlide(Math.min((carouselResults[currentCarouselIndex]?.slides?.length || 1) - 1, currentSlide + 1))} disabled={currentSlide === (carouselResults[currentCarouselIndex]?.slides?.length || 1) - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* RIGHT PANEL: Copy + Design Tools */}
            <div className="h-full flex flex-col gap-4 overflow-hidden">
              {/* Copy Panel */}
              <div className="flex-1 min-h-0">
                <SlideCopyPanel 
                  slides={carouselResults[currentCarouselIndex]?.slides || []} 
                  caption={carouselResults[currentCarouselIndex]?.caption || ""}
                  currentSlide={currentSlide}
                />
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!carouselToDelete} onOpenChange={() => setCarouselToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Projeto?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteCarousel}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
