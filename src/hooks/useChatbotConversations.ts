import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatbotMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatbotSession {
  session_id: string;
  first_message_at: string;
  last_message_at: string;
  message_count: number;
  user_message_count: number;
  first_user_message: string;
  detected_name?: string;
  detected_email?: string;
  detected_phone?: string;
  detected_interest?: string;
  ip?: string;
}

export function useChatbotConversations() {
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<ChatbotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all messages ordered by time, then group by session on the client
      const { data, error } = await (supabase
        .from("chatbot_conversations" as any)
        .select("*")
        .order("created_at", { ascending: true }) as any);

      if (error) {
        console.error("Error fetching chatbot conversations:", error);
        return;
      }

      const messages = (data || []) as ChatbotMessage[];

      // Group by session_id
      const sessionMap = new Map<string, ChatbotMessage[]>();
      for (const msg of messages) {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, []);
        }
        sessionMap.get(msg.session_id)!.push(msg);
      }

      // Build session summaries
      const sessionList: ChatbotSession[] = [];
      for (const [sessionId, msgs] of sessionMap) {
        const userMsgs = msgs.filter(m => m.role === "user");
        const firstUserMsg = userMsgs[0];
        const lastMsg = msgs[msgs.length - 1];

        // Extract contact info from metadata
        let detectedName: string | undefined;
        let detectedEmail: string | undefined;
        let detectedPhone: string | undefined;
        let detectedInterest: string | undefined;
        let ip: string | undefined;

        for (const msg of msgs) {
          const meta = msg.metadata || {};
          if (meta.ip) ip = meta.ip;
          // The website-bot inserts detected_* as top-level fields,
          // but they may fail (schema mismatch). Check metadata too.
          if ((msg as any).detected_name) detectedName = (msg as any).detected_name;
          if ((msg as any).detected_email) detectedEmail = (msg as any).detected_email;
          if ((msg as any).detected_phone) detectedPhone = (msg as any).detected_phone;
          if ((msg as any).detected_interest) detectedInterest = (msg as any).detected_interest;
        }

        sessionList.push({
          session_id: sessionId,
          first_message_at: msgs[0].created_at,
          last_message_at: lastMsg.created_at,
          message_count: msgs.length,
          user_message_count: userMsgs.length,
          first_user_message: firstUserMsg?.content || "(sem mensagem)",
          detected_name: detectedName,
          detected_email: detectedEmail,
          detected_phone: detectedPhone,
          detected_interest: detectedInterest,
          ip,
        });
      }

      // Sort by most recent first
      sessionList.sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setSessions(sessionList);
    } catch (err) {
      console.error("Error in fetchSessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (sessionId: string) => {
    try {
      setMessagesLoading(true);

      const { data, error } = await (supabase
        .from("chatbot_conversations" as any)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }) as any);

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setSelectedMessages((data || []) as ChatbotMessage[]);
    } catch (err) {
      console.error("Error in fetchMessages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    selectedMessages,
    loading,
    messagesLoading,
    fetchMessages,
    refetch: fetchSessions,
  };
}
