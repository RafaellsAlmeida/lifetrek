// @ts-nocheck
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/jobs";
import { Eye, RotateCcw } from "lucide-react";
import { useState } from "react";
import { JobDetailDialog } from "./JobDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JobTableProps {
    jobs: Job[];
    loading: boolean;
}

export function JobTable({ jobs, loading }: JobTableProps) {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [retrying, setRetrying] = useState<string | null>(null);

    const formatDuration = (job: Job) => {
        if (!job.started_at) return '-';

        const start = new Date(job.started_at).getTime();
        const end = job.completed_at ? new Date(job.completed_at).getTime() : Date.now();
        const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));

        const hours = Math.floor(diffSeconds / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        const parts = [];
        if (hours) parts.push(`${hours}h`);
        if (minutes || hours) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        const label = parts.join(' ');
        return job.completed_at ? label : `${label} (running)`;
    };

    const formatPayloadPreview = (payload: Job['payload']) => {
        if (!payload) return '-';

        const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const compact = raw.replace(/\s+/g, ' ');
        if (compact.length <= 90) return compact;

        return `${compact.slice(0, 87)}...`;
    };

    const getCreatedTimestamp = (job: Job) => job.created_at;

    const handleRetry = async (job: Job) => {
        try {
            setRetrying(job.id);
            const { error } = await supabase.functions.invoke('retry-job', {
                body: { job_id: job.id }
            });

            if (error) throw error;
            toast.success("Retry initiated");
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unexpected error';
            toast.error(`Retry failed: ${message}`);
        } finally {
            setRetrying(null);
        }
    };
    
    // ...

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Created</TableHead>
                            <TableHead className="hidden lg:table-cell">Duration</TableHead>
                            <TableHead className="hidden lg:table-cell">Payload Preview</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No jobs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">
                                        {job.job_type}
                                        <div className="md:hidden text-xs text-muted-foreground">
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(job.status)}>
                                            {job.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {new Date(job.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                        {formatDuration(job)}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <span className="block max-w-[260px] truncate font-mono text-xs text-muted-foreground">
                                            {formatPayloadPreview(job.payload)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedJob(job)}
                                            aria-label="View job details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {job.status === 'failed' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRetry(job)}
                                                disabled={retrying === job.id}
                                                aria-label="Retry job"
                                            >
                                                <RotateCcw className={`h-4 w-4 ${retrying === job.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <JobDetailDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open) => !open && setSelectedJob(null)}
            />
        </>
    );
}
