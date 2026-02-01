import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  channel: 'linkedin' | 'whatsapp' | 'email' | 'website_chat';
  external_account_id: string;
  thread_id: string;
  lead_id: string | null;
  contact_name: string | null;
  contact_identifier: string;
  subject: string | null;
  status: 'active' | 'archived' | 'snoozed' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  assigned_to: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  lead?: {
     name: string;
     company: string | null;
  }
}

export interface Message {
  id: string;
  conversation_id: string;
  external_message_id: string;
  content: string;
  content_type: 'text' | 'image' | 'file' | 'link' | 'html';
  sender_type: 'contact' | 'agent' | 'system';
  sender_name: string | null;
  sender_identifier: string | null;
  attachments: any[] | null;
  created_at: string;
}

export function useConversations(filter: 'all' | 'active' | 'archived' = 'active') {
  const queryClient = useQueryClient();

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ["conversations", filter],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select(`
          *,
          lead:contact_leads(name, company)
        `)
        .order("last_message_at", { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Conversation[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { conversations, isLoading, error };
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "conversation_messages", 
          filter: `conversation_id=eq.${conversationId}` 
        },
        (payload) => {
          // Optimistically update or just invalidate
          queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] }); // To update preview/timestamp
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return { messages, isLoading };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, attachments }: { conversationId: string, content: string, attachments?: any[] }) => {
      // 1. Call Edge Function to send via external provider
      const { data: functionData, error: functionError } = await supabase.functions.invoke('unipile-actions', {
        body: {
            action: 'send_message',
            payload: { conversationId, content, attachments }
        }
      });

      if (functionError) throw functionError;
      
      // We assume the webhook or optimistic update handles the DB insert, 
      // but for better UX we might want to insert a "pending" message here manually if strictly needed.
      // For now, let's trust the feedback loop or insert purely locally if function succeeds.
      return functionData;
    },
    onSuccess: (_, variables) => {
      toast.success("Mensagem enviada");
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", variables.conversationId] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    }
  });
}
