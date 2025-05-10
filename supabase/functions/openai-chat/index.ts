import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; 
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
    CHAT_MODEL_PAYING,
    CHAT_MODEL_FREE,
    DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT
} from "../_shared/constants.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

class OpenAIStreamParser extends TransformStream<string, Uint8Array> {
  private accumulatedData = "";
  private encoder = new TextEncoder();
  public accumulatedResponseForDb = "";

  constructor() {
    super({
      transform: (chunk, controller) => {
        this.accumulatedData += chunk;
        const lines = this.accumulatedData.split("\n");

        this.accumulatedData = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataContent = line.substring("data: ".length).trim();

            // IMPORTANT: Check for [DONE] signal from OpenAI
            if (dataContent === "[DONE]") {
              return;
            }

            try {
              const parsed = JSON.parse(dataContent);
              const deltaContent = parsed.choices?.[0]?.delta?.content;

              if (deltaContent) {
                this.accumulatedResponseForDb += deltaContent;
                const clientSseMsg = `data: ${JSON.stringify({ text: deltaContent })}\n\n`;
                controller.enqueue(this.encoder.encode(clientSseMsg));
              }
              // Handle other potential data structures if needed (e.g., finish_reason)
              // else if (parsed.choices?.[0]?.finish_reason) {
              //   console.log("Finish Reason:", parsed.choices[0].finish_reason);
              // }

            } catch (e) {
              logger.error("Error parsing OpenAI JSON chunk:", e, "Chunk content:", dataContent);
              const errorMsg = `data: ${JSON.stringify({ error: "Error processing stream data" })}\n\n`;
              try { controller.enqueue(this.encoder.encode(errorMsg)); } catch (enqueueError) { logger.error("Failed to enqueue parse error:", enqueueError); }
            }
          } else if (line.trim()) {
             logger.warn("Received non-data line from OpenAI:", line);
          }
        }
      },
    });
  }
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    logger.debug("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }
  logger.debug(`Received ${req.method} request`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.");
    return new Response(JSON.stringify({ error: "Server configuration error: Supabase client not configured." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // --- Authentication & Parameter Validation ---.
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const sessionId = url.searchParams.get("session_id");
    const userMessageText = url.searchParams.get("text");

     if (!userMessageText || !sessionId || !userId) {
       const missingParams = [
         !userMessageText && "text",
         !sessionId && "session_id",
         !userId && "user_id"
       ].filter(Boolean).join(", ");

       logger.error(`Request missing parameters: ${missingParams}`);
       return new Response(JSON.stringify({ error: `Missing required query parameters: ${missingParams}` }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     logger.debug(`Processing request: user_id=${userId}, session_id=${sessionId}`);

    // --- Determine User Tier & Select Model ---
    let selectedOpenAiModel = CHAT_MODEL_FREE;
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', userId)
            .single();

        if (profileError) {
            logger.warn(`openai-chat: Could not fetch profile for user ${userId}, defaulting to free model. Error: ${profileError.message}`);
        } else if (profileData && profileData.tier === 'paying') {
            selectedOpenAiModel = CHAT_MODEL_PAYING;
            logger.debug(`openai-chat: User ${userId} is on paying tier, using model: ${selectedOpenAiModel}`);
        } else {
            logger.debug(`openai-chat: User ${userId} is on free tier or tier undefined, using model: ${selectedOpenAiModel}`);
        }
    } catch (e) {
        logger.error(`openai-chat: Error fetching user profile for tier determination, defaulting to free model:`, e);
    }

    // --- OpenAI Key Check ---
    if (!OPENAI_API_KEY) {
      logger.error('FATAL: Missing OPENAI_API_KEY environment variable.');
      return new Response(JSON.stringify({ error: "Server configuration error: OpenAI API key not set." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Generate User Message Embedding ---
    let userMessageEmbedding = null;
    if (userMessageText && userMessageText.trim() !== "") {
      try {
        logger.debug("Attempting to generate embedding for user message via generate-embeddings function...");
        const { data: embedData, error: embedError } = await supabase.functions.invoke(
          'generate-embeddings',
          { body: { input: userMessageText } }
        );

        if (embedError) {
          logger.error('Error invoking generate-embeddings for user message:', embedError);
        } else if (embedData && embedData.embedding) {
          userMessageEmbedding = embedData.embedding;
          logger.debug("User message embedding generated successfully via function call.");
        } else {
          logger.warn('generate-embeddings for user message returned no embedding or unexpected data:', embedData);
        }
      } catch (invokeError) {
        logger.error('Caught error invoking generate-embeddings for user message:', invokeError);
      }
    }

    // --- Save User Message ---
    try {
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          sender_role: 'user',
          content_text: userMessageText,
          content_embedding: userMessageEmbedding,
        });
      if (userMessageError) {
        logger.error('Failed to save user message:', userMessageError);
      } else {
        logger.debug('User message saved successfully.');
      }
    } catch (dbError) {
      logger.error('Unexpected error saving user message:', dbError);
    }
    logger.debug("Skipping history/RAG lookup for now.");

    // ---Call truncate-history function---
    let truncatedHistoricalMessages: Array<{ role: string; content: string | null }> = [];
    const systemPromptContent = "You are a helpful AI assistant. Your name is Rational Mind. You are designed to help users explore and manage thoughts that lead to overthinking, and promote self-understanding and mental clarity. You should be supportive and act as an \"Overthinking Buddy\".";
    
    try {
      logger.info("openai-chat: Invoking 'truncate-history' function...");
      const { data: truncationResult, error: truncationError } = await supabase.functions.invoke(
        'truncate-history',
        {
          body: {
            sessionId: sessionId,
            systemPromptText: systemPromptContent,
            currentUserMessageText: userMessageText,
            openAiModelName: selectedOpenAiModel,
            targetMaxOutputTokens: DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT, 
          }
        }
      );

      if (truncationError) {
        logger.error("openai-chat: Error invoking 'truncate-history' function:", truncationError);
      } else if (truncationResult && truncationResult.truncatedHistoricalMessages) {
        truncatedHistoricalMessages = truncationResult.truncatedHistoricalMessages;
        logger.info("openai-chat: Successfully received truncated history.", { debugInfo: truncationResult.debugInfo });
      } else {
        logger.warn("openai-chat: 'truncate-history' function returned no messages or unexpected data.", { response: truncationResult });
      }
    } catch (invokeError) {
      logger.error("openai-chat: Caught an exception while invoking 'truncate-history':", invokeError);
    }

    // --- Construct OpenAI Request ---
    const messagesToOpenAI = [
      {
        role: "system",
        content: systemPromptContent,
      },
      ...truncatedHistoricalMessages,
      { role: "user", content: userMessageText }, 
    ];

    const openaiPayload = {
      model: selectedOpenAiModel,
      messages: messagesToOpenAI,
      stream: true,
      max_completion_tokens: DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT,
    };
    logger.debug("Sending payload to OpenAI:", JSON.stringify(openaiPayload, null, 2));


    // --- Fetch from OpenAI ---
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
      },
      body: JSON.stringify(openaiPayload),
    });
    logger.debug(`OpenAI response status: ${openaiResponse.status}`);


    // --- Handle OpenAI Errors ---
     if (!openaiResponse.ok || !openaiResponse.body) {
       const errorBodyText = await openaiResponse.text();
       logger.error("OpenAI API Error:", { status: openaiResponse.status, statusText: openaiResponse.statusText, body: errorBodyText });
       let errorDetail = errorBodyText;
       try {
         errorDetail = JSON.parse(errorBodyText);
        } catch {
          logger.warn("OpenAI error response body was not valid JSON.");
        }

       return new Response(JSON.stringify({ error: "OpenAI API request failed", details: errorDetail }), {
         status: openaiResponse.status,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }

    // --- Pipe the Stream ---
    logger.debug("OpenAI request successful, starting stream piping...");
    const openAIStreamParserInstance = new OpenAIStreamParser();
    const stream = openaiResponse.body
      .pipeThrough(new TextDecoderStream()) 
      .pipeThrough(openAIStreamParserInstance)
      .pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
        async flush(controller) {
          logger.debug("Source stream ended, flushing final client [DONE] marker.");
          try {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          } catch (e) {
             logger.error("Error enqueuing final [DONE] in flush:", e);
          }

          // --- Save AI Message ---
          const aiMessageText = openAIStreamParserInstance.accumulatedResponseForDb;
          let aiMessageEmbedding = null;

          if (aiMessageText && aiMessageText.trim() !== "") {
            try {
              logger.debug("Attempting to generate embedding for AI message via generate-embeddings function...");
              const { data: embedData, error: embedError } = await supabase.functions.invoke(
                'generate-embeddings',
                { body: { input: aiMessageText } }
              );

              if (embedError) {
                logger.error('Error invoking generate-embeddings for AI message:', embedError);
              } else if (embedData && embedData.embedding) {
                aiMessageEmbedding = embedData.embedding;
                logger.debug("AI message embedding generated successfully via function call.");
              } else {
                logger.warn('generate-embeddings for AI message returned no embedding or unexpected data:', embedData);
              }
            } catch (invokeError) {
              logger.error('Caught error invoking generate-embeddings for AI message:', invokeError);
            }
          }
          
          if (aiMessageText && aiMessageText.trim() !== "") {
            try {
              const { error: aiMessageError } = await supabase
                .from('messages')
                .insert({
                  session_id: sessionId,
                  user_id: userId,
                  sender_role: 'ai',
                  content_text: aiMessageText,
                  content_embedding: aiMessageEmbedding,
                });
              if (aiMessageError) {
                logger.error('Failed to save AI message:', aiMessageError);
              } else {
                logger.debug('AI message saved successfully.');
              }
            } catch (dbError) {
              logger.error('Unexpected error saving AI message:', dbError);
            }
          } else {
            logger.warn("AI response was empty or whitespace, not saving to DB.");
          }
        }
      }));


    // --- Return SSE Response ---
    logger.debug("Returning SSE stream to client.");
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      status: 200
    });

  } catch (error) {
    logger.error("Unhandled error in Edge Function main try-catch:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});