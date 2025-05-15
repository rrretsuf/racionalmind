import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; 
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import GPT3Tokenizer from 'https://esm.sh/gpt3-tokenizer@1.1.5'; // Import tokenizer
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
    CHAT_MODEL_PAYING,
    CHAT_MODEL_FREE,
    DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT
} from "../_shared/constants.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

// Initialize tokenizer globally
let tokenizer: GPT3Tokenizer;
try {
  tokenizer = new GPT3Tokenizer({ type: 'cl100k_base' });
  logger.info("openai-chat: GPT3Tokenizer ('cl100k_base') initialized successfully.");
} catch (e) {
  logger.error("openai-chat: FATAL - Failed to initialize GPT3Tokenizer:", e);
  // If tokenizer fails to init, the function might still proceed but with less accurate token calcs / RAG truncation.
}

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
    const rationalityParam = url.searchParams.get("rationality");

     if (!userMessageText || !sessionId || !userId) {
       const missingParamsList = [
         !userMessageText && "text",
         !sessionId && "session_id",
         !userId && "user_id",
       ].filter(Boolean);
       const missingParamsString = missingParamsList.join(", ");

       logger.error(`Request missing parameters: ${missingParamsString}`);
       return new Response(JSON.stringify({ error: `Missing required query parameters: ${missingParamsString}` }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     logger.debug(`Processing request: user_id=${userId}, session_id=${sessionId}, rationality=${rationalityParam}`);

    // --- Determine User Tier & Select Model ---
    let selectedOpenAiModel = CHAT_MODEL_FREE;
    let userTier = 'free'; // Default to free
    let userRationalityPref: number | null = null;
    let dynamicProfile: string | null = null;
    let mainPattern: string | null = null;
    let userName: string | null = null;
    let userAgeGroup: string | null = null;
    let userMainTopic: string | null = null;
    let userGoal: string | null = null;

    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('tier, rationality, dynamic_profile, main_pattern, name, age_group, main_topic, goal')
            .eq('id', userId)
            .single();

        if (profileError) {
            logger.warn(`openai-chat: Could not fetch profile for user ${userId}, defaulting to free model and no specific profile context. Error: ${profileError.message}`);
        } else if (profileData) {
            userTier = profileData.tier === 'paying' ? 'paying' : 'free';
            selectedOpenAiModel = userTier === 'paying' ? CHAT_MODEL_PAYING : CHAT_MODEL_FREE;
            logger.debug(`openai-chat: User ${userId} is on ${userTier} tier, using model: ${selectedOpenAiModel}`);
            
            userRationalityPref = profileData.rationality;
            dynamicProfile = profileData.dynamic_profile;
            mainPattern = profileData.main_pattern;
            userName = profileData.name;
            userAgeGroup = profileData.age_group;
            userMainTopic = profileData.main_topic;
            userGoal = profileData.goal;
        }
    } catch (e) {
        logger.error(`openai-chat: Error fetching user profile, defaulting to free model and no specific profile context:`, e);
    }

    // Determine effective rationality
    let effectiveRationality = 3; // Default rationality
    const parsedRationalityParam = rationalityParam ? parseInt(rationalityParam, 10) : NaN;

    if (!isNaN(parsedRationalityParam) && parsedRationalityParam >= 1 && parsedRationalityParam <= 5) {
        effectiveRationality = parsedRationalityParam;
        logger.debug(`openai-chat: Using rationality level ${effectiveRationality} from query parameter.`);
    } else if (userRationalityPref && userRationalityPref >= 1 && userRationalityPref <= 5) {
        effectiveRationality = userRationalityPref;
        logger.debug(`openai-chat: Using rationality level ${effectiveRationality} from user profile.`);
    } else {
        logger.debug(`openai-chat: Using default rationality level ${effectiveRationality} (param/profile not set or invalid).`);
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

    // --- Dynamic Context - RAG Implementation ---
    let formattedRagContextText = "";
    let ragContextTokens = 0;

    if (userTier === 'paying' || userTier === 'free') {
        logger.info(`openai-chat: User tier (${userTier}) allows RAG. Attempting to invoke rag-dynamic-context.`);
        if (userMessageEmbedding) {
            try {
                const { data: ragData, error: ragError } = await supabase.functions.invoke(
                    'rag-dynamic-context',
                    { body: { userId, userMessageText, userMessageEmbedding, effectiveRationality } }
                );

                if (ragError) {
                    logger.error("openai-chat: Error invoking 'rag-dynamic-context' function:", ragError);
                } else if (ragData) {
                    formattedRagContextText = ragData.formattedRagContextText || "";
                    ragContextTokens = ragData.ragContextTokens || 0;
                    if (formattedRagContextText.trim() !== "") {
                        logger.info("openai-chat: Successfully received RAG context from 'rag-dynamic-context'.", { ragTokenEstimate: ragContextTokens });
                    } else {
                        logger.info("openai-chat: 'rag-dynamic-context' returned empty formattedRAGContextText.");
                    }
                } else {
                    logger.warn("openai-chat: 'rag-dynamic-context' function returned no data or unexpected structure.");
                }
            } catch (invokeError) {
                logger.error("openai-chat: Caught an exception while invoking 'rag-dynamic-context':", invokeError);
            }
        } else {
            logger.warn("openai-chat: User message embedding is not available, skipping RAG invocation.");
        }
    } else {
        logger.info(`openai-chat: User tier (${userTier}) does not allow RAG. Skipping RAG invocation.`);
    }

    // ---Call truncate-history function---
    let truncatedHistoricalMessages: Array<{ role: string; content: string | null }> = [];
    let systemPromptContent = "You are a helpful AI assistant. Your name is Rational Mind. You are designed to help users explore and manage thoughts that lead to overthinking, and promote self-understanding and mental clarity. You should be supportive and act as an \"Overthinking Buddy\".;"; // Default
    
    try {
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('ai_knowledge')
        .select('system_prompt')
        .eq('id', effectiveRationality)
        .single();

      if (knowledgeError) {
        logger.warn(`openai-chat: Could not fetch system prompt for rationality ID ${effectiveRationality}. Using default. Error: ${knowledgeError.message}`);
      } else if (knowledgeData && knowledgeData.system_prompt && knowledgeData.system_prompt.trim() !== "") {
        systemPromptContent = knowledgeData.system_prompt;
        logger.info(`openai-chat: Using system prompt for rationality ID ${effectiveRationality}.`);
      } else {
        logger.warn(`openai-chat: System prompt for rationality ID ${effectiveRationality} is empty or not found. Using default.`);
      }
    } catch (e) {
      logger.error(`openai-chat: Error fetching system prompt for rationality ID ${effectiveRationality}. Using default. Error:`, e);
    }

    // Construct Static Context Preamble
    let staticContextPreamble = "User Profile Overview:\n";
    if (userName && userName.trim() !== "") staticContextPreamble += `- Name: ${userName}\n`;
    if (userAgeGroup && userAgeGroup.trim() !== "") staticContextPreamble += `- Age Group: ${userAgeGroup}\n`;
    if (userMainTopic && userMainTopic.trim() !== "") staticContextPreamble += `- Stated Main Topic of Interest: ${userMainTopic}\n`;
    if (userGoal && userGoal.trim() !== "") staticContextPreamble += `- Stated Goal: ${userGoal}\n`;
    
    if (dynamicProfile && dynamicProfile.trim() !== "") { 
      staticContextPreamble += `\nAI's Current Understanding of User (Dynamic Profile):\n${dynamicProfile}\n`;
    }
    if (mainPattern && mainPattern.trim() !== "") { 
      staticContextPreamble += `\nAI's Identified Main Cognitive Pattern for User:\n${mainPattern}\n`;
    }
    if (userRationalityPref) { // This is the user's preference from DB, not necessarily the one active for this session
      staticContextPreamble += `\nUser's Stated Rationality Preference Level in Profile: ${userRationalityPref}\n`;
    }
    staticContextPreamble += `\nRationality Level for this Session: ${effectiveRationality}\n`;

    // If preamble is only the header, consider it empty for practical purposes
    if (staticContextPreamble.trim() === "User Profile Overview:") {
        staticContextPreamble = ""; 
    }

    let staticPreambleTokens = 0;
    if (staticContextPreamble.trim() !== "") {
        try {
            // This is a rough estimate. For precise tokenization,
            // integrate the same tokenizer used in truncate-history here.
            staticPreambleTokens = tokenizer.encode(staticContextPreamble).bpe.length; 
            logger.debug(`Calculated staticPreambleTokens (cl100k_base): ${staticPreambleTokens}`);
        } catch (e) {
            logger.warn("Could not calculate tokens for static preamble using cl100k_base, estimating.", e);
            staticPreambleTokens = Math.ceil(staticContextPreamble.length / 3.5); // Fallback to rough estimate
        }
    }

    // Guardrail for combined static preamble and RAG context tokens
    const MAX_PREAMBLE_RAG_TOKENS = 800;
    let combinedPreambleRagTokens = staticPreambleTokens + ragContextTokens;

    if (combinedPreambleRagTokens > MAX_PREAMBLE_RAG_TOKENS) {
        logger.warn(`openai-chat: Combined static preamble (${staticPreambleTokens}) and RAG context (${ragContextTokens}) tokens (${combinedPreambleRagTokens}) exceed ${MAX_PREAMBLE_RAG_TOKENS}. Truncating RAG context.`);
        const overflowTokens = combinedPreambleRagTokens - MAX_PREAMBLE_RAG_TOKENS;
        let newRagContextTokens = ragContextTokens;

        // Attempt to truncate formattedRagContextText
        // This is a simplified truncation based on character ratio. 
        // For perfect accuracy, iterative tokenization and truncation would be needed.
        if (formattedRagContextText.trim() !== "" && ragContextTokens > 0) {
            const initialRagLength = formattedRagContextText.length;
            const estimatedCharsToCut = Math.ceil((overflowTokens / ragContextTokens) * initialRagLength);
            let cutChars = Math.min(initialRagLength, estimatedCharsToCut + 50); // Add a small buffer for safety in estimation
            
            formattedRagContextText = formattedRagContextText.substring(0, initialRagLength - cutChars);
            
            // Re-tokenize the truncated RAG context
            try {
                newRagContextTokens = tokenizer.encode(formattedRagContextText).bpe.length;
            } catch (e) {
                logger.warn("openai-chat: Error re-tokenizing truncated RAG context, using estimation.", e);
                newRagContextTokens = Math.ceil(formattedRagContextText.length / 3.5);
            }
            
            logger.info(`openai-chat: Truncated RAG context. Original chars: ${initialRagLength}, Cut chars approx: ${cutChars}, New RAG text length: ${formattedRagContextText.length}, New RAG tokens (estimated): ${newRagContextTokens}`);
            ragContextTokens = newRagContextTokens; // Update ragContextTokens
        }
        combinedPreambleRagTokens = staticPreambleTokens + ragContextTokens; // Recalculate
        logger.info(`openai-chat: After truncation, combined static preamble and RAG context tokens: ${combinedPreambleRagTokens}`);
    }

    try {
      logger.info("openai-chat: Invoking 'truncate-history' function...");
      const { data: truncationResult, error: truncationError } = await supabase.functions.invoke(
        'truncate-history',
        {
          body: {
            sessionId: sessionId,
            systemPromptText: systemPromptContent, // Now using the dynamic or fallback prompt
            currentUserMessageText: userMessageText,
            openAiModelName: selectedOpenAiModel,
            targetMaxOutputTokens: DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT, 
            ragContextBudgetTokens: staticPreambleTokens + ragContextTokens, // Pass combined (potentially reduced) preamble and RAG tokens as budget
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
        content: systemPromptContent, // This is the rationality-specific or fallback prompt
      },
    ];

    // IMPORTANT: Ensure tokenizer is available if not already globally scoped in this file.
    // If GPT3Tokenizer is not available here, this staticPreambleTokens calculation will fail.
    // Consider initializing it similar to how it's done in truncate-history/index.ts if not already done.
    // For this edit, I'm assuming 'tokenizer' instance IS available.
    if (!tokenizer) {
        logger.error("openai-chat: Tokenizer is not initialized. Cannot accurately calculate staticPreambleTokens or truncate RAG.");
        // Fallback or error handling if tokenizer is critical and missing
    } else {
        // Recalculate staticPreambleTokens with the available tokenizer for accuracy before sending to truncate-history
        if (staticContextPreamble.trim() !== "") {
            try {
                staticPreambleTokens = tokenizer.encode(staticContextPreamble).bpe.length;
            } catch (e) {
                logger.warn("openai-chat: Error re-calculating staticPreambleTokens before truncate-history call, using previous estimate.",e);
            }
        }
    }
    // The staticContextPreamble itself is NOT truncated. Only formattedRagContextText was.
    if (staticContextPreamble.trim() !== "") {
        messagesToOpenAI.push({ role: "system", content: staticContextPreamble });
    }
    if (formattedRagContextText.trim() !== "") {
        messagesToOpenAI.push({ role: "system", content: formattedRagContextText });
    }

    messagesToOpenAI.push(...truncatedHistoricalMessages);
    messagesToOpenAI.push({ role: "user", content: userMessageText }); 

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