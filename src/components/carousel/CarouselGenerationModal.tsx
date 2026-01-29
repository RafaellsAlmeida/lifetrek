// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2, Loader2, Zap, Brain, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StorageImageSelector } from '../admin/StorageImageSelector';
import { dispatchRepurposeJob, getJobStatus } from '@/lib/agents';
import { Badge } from '@/components/ui/badge';

interface CarouselGenerationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerated: (result?: any) => void;
}

// V1 Template options
const V1_TEMPLATES = [
    { value: 'quem-somos', label: 'Quem Somos', description: 'Company introduction' },
    { value: 'capacidades', label: 'Capacidades', description: 'Manufacturing capabilities' },
    { value: 'custom', label: 'Custom', description: 'Custom slides' },
];

export function CarouselGenerationModal({ open, onOpenChange, onGenerated }: CarouselGenerationModalProps) {
    const [mode, setMode] = useState<'auto' | 'guided'>('auto');
    const [generationVersion, setGenerationVersion] = useState<'v1' | 'v2'>('v2');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    // V1 Template state
    const [selectedTemplate, setSelectedTemplate] = useState('quem-somos');

    // Full Auto mode state
    const [autoRequest, setAutoRequest] = useState('');
    const [format, setFormat] = useState<'single-image' | 'carousel'>('carousel');
    const [postType, setPostType] = useState<'value' | 'commercial'>('value');

    // Guided mode state
    const [backgroundSource, setBackgroundSource] = useState<'ai-browse' | 'manual-select' | 'generate'>('ai-browse');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [headline, setHeadline] = useState('');
    const [subhead, setSubhead] = useState('');
    const [textPosition, setTextPosition] = useState<'auto' | 'top' | 'bottom'>('auto');
    const [imagePrompt, setImagePrompt] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);

    const handleGenerate = async () => {
        // V1 Template validation
        if (generationVersion === 'v1' && !selectedTemplate) {
            toast({
                title: "Missing template",
                description: "Please select a template",
                variant: "destructive"
            });
            return;
        }

        // V2 Auto mode validation
        if (generationVersion === 'v2' && mode === 'auto' && !autoRequest) {
            toast({
                title: "Missing request",
                description: "Please describe what you want to create",
                variant: "destructive"
            });
            return;
        }

        // V2 Guided mode validation
        if (generationVersion === 'v2' && mode === 'guided') {
            if (!headline || !subhead) {
                toast({
                    title: "Missing content",
                    description: "Please provide headline and subhead",
                    variant: "destructive"
                });
                return;
            }

            if (backgroundSource === 'generate' && !imagePrompt) {
                toast({
                    title: "Missing image prompt",
                    description: "Please describe the image to generate",
                    variant: "destructive"
                });
                return;
            }

            if (backgroundSource === 'manual-select' && !selectedImage) {
                toast({
                    title: "No image selected",
                    description: "Please select an image from storage",
                    variant: "destructive"
                });
                return;
            }
        }

        setIsGenerating(true);

        try {
            // V1 Template-based generation
            if (generationVersion === 'v1') {
                toast({
                    title: "V1 Classic Generation",
                    description: `Using template: ${selectedTemplate}`,
                });

                const { data, error } = await supabase.functions.invoke('v1-generate-carousel', {
                    body: {
                        template: selectedTemplate,
                        profileType: 'company'
                    }
                });

                if (error) throw error;

                onGenerated(data);
                onOpenChange(false);
                setIsGenerating(false);
                resetForm();
                toast({ title: "Carousel Created!", description: "V1 template carousel generated." });
                return;
            }

            // V2 AI-powered generation
            if (mode === 'auto') {
                // Full Auto: Dispatch to Repurpose Content Agent (Edge Function)
                // 1. Dispatch Job
                const jobId = await dispatchRepurposeJob({
                    content: autoRequest,
                    url: autoRequest.startsWith('http') ? autoRequest : undefined,
                    format: format,
                    postType: postType
                });

                toast({
                    title: "Agent Activated",
                    description: "Repurposing content and generating carousel...",
                });

                // 2. Poll for completion
                const checkJob = async () => {
                    const job = await getJobStatus(jobId);

                    if (job.status === 'completed') {
                        // Success!
                        // The result contains the carousel JSON. We need to parse/handle it.
                        // For now, let's just notify and close.
                        // In Next Step: Populate Editor with `job.result.carousel`
                        console.log("Job Result:", job.result);

                        onGenerated(job.result);
                        onOpenChange(false);
                        setIsGenerating(false);
                        resetForm();
                        toast({ title: "Carousel Created!", description: "High-quality carousel generated." });

                    } else if (job.status === 'failed') {
                        setIsGenerating(false);
                        toast({ title: "Generation Failed", description: job.error, variant: "destructive" });

                    } else {
                        setTimeout(checkJob, 2000); // Poll every 2s
                    }
                };

                checkJob();
                return;
            }
            // Guided Mode: Call existing compositing function
            let imageUrl = selectedImage;

            if (backgroundSource === 'ai-browse') {
                // AI will browse storage and pick best image
                const { data: browseData, error: browseError } = await supabase.functions.invoke('browse-storage', {
                    body: { prompt: `${headline} - ${subhead}` }
                });

                if (browseError) {
                    toast({
                        title: "AI Browse failed",
                        description: browseError.message,
                        variant: "destructive"
                    });
                    setIsGenerating(false);
                    return;
                }

                // Use the AI-selected image path
                const selectedImagePath = browseData.selectedImage.path;

                toast({
                    title: "AI selected image",
                    description: `Using: ${browseData.selectedImage.description} (${browseData.selectedImage.confidence}% confident)`,
                });

                // For now, we need the actual image data
                // In production, this would load from Supabase Storage
                imageUrl = selectedImagePath; // TODO: Load actual image data
            }

            if (backgroundSource === 'generate') {
                // Generate new image via Vertex AI
                const { data, error } = await supabase.functions.invoke('composite-carousel-image', {
                    body: {
                        imageSource: 'ai-generated',
                        aiPrompt: imagePrompt,
                        text: { headline, subhead, position: textPosition }
                    }
                });

                if (error) throw error;
                imageUrl = data.baseImage;
            }

            // Save to database
            const { data: userData } = await supabase.auth.getUser();

            await supabase.from('linkedin_carousels').insert({
                admin_user_id: userData.user?.id,
                topic: headline,
                format: 'single-image',
                slides: [{ type: 'content', headline, body: subhead }],
                image_urls: [imageUrl],
                caption: `${headline}\n\n${subhead}`,
                generation_method: backgroundSource,
                generation_settings: {
                    mode: 'guided',
                    backgroundSource,
                    textPosition,
                    imagePrompt: backgroundSource === 'generate' ? imagePrompt : null
                }
            });

            toast({
                title: "Success!",
                description: "Carousel generated successfully"
            });

            onGenerated();
            onOpenChange(false);
            resetForm();

        } catch (error) {
            console.error('Generation error:', error);
            toast({
                title: "Generation failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setAutoRequest('');
        setHeadline('');
        setSubhead('');
        setTextPosition('auto');
        setImagePrompt('');
        setSelectedImage(null);
        setBackgroundSource('ai-browse');
        setSelectedTemplate('quem-somos');
        setFormat('carousel');
        setPostType('value');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Carousel</DialogTitle>
                    <DialogDescription>
                        Choose between V1 Classic (template-based) or V2 AI-Powered generation
                    </DialogDescription>
                </DialogHeader>

                {/* Version Selector */}
                <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Generation Engine</Label>
                    <RadioGroup
                        value={generationVersion}
                        onValueChange={(v) => setGenerationVersion(v as 'v1' | 'v2')}
                        className="grid grid-cols-2 gap-3"
                    >
                        <div className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${generationVersion === 'v1' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                            <RadioGroupItem value="v1" id="v1" className="mt-1" />
                            <Label htmlFor="v1" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4 text-blue-500" />
                                    <span className="font-semibold">V1 Classic</span>
                                    <Badge variant="secondary" className="text-xs">Fast</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Template-based with real company photos. Predictable, fast results.
                                </p>
                            </Label>
                        </div>
                        <div className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${generationVersion === 'v2' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}>
                            <RadioGroupItem value="v2" id="v2" className="mt-1" />
                            <Label htmlFor="v2" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-500" />
                                    <span className="font-semibold">V2 AI-Powered</span>
                                    <Badge variant="default" className="text-xs bg-purple-500">Smart</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Multi-agent AI pipeline. Creative, dynamic content generation.
                                </p>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* V1 Template Selection */}
                {generationVersion === 'v1' && (
                    <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                            <LayoutTemplate className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">V1 Classic - Template Selection</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Choose a pre-designed template with optimized layouts and real company photos.
                        </p>
                        <div>
                            <Label>Select Template</Label>
                            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {V1_TEMPLATES.map(template => (
                                        <SelectItem key={template.value} value={template.value}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{template.label}</span>
                                                <span className="text-xs text-muted-foreground">{template.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-3 rounded border text-sm">
                            <p className="font-medium mb-1">Template Preview:</p>
                            {selectedTemplate === 'quem-somos' && (
                                <p className="text-muted-foreground">5 slides: Company intro, Mission, Stats, Vision, CTA</p>
                            )}
                            {selectedTemplate === 'capacidades' && (
                                <p className="text-muted-foreground">5 slides: Capabilities, CNC, Cleanroom, Quality, CTA</p>
                            )}
                            {selectedTemplate === 'custom' && (
                                <p className="text-muted-foreground">Custom slides - define your own content</p>
                            )}
                        </div>
                    </div>
                )}

                {/* V2 AI-Powered Options */}
                {generationVersion === 'v2' && (
                    <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'guided')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="auto" className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Full Auto
                            </TabsTrigger>
                            <TabsTrigger value="guided" className="flex items-center gap-2">
                                <Wand2 className="w-4 h-4" />
                                Guided Creation
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="auto" className="space-y-4 mt-4">
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium">🤖 AI Autopilot Mode</p>
                                <p className="text-xs text-muted-foreground">
                                    Describe what you want, and AI will:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                                    <li>✓ Browse your image library or generate new backgrounds</li>
                                    <li>✓ Write compelling headlines and copy</li>
                                    <li>✓ Position text optimally</li>
                                    <li>✓ Apply brand styling</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Format</Label>
                                    <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="carousel">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Carousel (5 slides)</span>
                                                    <span className="text-xs text-muted-foreground">Hook → Value → CTA</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="single-image">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Single Image</span>
                                                    <span className="text-xs text-muted-foreground">1 hero image + long caption</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Post Type</Label>
                                    <Select value={postType} onValueChange={(v: any) => setPostType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="value">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Value / Educational</span>
                                                    <span className="text-xs text-muted-foreground">80% content mix</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="commercial">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Commercial Offer</span>
                                                    <span className="text-xs text-muted-foreground">20% content mix</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Your Request</Label>
                                <Textarea
                                    placeholder="Example: Create a carousel about our new 5000m² cleanroom facility, emphasizing our ISO certification and advanced manufacturing capabilities"
                                    value={autoRequest}
                                    onChange={(e) => setAutoRequest(e.target.value)}
                                    rows={5}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {format === 'single-image'
                                        ? 'For single-image posts, describe the main theme. AI will create 1 strong visual + comprehensive caption.'
                                        : 'Be as detailed or high-level as you want. The AI will handle the rest.'}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="guided" className="space-y-4 mt-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm font-medium">🎨 You're in control</p>
                                <p className="text-xs text-muted-foreground">
                                    Direct the AI with specific choices for images, text, and layout.
                                </p>
                            </div>

                            <div>
                                <Label>Background Source</Label>
                                <RadioGroup value={backgroundSource} onValueChange={(v: any) => setBackgroundSource(v)}>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                                        <RadioGroupItem value="ai-browse" id="ai-browse" />
                                        <Label htmlFor="ai-browse" className="flex-1 cursor-pointer">
                                            <span className="font-medium">AI Browse Storage</span>
                                            <p className="text-xs text-muted-foreground">AI picks best match from your assets</p>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                                        <RadioGroupItem value="manual-select" id="manual-select" />
                                        <Label htmlFor="manual-select" className="flex-1 cursor-pointer" onClick={() => setSelectorOpen(true)}>
                                            <span className="font-medium">I'll Select from Storage</span>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedImage ? "Image selected" : "Click to browse assets"}
                                            </p>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-3">
                                        <RadioGroupItem value="generate" id="generate" />
                                        <Label htmlFor="generate" className="flex-1 cursor-pointer">
                                            <span className="font-medium">Generate New</span>
                                            <p className="text-xs text-muted-foreground">AI creates a custom background</p>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {backgroundSource === 'generate' && (
                                <div>
                                    <Label>Image Description</Label>
                                    <Textarea
                                        placeholder="Modern medical cleanroom with precision equipment..."
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Headline</Label>
                                    <Input
                                        placeholder="INOVAÇÃO MÉDICA"
                                        value={headline}
                                        onChange={(e) => setHeadline(e.target.value)}
                                        maxLength={40}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {headline.length}/40
                                    </p>
                                </div>

                                <div>
                                    <Label>Text Position</Label>
                                    <Select value={textPosition} onValueChange={(v: any) => setTextPosition(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">Auto (AI decides)</SelectItem>
                                            <SelectItem value="top">Top</SelectItem>
                                            <SelectItem value="bottom">Bottom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label>Subheadline</Label>
                                <Textarea
                                    placeholder="Tecnologia de ponta para a saúde do futuro"
                                    value={subhead}
                                    onChange={(e) => setSubhead(e.target.value)}
                                    rows={2}
                                    maxLength={100}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {subhead.length}/100
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {generationVersion === 'v1' ? (
                            <>
                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                Generate V1 Classic
                            </>
                        ) : mode === 'auto' ? (
                            <>
                                <Brain className="w-4 h-4 mr-2" />
                                Generate with AI
                            </>
                        ) : (
                            'Generate'
                        )}
                    </Button>
                </div>
            </DialogContent>

            <StorageImageSelector
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                onSelect={(url) => {
                    setSelectedImage(url);
                    setBackgroundSource('manual-select');
                }}
            />
        </Dialog>
    );
}
