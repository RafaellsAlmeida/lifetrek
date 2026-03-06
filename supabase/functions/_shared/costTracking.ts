// Cost Tracking Helper for Supabase Edge Functions
// Usage: Import and use around expensive API calls

// API Cost Estimates (in USD)
export const API_COSTS = {
  // OpenRouter Models
  "google/gemini-2.0-flash-001": 0.01,
  "google/gemini-2.0-flash-thinking-exp": 0.015,
  "google/gemini-2.0-flash-exp:free": 0.0,
  "google/gemini-1.5-pro": 0.025,
  "anthropic/claude-3.5-sonnet": 0.03,
  "openai/gpt-4": 0.06,
  
  // Image Generation
  "stabilityai/stable-diffusion-xl-base-1.0": 0.07,
  "openai/dall-e-3": 0.04,
  "google/imagen-3": 0.08,
  
  // Embeddings
  "text-embedding-ada-002": 0.0001,
  "text-embedding-3-small": 0.00002,
  "openai/text-embedding-3-small": 0.00002,
  
  // Other
  "perplexity": 0.005,
  "sonar-pro": 0.005,
  "sonar-reasoning": 0.005,
  "search-api": 0.001,
} as const;

export type APIService = keyof typeof API_COSTS;

interface CostCheckResult {
  allowed: boolean;
  reason?: string;
  current_spent?: number;
  limit?: number;
  would_be?: number;
  daily_spent?: number;
  daily_limit?: number;
  daily_remaining?: number;
  monthly_spent?: number;
  monthly_limit?: number;
}

interface LogCostParams {
  userId: string | null;
  operation: string;
  service: string;
  model: string;
  estimatedCost: number;
  metadata?: Record<string, any>;
}

interface CostTrackingClient {
  rpc: (...args: any[]) => any;
  from: (...args: any[]) => any;
}

interface ExecuteCostTrackingParams {
  userId: string | null;
  operation: string;
  service: string;
  model: string;
  estimatedCost?: number;
  metadata?: Record<string, any>;
}

/**
 * Check if an operation would exceed spending limits
 */
export async function checkSpendingLimit(
  supabase: CostTrackingClient,
  userId: string | null,
  operation: string,
  estimatedCost: number
): Promise<CostCheckResult> {
  try {
    const { data, error } = await supabase.rpc("check_spending_limit", {
      p_user_id: userId,
      p_operation: operation,
      p_estimated_cost: estimatedCost,
    });

    if (error) {
      console.error("Error checking spending limit:", error);
      // Fail open with warning
      return {
        allowed: true,
        reason: "check_failed",
      };
    }

    return data as CostCheckResult;
  } catch (error) {
    console.error("Exception checking spending limit:", error);
    return {
      allowed: true,
      reason: "check_failed",
    };
  }
}

/**
 * Log API cost to database
 */
export async function logAPICost(
  supabase: CostTrackingClient,
  params: LogCostParams
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("api_cost_tracking")
      .insert({
        user_id: params.userId,
        operation: params.operation,
        service: params.service,
        model: params.model,
        estimated_cost: params.estimatedCost,
        metadata: params.metadata || null,
        request_count: 1,
        date: new Date().toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error logging API cost:", error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error("Exception logging API cost:", error);
    return null;
  }
}

/**
 * Get estimated cost for a model
 */
export function getModelCost(model: string): number {
  return API_COSTS[model as APIService] || 0.01; // Default fallback
}

/**
 * Create a cost alert
 */
export async function createCostAlert(
  supabase: CostTrackingClient,
  alertType: string,
  severity: "info" | "warning" | "critical",
  userId: string | null,
  operation: string | null,
  currentValue: number,
  thresholdValue: number,
  message: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("cost_alerts")
      .insert({
        alert_type: alertType,
        severity,
        user_id: userId,
        operation,
        current_value: currentValue,
        threshold_value: thresholdValue,
        message,
        metadata: metadata || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating cost alert:", error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error("Exception creating cost alert:", error);
    return null;
  }
}

export async function recordCostEventSafely(
  supabase: CostTrackingClient,
  params: ExecuteCostTrackingParams,
): Promise<void> {
  const estimatedCost = params.estimatedCost ?? getModelCost(params.model);
  const metadata = params.metadata || {};
  const costEventId = await logAPICost(supabase, {
    userId: params.userId,
    operation: params.operation,
    service: params.service,
    model: params.model,
    estimatedCost,
    metadata,
  });

  if (costEventId) return;

  const message = `Cost tracking write failed for ${params.operation} (${params.service}/${params.model})`;
  console.error(message, metadata);

  await createCostAlert(
    supabase,
    "cost_tracking_write_failed",
    "warning",
    params.userId,
    params.operation,
    estimatedCost,
    estimatedCost,
    message,
    metadata,
  );
}

export async function executeWithCostTracking<T>(
  supabase: CostTrackingClient,
  params: ExecuteCostTrackingParams,
  fn: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  const result = await fn();
  await recordCostEventSafely(supabase, {
    ...params,
    metadata: {
      ...(params.metadata || {}),
      duration_ms: Date.now() - startedAt,
      request_outcome: "success",
    },
  });
  return result;
}

/**
 * Wrapper for expensive operations with automatic cost tracking
 */
export async function withCostTracking<T>(
  supabase: CostTrackingClient,
  userId: string | null,
  operation: string,
  service: string,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const estimatedCost = getModelCost(model);

  // Check spending limit before operation
  const limitCheck = await checkSpendingLimit(
    supabase,
    userId,
    operation,
    estimatedCost
  );

  if (!limitCheck.allowed) {
    console.error(`❌ Spending limit exceeded: ${limitCheck.reason}`);
    
    // Create alert
    await createCostAlert(
      supabase,
      "limit_exceeded",
      "critical",
      userId,
      operation,
      limitCheck.current_spent || 0,
      limitCheck.limit || 0,
      `Operation blocked: ${limitCheck.reason}`
    );

    throw new Error(
      `Spending limit exceeded: ${limitCheck.reason}. Current: $${limitCheck.current_spent}, Limit: $${limitCheck.limit}`
    );
  }

  // Log cost before operation
  await logAPICost(supabase, {
    userId,
    operation,
    service,
    model,
    estimatedCost,
    metadata: {
      daily_remaining: limitCheck.daily_remaining,
      daily_limit: limitCheck.daily_limit,
    },
  });

  // Check if approaching limit (80% threshold)
  if (
    limitCheck.daily_remaining !== undefined &&
    limitCheck.daily_limit !== undefined
  ) {
    const percentUsed =
      ((limitCheck.daily_limit - limitCheck.daily_remaining) /
        limitCheck.daily_limit) *
      100;

    if (percentUsed >= 80 && percentUsed < 100) {
      await createCostAlert(
        supabase,
        "threshold_warning",
        "warning",
        userId,
        operation,
        limitCheck.daily_spent || 0,
        limitCheck.daily_limit,
        `Daily spending at ${percentUsed.toFixed(1)}% of limit`
      );
    }
  }

  // Execute operation
  return await fn();
}

/**
 * Get current spending summary
 */
export async function getSpendingSummary(
  supabase: CostTrackingClient,
  userId: string | null
): Promise<{
  daily: number;
  monthly: number;
  by_operation: Record<string, number>;
}> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);

    // Daily spending
    const { data: dailyData } = await supabase
      .from("api_cost_tracking")
      .select("estimated_cost")
      .eq("date", today)
      .eq("user_id", userId || "");

    const daily = dailyData?.reduce(
      (sum: number, row: any) => sum + Number(row.estimated_cost),
      0
    ) || 0;

    // Monthly spending
    const { data: monthlyData } = await supabase
      .from("api_cost_tracking")
      .select("estimated_cost")
      .gte("date", monthStart.toISOString().split("T")[0])
      .eq("user_id", userId || "");

    const monthly = monthlyData?.reduce(
      (sum: number, row: any) => sum + Number(row.estimated_cost),
      0
    ) || 0;

    // By operation
    const { data: operationData } = await supabase
      .from("api_cost_tracking")
      .select("operation, estimated_cost")
      .eq("date", today)
      .eq("user_id", userId || "");

    const by_operation: Record<string, number> = {};
    operationData?.forEach((row: any) => {
      by_operation[row.operation] =
        (by_operation[row.operation] || 0) + Number(row.estimated_cost);
    });

    return { daily, monthly, by_operation };
  } catch (error) {
    console.error("Error getting spending summary:", error);
    return { daily: 0, monthly: 0, by_operation: {} };
  }
}

// Example usage in an edge function:
/*
import { withCostTracking, API_COSTS } from "./costTracking.ts";

serve(async (req) => {
  const supabase = createClient(...);
  const { data: { user } } = await supabase.auth.getUser(...);

  try {
    const result = await withCostTracking(
      supabase,
      user?.id || null,
      "carousel_generation",
      "openrouter",
      "google/gemini-2.0-flash-001",
      async () => {
        // Your expensive operation here
        return await generateCarousel(...);
      }
    );

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    if (error.message.includes("Spending limit exceeded")) {
      return new Response(
        JSON.stringify({ error: "Daily spending limit reached. Please try again tomorrow." }),
        { status: 429 }
      );
    }
    throw error;
  }
});
*/
