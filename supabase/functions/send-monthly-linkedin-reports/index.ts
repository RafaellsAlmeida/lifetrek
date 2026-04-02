import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttachmentInput {
  filename: string;
  content: string;
}

interface SendMonthlyLinkedInReportsRequest {
  attachments: AttachmentInput[];
  notes?: string;
  replyTo?: string;
  to?: string[];
}

const DEFAULT_RECIPIENTS = [
  "rbianchini@lifetrek-medical.com",
  "erenner@lifetrek-medical.com",
];

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Configuration Error: Missing RESEND_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload: SendMonthlyLinkedInReportsRequest = await req.json();
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
    const recipients = Array.isArray(payload.to) && payload.to.length > 0
      ? payload.to
      : DEFAULT_RECIPIENTS;

    if (attachments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: attachments" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const invalidAttachment = attachments.find((attachment) =>
      !attachment?.filename?.trim() || !attachment?.content?.trim()
    );
    if (invalidAttachment) {
      return new Response(
        JSON.stringify({ error: "Each attachment must include filename and Base64 content" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const resend = new Resend(resendApiKey);
    const notes = payload.notes?.trim();
    const replyTo = payload.replyTo?.trim();

    const textBody = [
      "Hi,",
      "",
      "Attached are the latest LinkedIn monthly report exports for Lifetrek Medical, exported on April 2, 2026:",
      "- Content report",
      "- Visitors report",
      "- Followers report",
      notes ? "" : undefined,
      notes ? `Notes: ${notes}` : undefined,
      "",
      "Best,",
      "Rafael",
    ].filter((line): line is string => Boolean(line)).join("\n");

    const htmlBody = [
      "<p>Hi,</p>",
      "<p>Attached are the latest LinkedIn monthly report exports for Lifetrek Medical, exported on April 2, 2026:</p>",
      "<ul>",
      "<li>Content report</li>",
      "<li>Visitors report</li>",
      "<li>Followers report</li>",
      "</ul>",
      notes ? `<p><strong>Notes:</strong> ${notes}</p>` : "",
      "<p>Best,<br>Rafael</p>",
    ].join("");

    const { data, error } = await resend.emails.send({
      from: "Lifetrek Medical <noreply@lifetrek-medical.com>",
      to: recipients,
      reply_to: replyTo ? [replyTo] : undefined,
      subject: "Lifetrek Monthly LinkedIn Reports",
      text: textBody,
      html: htmlBody,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
