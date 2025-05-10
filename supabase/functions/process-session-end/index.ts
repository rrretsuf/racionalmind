import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import { corsHeaders } from "../_shared/cors.ts"
import { logger } from "../_shared/logger.ts"
import {
  SUMMARY_SYSTEM_PROMPT,
  PATTERNS_SYSTEM_PROMPT,
  DYNAMIC_PROFILE_SYSTEM_PROMPT,
  MAIN_PATTERN_SYSTEM_PROMPT,
  PEOPLE_EXTRACTION_SYSTEM_PROMPT
} from "./static/prompts.ts"
import {
    CHAT_MODEL_PAYING,
    CHAT_MODEL_FREE,
    PROCESSING_MAX_TOKENS
} from "../_shared/constants.ts";

const INSUFFICIENT_DATA_SUMMARY = "Insufficient data for meaningful summary.";
const NO_SIGNIFICANT_PATTERNS = "No significant patterns identified from this session.";
const NO_PROFILE_UPDATE_WARRANTED = "No update to dynamic profile warranted based on this session.";
const MAIN_PATTERN_INCONCLUSIVE = "Main pattern assessment inconclusive from this session.";

interface Profile {
  id: string;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  tier: "free" | "paying"; 
  onboarding_responses: Record<string, any> | null;
  dynamic_profile: string | null;
  main_pattern: string | null;
}

interface Message {
  id: string;
  session_id: string;
  user_id: string;
  sender_role: "user" | "ai" | "system";
  content_text: string | null;
  content_embedding: any | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

interface Session {
  id: string;
  user_id: string;
  num: number;
  status: "active" | "completed" | "error";
  started_at: string;
  updated_at: string | null;
  summary: string | null;
  summary_embedding: any | null;
  patterns: string | null;
  patterns_embedding: any | null;
  metadata: Record<string, any> | null;
}

interface Person {
  name: string;
  description: string;
}

async function callOpenAI(
  promptTemplate: string,
  variables: Record<string, string>,
  model: string,
  openAiKey: string
): Promise<string> {
  const filledPrompt = Object.entries(variables).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    promptTemplate
  );
  const messages = [
    { role: "system", content: filledPrompt },
  ];

  const body = {
    model: model,
    messages: messages,
    max_tokens: PROCESSING_MAX_TOKENS,
    temperature: 0.2,
  };

  logger.debug(`Calling OpenAI with model: ${model}, prompt (first 100 chars): ${filledPrompt.substring(0,100)}`);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`OpenAI API request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
    logger.error("OpenAI response missing expected content:", data);
    throw new Error("Invalid response structure from OpenAI.");
  }
  return data.choices[0].message.content.trim();
}

async function generateEmbedding(
  text: string,
  supabaseClient: SupabaseClient,
  functionName: string = 'generate-embeddings'
): Promise<number[] | null> {
  if (!text || text.trim() === "") {
    logger.warn("generateEmbedding called with empty text. Returning null.");
    return null;
  }
  try {
    const { data, error } = await supabaseClient.functions.invoke(functionName, {
      body: { input: text },
    });
    if (error) {
      logger.error(`Error invoking ${functionName} function:`, error);
      return null;
    }
    if (data && data.embedding && Array.isArray(data.embedding)) {
      return data.embedding;
    } else {
      logger.error(`Invalid response from ${functionName} function:`, data);
      return null;
    }
  } catch (e) {
    logger.error(`Unexpected error calling ${functionName} function:`, e);
    return null;
  }
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  logger.info("process-session-end function invoked.");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !openAiKey) {
      logger.error("Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY");
      return new Response(JSON.stringify({ error: "Internal server configuration error." }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { session_id, user_id } = await req.json();

    if (!session_id || !user_id) {
      logger.error("Missing session_id or user_id in request body.");
      return new Response(JSON.stringify({ error: "session_id and user_id are required." }), { status: 400, headers: corsHeaders });
    }

    logger.info(`Processing session end for session_id: ${session_id}, user_id: ${user_id}`);

    // --- Fetch user tier ---
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('tier, dynamic_profile, main_pattern')
      .eq('id', user_id)
      .single<Profile>();

    if (profileError || !profileData) {
      logger.error(`Failed to fetch profile for user_id ${user_id}:`, profileError);
      return new Response(JSON.stringify({ error: "Failed to fetch user profile." }), { status: 500, headers: corsHeaders });
    }
    const userTier = profileData.tier;
    const currentDynamicProfile = profileData.dynamic_profile || "";
    const currentMainPattern = profileData.main_pattern || "";
    const selectedModel = userTier === 'paying' ? CHAT_MODEL_PAYING : CHAT_MODEL_FREE;
    logger.info(`User tier: ${userTier}, Selected AI model: ${selectedModel}`);

    // --- Fetch session messages ---
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('sender_role, content_text')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true }) as { data: Message[] | null, error: any };


    if (messagesError) {
      logger.error(`Failed to fetch messages for session_id ${session_id}:`, messagesError);
      return new Response(JSON.stringify({ error: "Failed to fetch session messages." }), { status: 500, headers: corsHeaders });
    }

    if (!messagesData || messagesData.length === 0) {
      logger.info(`No messages found for session_id ${session_id}. Skipping AI processing.`);
      await supabase.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session_id);
      return new Response(JSON.stringify({ message: "No messages in session, processing skipped." }), { status: 200, headers: corsHeaders });
    }

    const chatHistoryText = messagesData
      .map(msg => `${msg.sender_role === 'user' ? 'User' : 'AI'}: ${msg.content_text}`)
      .join("\n");

    // --- AI Processing Steps ---
    let newSessionSummary: string | null = null;
    let newSessionPatterns: string | null = null;

    // --- Generate Session Summary ---
    try {
      logger.info("Generating session summary...");
      const summaryText = await callOpenAI(SUMMARY_SYSTEM_PROMPT, { chat_history: chatHistoryText }, selectedModel, openAiKey);
      if (summaryText !== INSUFFICIENT_DATA_SUMMARY) {
        newSessionSummary = summaryText;
        const summaryEmbedding = await generateEmbedding(newSessionSummary, supabase);
        await supabase
          .from('sessions')
          .update({ summary: newSessionSummary, summary_embedding: summaryEmbedding })
          .eq('id', session_id);
        logger.info("Session summary generated and saved.");
      } else {
        logger.info("Insufficient data for session summary.");
        await supabase.from('sessions').update({ summary: null, summary_embedding: null }).eq('id', session_id);
      }
    } catch (e) {
      logger.error("Error generating session summary:", e);
    }

    // --- Extract Session Patterns ---
    try {
      logger.info("Extracting session patterns...");
      const patternsText = await callOpenAI(PATTERNS_SYSTEM_PROMPT, { chat_history: chatHistoryText }, selectedModel, openAiKey);
      if (patternsText !== NO_SIGNIFICANT_PATTERNS) {
        newSessionPatterns = patternsText;
        const patternsEmbedding = await generateEmbedding(newSessionPatterns, supabase);
        await supabase
          .from('sessions')
          .update({ patterns: newSessionPatterns, patterns_embedding: patternsEmbedding })
          .eq('id', session_id);
        logger.info("Session patterns extracted and saved.");
      } else {
        logger.info("No significant patterns identified for this session.");
         await supabase.from('sessions').update({ patterns: null, patterns_embedding: null }).eq('id', session_id);
      }
    } catch (e) {
      logger.error("Error extracting session patterns:", e);
    }

    // --- Update Dynamic Profile (conditionally) ---
    if (newSessionSummary || newSessionPatterns) {
      try {
        logger.info("Attempting to update dynamic profile...");
        const dynamicProfileUpdateText = await callOpenAI(
          DYNAMIC_PROFILE_SYSTEM_PROMPT,
          {
            existing_dynamic_profile: currentDynamicProfile,
            existing_main_pattern: currentMainPattern,
            new_session_summary: newSessionSummary || "Not available.",
            new_session_patterns: newSessionPatterns || "Not available."
          },
          selectedModel,
          openAiKey
        );
        if (dynamicProfileUpdateText !== NO_PROFILE_UPDATE_WARRANTED) {
          await supabase
            .from('profiles')
            .update({ dynamic_profile: dynamicProfileUpdateText })
            .eq('id', user_id);
          logger.info("Dynamic profile updated.");
        } else {
          logger.info("Dynamic profile update not warranted for this session.");
        }
      } catch (e) {
        logger.error("Error updating dynamic profile:", e);
      }
    } else {
        logger.info("Skipping dynamic profile update as no new summary or patterns were generated.");
    }


    // --- Update Main Pattern (conditionally) ---
    const { data: potentiallyUpdatedProfileData, error: pUPDError } = await supabase
        .from('profiles')
        .select('dynamic_profile')
        .eq('id', user_id)
        .single<{dynamic_profile: string | null}>();

    const dynamicProfileForMainPattern = (pUPDError || !potentiallyUpdatedProfileData) ? currentDynamicProfile : (potentiallyUpdatedProfileData.dynamic_profile || "");


    if (newSessionSummary || newSessionPatterns) {
      try {
        logger.info("Attempting to update main pattern...");
        const mainPatternUpdateText = await callOpenAI(
          MAIN_PATTERN_SYSTEM_PROMPT,
          {
            current_dynamic_profile: dynamicProfileForMainPattern,
            existing_main_pattern: currentMainPattern,
            new_session_summary: newSessionSummary || "Not available.",
            new_session_patterns: newSessionPatterns || "Not available."
          },
          selectedModel,
          openAiKey
        );
        if (mainPatternUpdateText !== MAIN_PATTERN_INCONCLUSIVE) {
          await supabase
            .from('profiles')
            .update({ main_pattern: mainPatternUpdateText })
            .eq('id', user_id);
          logger.info("Main pattern updated.");
        } else {
          logger.info("Main pattern assessment inconclusive for this session.");
        }
      } catch (e) {
        logger.error("Error updating main pattern:", e);
      }
    } else {
        logger.info("Skipping main pattern update as no new summary or patterns were generated.");
    }

    // --- Extract People ---
    try {
      logger.info("Extracting people mentioned in session...");
      const peopleJsonString = await callOpenAI(PEOPLE_EXTRACTION_SYSTEM_PROMPT, { chat_history: chatHistoryText }, selectedModel, openAiKey);
      const peopleList = JSON.parse(peopleJsonString) as Person[];

      if (Array.isArray(peopleList) && peopleList.length > 0) {
        for (const person of peopleList) {
          if (person.name && person.description) {
            const nameEmbedding = await generateEmbedding(person.name, supabase);
            const { error: upsertError } = await supabase
              .from('people')
              .upsert({
                user_id: user_id,
                name: person.name,
                name_lowercase: person.name.toLowerCase(),
                description: person.description,
                name_embedding: nameEmbedding
              }, { onConflict: 'user_id, name_lowercase' });

            if (upsertError) {
              logger.error(`Error upserting person "${person.name}":`, upsertError);
            } else {
              logger.info(`Person "${person.name}" upserted.`);
            }
          }
        }
      } else {
        logger.info("No people extracted or empty list returned.");
      }
    } catch (e) {
      logger.error("Error extracting or processing people:", e);
      if (e instanceof SyntaxError) {
        logger.error("Failed to parse JSON from people extraction.", e.message)
      }
    }
    
    // --- Mark Session as Completed ---
    await supabase
      .from('sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', session_id);

    logger.info(`Session ${session_id} processing complete.`);
    return new Response(JSON.stringify({ success: true, message: "Session processed." }), { status: 200, headers: corsHeaders });

  } catch (error) {
    logger.error("Unhandled error in process-session-end:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
})
