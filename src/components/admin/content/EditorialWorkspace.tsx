import { ReactNode, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
    Bold,
    Code,
    Eye,
    FileText,
    Heading2,
    Image,
    Italic,
    Link,
    List,
    ListOrdered,
    PanelRight,
    Quote,
    Save,
    Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type EditorMode = "html" | "markdown";

interface EditorialWorkspaceProps {
    mode: EditorMode;
    title: string;
    subtitle: string;
    statusLabel: string;
    statusTone?: "draft" | "review" | "published" | "default";
    documentTitle: string;
    documentSubtitle?: string;
    content: string;
    onContentChange: (value: string) => void;
    metadata: ReactNode;
    onCancel: () => void;
    onSave: () => void;
    onPublish?: () => void;
    isSaving?: boolean;
    publishDisabled?: boolean;
}

const badgeClassByTone: Record<NonNullable<EditorialWorkspaceProps["statusTone"]>, string> = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    review: "bg-amber-50 text-amber-700 border-amber-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    default: "bg-blue-50 text-blue-700 border-blue-200",
};

const htmlToolbar = [
    { icon: Bold, label: "Negrito", command: "bold" },
    { icon: Italic, label: "Italico", command: "italic" },
    { icon: Heading2, label: "Titulo H2", command: "formatBlock", value: "h2" },
    { icon: Quote, label: "Citação", command: "formatBlock", value: "blockquote" },
    { icon: List, label: "Lista", command: "insertUnorderedList" },
    { icon: ListOrdered, label: "Lista numerada", command: "insertOrderedList" },
];

const markdownToolbar = [
    { icon: Bold, label: "Negrito", before: "**", after: "**", fallback: "texto" },
    { icon: Italic, label: "Italico", before: "_", after: "_", fallback: "texto" },
    { icon: Heading2, label: "Titulo H2", before: "## ", after: "", fallback: "Titulo" },
    { icon: Quote, label: "Citação", before: "> ", after: "", fallback: "Citação" },
    { icon: List, label: "Lista", before: "- ", after: "", fallback: "item" },
    { icon: Code, label: "Codigo", before: "`", after: "`", fallback: "codigo" },
];

function readingStats(content: string, mode: EditorMode) {
    const plain = mode === "html"
        ? content.replace(/<[^>]*>/g, " ")
        : content
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
            .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
            .replace(/^#{1,6}\s*/gm, "");
    const words = plain.trim().split(/\s+/).filter(Boolean).length;
    return {
        words,
        minutes: Math.max(1, Math.ceil(words / 200)),
    };
}

export function EditorialWorkspace({
    mode,
    title,
    subtitle,
    statusLabel,
    statusTone = "default",
    documentTitle,
    documentSubtitle,
    content,
    onContentChange,
    metadata,
    onCancel,
    onSave,
    onPublish,
    isSaving,
    publishDisabled,
}: EditorialWorkspaceProps) {
    const editableRef = useRef<HTMLDivElement | null>(null);
    const markdownRef = useRef<HTMLTextAreaElement | null>(null);
    const stats = useMemo(() => readingStats(content, mode), [content, mode]);

    const runHtmlCommand = (command: string, value?: string) => {
        editableRef.current?.focus();
        document.execCommand(command, false, value);
        onContentChange(editableRef.current?.innerHTML || "");
    };

    const insertMarkdown = (before: string, after: string, fallback: string) => {
        const textarea = markdownRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.slice(start, end) || fallback;
        const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
        onContentChange(next);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
        });
    };

    return (
        <TooltipProvider>
            <div className="flex h-[calc(100vh-6rem)] min-h-[720px] flex-col overflow-hidden rounded-lg border bg-slate-50">
                <div className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <h2 className="truncate text-lg font-semibold text-slate-950">{title}</h2>
                            <Badge variant="outline" className={badgeClassByTone[statusTone]}>{statusLabel}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                            Cancelar
                        </Button>
                        {onPublish ? (
                            <Button variant="outline" onClick={onPublish} disabled={isSaving || publishDisabled}>
                                <Send className="mr-2 h-4 w-4" />
                                Publicar
                            </Button>
                        ) : null}
                        <Button onClick={onSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                        </Button>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_360px]">
                    <main className="min-w-0 border-r bg-slate-100">
                        <Tabs defaultValue="edit" className="flex h-full flex-col">
                            <div className="flex shrink-0 items-center justify-between border-b bg-white px-5 py-2">
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Documento</TooltipContent>
                                    </Tooltip>
                                    <div className="text-xs text-slate-500">
                                        {stats.words} palavras · {stats.minutes} min
                                    </div>
                                </div>
                                <TabsList className="h-9">
                                    <TabsTrigger value="edit" className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Editar
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        Preview
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="edit" className="m-0 min-h-0 flex-1">
                                <div className="flex h-full flex-col">
                                    <div className="flex shrink-0 items-center gap-1 border-b bg-white px-5 py-2">
                                        {mode === "html" ? (
                                            <>
                                                {htmlToolbar.map((item) => (
                                                    <Tooltip key={item.label}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => runHtmlCommand(item.command, item.value)}
                                                            >
                                                                <item.icon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{item.label}</TooltipContent>
                                                    </Tooltip>
                                                ))}
                                                <Separator orientation="vertical" className="mx-2 h-6" />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                const url = window.prompt("URL do link");
                                                                if (url) runHtmlCommand("createLink", url);
                                                            }}
                                                        >
                                                            <Link className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Inserir link</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                const url = window.prompt("URL da imagem");
                                                                if (url) runHtmlCommand("insertImage", url);
                                                            }}
                                                        >
                                                            <Image className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Inserir imagem</TooltipContent>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <>
                                                {markdownToolbar.map((item) => (
                                                    <Tooltip key={item.label}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => insertMarkdown(item.before, item.after, item.fallback)}
                                                            >
                                                                <item.icon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{item.label}</TooltipContent>
                                                    </Tooltip>
                                                ))}
                                                <Separator orientation="vertical" className="mx-2 h-6" />
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => insertMarkdown("[", "](https://)", "texto do link")}
                                                        >
                                                            <Link className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Inserir link</TooltipContent>
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>

                                    <ScrollArea className="min-h-0 flex-1">
                                        <div className="mx-auto max-w-4xl px-8 py-10">
                                            <div className="rounded-md border bg-white px-10 py-10 shadow-sm">
                                                <div className="mb-8 border-b pb-6">
                                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Lifetrek Editorial</p>
                                                    <h1 className="text-4xl font-bold leading-tight text-slate-950">{documentTitle || "Sem titulo"}</h1>
                                                    {documentSubtitle ? (
                                                        <p className="mt-4 text-lg leading-8 text-slate-600">{documentSubtitle}</p>
                                                    ) : null}
                                                </div>
                                                {mode === "html" ? (
                                                    <div
                                                        ref={editableRef}
                                                        className="prose prose-slate min-h-[520px] max-w-none focus:outline-none prose-h2:text-2xl prose-p:leading-8 prose-li:leading-8"
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        dangerouslySetInnerHTML={{ __html: content }}
                                                        onInput={(event) => onContentChange(event.currentTarget.innerHTML)}
                                                    />
                                                ) : (
                                                    <Textarea
                                                        ref={markdownRef}
                                                        value={content}
                                                        onChange={(event) => onContentChange(event.target.value)}
                                                        className="min-h-[560px] resize-none border-0 bg-transparent p-0 font-mono text-base leading-7 shadow-none focus-visible:ring-0"
                                                        placeholder="Escreva o recurso em Markdown..."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>
                            </TabsContent>

                            <TabsContent value="preview" className="m-0 min-h-0 flex-1">
                                <ScrollArea className="h-full">
                                    <div className="mx-auto max-w-4xl px-8 py-10">
                                        <article className="rounded-md border bg-white px-10 py-10 shadow-sm">
                                            <div className="mb-8 border-b pb-6">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Preview publico</p>
                                                <h1 className="text-4xl font-bold leading-tight text-slate-950">{documentTitle || "Sem titulo"}</h1>
                                                {documentSubtitle ? (
                                                    <p className="mt-4 text-lg leading-8 text-slate-600">{documentSubtitle}</p>
                                                ) : null}
                                            </div>
                                            {mode === "html" ? (
                                                <div
                                                    className="prose prose-slate max-w-none prose-h2:text-2xl prose-p:leading-8 prose-li:leading-8"
                                                    dangerouslySetInnerHTML={{ __html: content }}
                                                />
                                            ) : (
                                                <div className="prose prose-slate max-w-none prose-h2:text-2xl prose-p:leading-8 prose-li:leading-8">
                                                    <ReactMarkdown>{content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </article>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </main>

                    <aside className="min-w-0 bg-white">
                        <div className="flex h-12 items-center gap-2 border-b px-4">
                            <PanelRight className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-slate-950">Controle editorial</h3>
                        </div>
                        <ScrollArea className="h-[calc(100%-3rem)]">
                            <div className="space-y-5 p-4">{metadata}</div>
                        </ScrollArea>
                    </aside>
                </div>
            </div>
        </TooltipProvider>
    );
}

export function MetadataField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</Label>
            {children}
        </div>
    );
}

export function MetadataInput(props: React.ComponentProps<typeof Input>) {
    return <Input {...props} className={["h-9", props.className].filter(Boolean).join(" ")} />;
}
