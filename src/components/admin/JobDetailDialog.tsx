// @ts-nocheck
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Job } from "@/types/jobs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface JobDetailDialogProps {
    job: Job | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function JobDetailDialog({ job, open, onOpenChange }: JobDetailDialogProps) {
    if (!job) return null;

    const createdAt = job.created_at ?? job.scheduled_for;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Job Details
                        <Badge variant="outline">{job.type}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        ID: {job.id} • Created: {new Date(createdAt).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>Status:</span>
                            <Badge variant="secondary">{job.status}</Badge>
                            {job.started_at && (
                                <span>Started: {new Date(job.started_at).toLocaleString()}</span>
                            )}
                            {job.completed_at && (
                                <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>
                            )}
                        </div>
                        {job.error && (
                            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
                                <h4 className="font-semibold text-destructive mb-1">Error</h4>
                                <p className="text-sm font-mono text-destructive">{job.error}</p>
                            </div>
                        )}

                        <div>
                            <h4 className="font-semibold mb-2">Payload</h4>
                            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-auto">
                                {JSON.stringify(job.payload, null, 2)}
                            </pre>
                        </div>

                        {job.result && (
                            <div>
                                <h4 className="font-semibold mb-2">Result</h4>
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-auto">
                                    {JSON.stringify(job.result, null, 2)}
                                </pre>
                            </div>
                        )}

                        {job.checkpoint && (
                            <div>
                                <h4 className="font-semibold mb-2">Checkpoint</h4>
                                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs overflow-auto">
                                    {JSON.stringify(job.checkpoint, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
