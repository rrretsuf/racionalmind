import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import GPT3Tokenizer from 'https://esm.sh/gpt3-tokenizer@1.1.5';
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
    MESSAGE_OVERHEAD_TOKENS,
    MODEL_CONTEXT_WINDOWS,
    DEFAULT_MODEL_CONTEXT_WINDOW,
    DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT,
    DEFAULT_RAG_CONTEXT_BUDGET_TOKENS,
    DEFAULT_SAFETY_BUFFER_TOKENS
} from "../_shared/constants.ts";

let tokenizer: GPT3Tokenizer;

try {
  tokenizer = new GPT3Tokenizer({ type: 'cl100k_base' });
  logger.info("truncate-history: GPT3Tokenizer ('cl100k_base') initialized successfully.");
} catch (e) {
  logger.error("truncate-history: FATAL - Failed to initialize GPT3Tokenizer:", e);
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabase: SupabaseClient;
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logger.error("truncate-history: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
      throw new Error("Server configuration error: Supabase client not configured.");
    }
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  } catch (e) {
    logger.error("truncate-history: Failed to initialize Supabase client", e);
    return new Response(JSON.stringify({ error: "Internal server error initializing Supabase client" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!tokenizer) {
    logger.error("truncate-history: Tokenizer is not initialized. Cannot process request.");
    return new Response(JSON.stringify({ error: "Tokenizer not initialized" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      sessionId,
      systemPromptText,
      currentUserMessageText,
      openAiModelName,
      targetMaxOutputTokens = DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT,
      ragContextBudgetTokens = DEFAULT_RAG_CONTEXT_BUDGET_TOKENS,
      safetyBufferTokens = DEFAULT_SAFETY_BUFFER_TOKENS,
    } = await req.json();

    if (!sessionId || !systemPromptText || !currentUserMessageText || !openAiModelName) {
      return new Response(JSON.stringify({ error: "Missing required fields: sessionId, systemPromptText, currentUserMessageText, openAiModelName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelMaxContext = MODEL_CONTEXT_WINDOWS[openAiModelName] || DEFAULT_MODEL_CONTEXT_WINDOW;
    logger.info(`truncate-history: Using model '${openAiModelName}' with context window: ${modelMaxContext}`);

    const systemPromptTokens = tokenizer.encode(systemPromptText).bpe.length + MESSAGE_OVERHEAD_TOKENS;
    const currentUserMessageTokens = tokenizer.encode(currentUserMessageText).bpe.length + MESSAGE_OVERHEAD_TOKENS;

    const effectiveRagContextBudgetTokens = Math.min(ragContextBudgetTokens, 800);
    if (ragContextBudgetTokens > 800) {
      logger.warn(`truncate-history: Original ragContextBudgetTokens (${ragContextBudgetTokens}) exceeded 800, capped to ${effectiveRagContextBudgetTokens}.`);
    }

    const calculatedInputTokenBudget = modelMaxContext - targetMaxOutputTokens - safetyBufferTokens;
    const historyTokenBudget = calculatedInputTokenBudget - systemPromptTokens - currentUserMessageTokens - effectiveRagContextBudgetTokens;

    logger.debug("truncate-history: Token budget calculations:", {
      modelMaxContext, targetMaxOutputTokens, safetyBufferTokens,
      ragContextBudgetTokensOriginal: ragContextBudgetTokens,
      effectiveRagContextBudgetTokens,
      systemPromptTokens, currentUserMessageTokens,
      calculatedInputTokenBudget, historyTokenBudget
    });

    if (historyTokenBudget <= 0) {
      logger.warn(`truncate-history: No token budget available for history (${historyTokenBudget} tokens). Returning empty history. Check prompt component sizes and budgets.`);
      return new Response(JSON.stringify({
        truncatedHistoricalMessages: [],
        debugInfo: {
          historyTokenBudget,
          message: "No token budget for history.",
          originalMessageCount: 0,
          truncatedMessageCount: 0,
          tokensUsedByHistory: 0,
        }
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: pastMessages, error: dbError } = await supabase
      .from('messages')
      .select('sender_role, content_text')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (dbError) {
      logger.error(`truncate-history: Database error fetching messages for session ${sessionId}:`, dbError);
      throw dbError;
    }

    const originalMessageCount = pastMessages?.length || 0;
    let truncatedHistoricalMessages: Array<{ role: string; content: string | null }> = [];
    let currentHistoryTokensUsed = 0;

    if (pastMessages && pastMessages.length > 0) {
      for (const message of pastMessages.slice().reverse()) {
        const content = message.content_text || "";
        const messageContentTokens = tokenizer.encode(content).bpe.length;
        const messageTotalTokens = messageContentTokens + MESSAGE_OVERHEAD_TOKENS;

        if ((currentHistoryTokensUsed + messageTotalTokens) <= historyTokenBudget) {
          truncatedHistoricalMessages.unshift({
            role: message.sender_role === 'ai' ? 'assistant' : message.sender_role,
            content: content
          });
          currentHistoryTokensUsed += messageTotalTokens;
        } else {
          logger.debug(`truncate-history: History token budget reached. Message (content: "${content.substring(0,30)}...") with ${messageTotalTokens} tokens exceeds remaining budget.`);
          break;
        }
      }
    }

    const truncatedMessageCount = truncatedHistoricalMessages.length;
    logger.info(`truncate-history: Truncation complete for session ${sessionId}. Original messages: ${originalMessageCount}, Truncated: ${truncatedMessageCount}, Tokens used by history: ${currentHistoryTokensUsed}`);

    const debugInfo = {
      openAiModelName,
      modelMaxContext,
      targetMaxOutputTokens,
      safetyBufferTokens,
      ragContextBudgetTokens,
      systemPromptTokens,
      currentUserMessageTokens,
      calculatedInputTokenBudget,
      historyTokenBudget,
      originalMessageCount,
      truncatedMessageCount,
      tokensUsedByHistory: currentHistoryTokensUsed,
      ragContextBudgetTokensOriginal: ragContextBudgetTokens,
      effectiveRagContextBudgetTokens,
    };

    return new Response(JSON.stringify({ truncatedHistoricalMessages, debugInfo }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("truncate-history: Unhandled error in request handler:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})