
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Eye, ThumbsUp } from "lucide-react";

interface PostMetrics {
  id: string;
  item_topic: string; // mapped from 'topic'
  status: string;
  published_at: string | null;
  scheduled_for: string | null;
  campaign_id: string | null;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
}

export function PostPerformanceTable() {
  const [posts, setPosts] = useState<PostMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("linkedin_carousels")
        .select("id, topic, status, published_at, scheduled_for, campaign_id, views, likes, comments, engagement_rate")
        .order("views", { ascending: false })
        .limit(10); // Top 10 for now

      if (error) {
        console.error("Supabase error fetching posts:", error);
        // Fallback or rethrow
        throw error;
      }

      // Transform data if needed, currently direct mapping
      const formattedPosts: PostMetrics[] = (data || []).map((p: any) => ({
        id: p.id,
        item_topic: p.topic,
        status: p.status,
        published_at: p.published_at,
        scheduled_for: p.scheduled_for,
        campaign_id: p.campaign_id,
        views: p.views ?? 0, // Use null coalescing
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        engagement_rate: p.engagement_rate ?? 0,
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching post metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance de Posts
            </CardTitle>
            <CardDescription>Top 10 posts por visualização</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tópico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Engajamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum dado disponível.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {post.item_topic}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        post.status === 'published' ? 'default' : 
                        post.status === 'scheduled' ? 'secondary' : 'outline'
                      }>
                        {post.status === 'published' ? 'Publicado' : 
                         post.status === 'scheduled' ? 'Agendado' : post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {post.published_at 
                        ? new Date(post.published_at).toLocaleDateString('pt-BR') 
                        : post.scheduled_for 
                          ? new Date(post.scheduled_for).toLocaleDateString('pt-BR')
                          : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {post.campaign_id || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3 text-muted-foreground" />
                        {post.views.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-1">
                        <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                        {post.likes.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {post.engagement_rate}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
