import { supabase } from "@/integrations/supabase/client";

// Expanded event types for comprehensive tracking
export type EventType = 
  // Original types
  | "chatbot_interaction"
  | "form_submission" 
  | "lead_magnet_usage"
  | "consultation_scheduled"
  // Website behavior
  | "resource_view"
  | "resource_read"
  | "resource_download"
  | "page_scroll_depth"
  | "calculator_started"
  | "calculator_completed"
  | "outbound_click"
  | "cta_click"
  | "video_play"
  | "video_complete"
  // Chatbot specific
  | "chatbot_opened"
  | "chatbot_message_sent"
  | "chatbot_lead_captured"
  // Form specific
  | "form_started"
  | "form_field_interaction"
  | "form_abandoned";

interface TrackEventParams {
  eventType: EventType;
  companyName?: string;
  companyEmail?: string;
  metadata?: Record<string, any>;
  pagePath?: string;
}

// Generate or retrieve session ID from localStorage
const getSessionId = (): string => {
  if (typeof window === "undefined") return "server";
  
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

// Get current page path
const getPagePath = (): string => {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
};

// Get referrer
const getReferrer = (): string => {
  if (typeof window === "undefined") return "";
  return document.referrer || "";
};

/**
 * Track any analytics event with comprehensive context
 */
export const trackAnalyticsEvent = async ({
  eventType,
  companyName,
  companyEmail,
  metadata,
  pagePath,
}: TrackEventParams) => {
  try {
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      company_name: companyName,
      company_email: companyEmail,
      metadata: {
        session_id: getSessionId(),
        page_path: pagePath || getPagePath(),
        referrer: getReferrer(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        ...(metadata || {}),
      },
    });

    if (error) {
      console.error("Failed to track analytics event:", error);
    }
  } catch (error) {
    console.error("Error tracking analytics:", error);
  }
};

/**
 * Track resource view (when someone opens a resource page)
 */
export const trackResourceView = (resourceSlug: string, resourceTitle: string) => {
  return trackAnalyticsEvent({
    eventType: "resource_view",
    metadata: { 
      resource_slug: resourceSlug, 
      resource_title: resourceTitle,
    },
  });
};

/**
 * Track resource read completion (scroll to bottom or time spent)
 */
export const trackResourceRead = (resourceSlug: string, resourceTitle: string, readPercentage: number) => {
  return trackAnalyticsEvent({
    eventType: "resource_read",
    metadata: { 
      resource_slug: resourceSlug, 
      resource_title: resourceTitle,
      read_percentage: readPercentage,
    },
  });
};

/**
 * Track resource download (PDF, etc)
 */
export const trackResourceDownload = (resourceSlug: string, resourceTitle: string, fileType: string) => {
  return trackAnalyticsEvent({
    eventType: "resource_download",
    metadata: { 
      resource_slug: resourceSlug, 
      resource_title: resourceTitle,
      file_type: fileType,
    },
  });
};

/**
 * Track scroll depth on any page
 */
export const trackScrollDepth = (depth: number) => {
  // Only track at meaningful thresholds
  if (depth !== 25 && depth !== 50 && depth !== 75 && depth !== 100) return;
  
  return trackAnalyticsEvent({
    eventType: "page_scroll_depth",
    metadata: { depth_percentage: depth },
  });
};

/**
 * Track CTA button clicks
 */
export const trackCtaClick = (ctaId: string, ctaText: string, destination?: string) => {
  return trackAnalyticsEvent({
    eventType: "cta_click",
    metadata: { 
      cta_id: ctaId, 
      cta_text: ctaText,
      destination: destination,
    },
  });
};

/**
 * Track outbound link clicks
 */
export const trackOutboundClick = (url: string, linkText?: string) => {
  return trackAnalyticsEvent({
    eventType: "outbound_click",
    metadata: { 
      url, 
      link_text: linkText,
    },
  });
};

/**
 * Track chatbot interactions
 */
export const trackChatbotEvent = (
  action: "opened" | "message_sent" | "lead_captured",
  metadata?: Record<string, any>
) => {
  const eventType = action === "opened" 
    ? "chatbot_opened" 
    : action === "message_sent" 
      ? "chatbot_message_sent" 
      : "chatbot_lead_captured";
      
  return trackAnalyticsEvent({
    eventType,
    metadata,
  });
};

/**
 * Track calculator usage
 */
export const trackCalculatorEvent = (
  action: "started" | "completed",
  metadata?: Record<string, any>
) => {
  return trackAnalyticsEvent({
    eventType: action === "started" ? "calculator_started" : "calculator_completed",
    metadata,
  });
};

/**
 * Track video interactions
 */
export const trackVideoEvent = (
  action: "play" | "complete",
  videoId: string,
  videoTitle?: string
) => {
  return trackAnalyticsEvent({
    eventType: action === "play" ? "video_play" : "video_complete",
    metadata: { video_id: videoId, video_title: videoTitle },
  });
};
