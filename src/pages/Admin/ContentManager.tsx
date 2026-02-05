
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Edit, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BatchImageGenerator } from "@/components/admin/BatchImageGenerator";

export default function ContentManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch posts');
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, reason?: string) => {
    const { error } = await supabase
      .from('content_templates')
      .update({ 
        status, 
        rejected_at: status === 'rejected' ? new Date().toISOString() : null,
        rejection_reason: reason || null
      })
      .eq('id', id);

    if (error) {
      toast.error(`Failed to update status to ${status}`);
    } else {
      toast.success(`Post marked as ${status}`);
      fetchPosts();
    }
  };

  const navigateToEditor = (id: string) => {
    navigate(`/admin/image-editor?postId=${id}`);
  };

  const PostCard = ({ post }: { post: any }) => (
    <Card className="mb-4 overflow-hidden glow-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/20">
        <CardTitle className="text-lg font-semibold truncate max-w-[70%]">
          {post.title || "Untitled Post"}
        </CardTitle>
        <Badge variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}>
          {post.status}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
            {post.content}
          </p>
          <div className="flex gap-2 mt-2">
            {post.pillar && <Badge variant="outline">{post.pillar}</Badge>}
            <Badge variant="outline">{post.category}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border rounded-md bg-muted/10 min-h-[150px]">
          {post.image_url ? (
            <img src={post.image_url} alt="Post asset" className="object-cover w-full h-full max-h-[200px]" />
          ) : (
             <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">No Image</span>
                <Button variant="link" size="sm" onClick={() => navigateToEditor(post.id)}>
                  Create Image
                </Button>
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/20 py-2">
        {post.status !== 'approved' && (
             <Button size="sm" variant="default" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(post.id, 'approved')}>
                <Check className="w-4 h-4" /> Approve
             </Button>
        )}
        {post.status !== 'rejected' && (
            <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus(post.id, 'rejected', 'Manual Rejection')}>
                <X className="w-4 h-4" /> Reject
            </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1" onClick={() => navigateToEditor(post.id)}>
            <Edit className="w-4 h-4" /> Edit Image
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Content Manager
         </h1>
         <div className="flex gap-2">
             <BatchImageGenerator onComplete={fetchPosts} />
             <Button onClick={fetchPosts} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
             </Button>
         </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
                {posts
                  .filter(p => tab === 'all' ? true : (tab === 'pending' ? (p.status === 'draft' || p.status === 'pending' || !p.status) : p.status === tab))
                  .map(post => <PostCard key={post.id} post={post} />)
                }
                {posts.filter(p => tab === 'all' ? true : (tab === 'pending' ? (p.status === 'draft' || p.status === 'pending' || !p.status) : p.status === tab)).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No posts found in {tab}
                    </div>
                )}
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
