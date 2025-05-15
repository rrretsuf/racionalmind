import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { RAG_SESSIONS_LIMIT, RAG_PEOPLE_LIMIT, RAG_KNOWLEDGE_LIMIT } from "../_shared/constants.ts";

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, userMessageText, userMessageEmbedding, effectiveRationality } = await req.json();

    if (!userId || !userMessageText || !userMessageEmbedding || effectiveRationality === undefined || effectiveRationality === null) {
      return new Response(JSON.stringify({ error: "Missing required body parameters: userId, userMessageText, userMessageEmbedding, effectiveRationality" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logger.error("rag-dynamic-context: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    logger.info(`rag-dynamic-context: Processing RAG for userId: ${userId}, rationality: ${effectiveRationality}`);
    const ragResults: string[] = [];

    // RAG for Session Summaries & Patterns
    try {
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('match_session_summaries', {
          p_user_id: userId,
          p_query_embedding: userMessageEmbedding,
          p_match_limit: RAG_SESSIONS_LIMIT
        });
      
      if (summaryError) {
        logger.warn("rag-dynamic-context: Error fetching session summaries for RAG via RPC:", summaryError.message);
      } else if (summaryData && summaryData.length > 0) {
        summaryData.forEach(s => s.summary && ragResults.push(`[Past Session Summary]: ${s.summary}`));
      }

      const { data: patternsData, error: patternsError } = await supabase
        .rpc('match_session_patterns', {
          p_user_id: userId,
          p_query_embedding: userMessageEmbedding,
          p_match_limit: RAG_SESSIONS_LIMIT
        });

      if (patternsError) {
        logger.warn("rag-dynamic-context: Error fetching session patterns for RAG via RPC:", patternsError.message);
      } else if (patternsData && patternsData.length > 0) {
        patternsData.forEach(p => p.patterns && ragResults.push(`[Past Session Pattern]: ${p.patterns}`));
      }
    } catch (e) {
      logger.error("rag-dynamic-context: Exception during Session Summaries/Patterns RAG (RPC calls):", e);
    }

    // RAG for People Entities
    let personFoundByExactMatch = false;
    if (userMessageText && userMessageText.trim() !== "") {
        try {
            const nameTokens = userMessageText.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean);
            if (nameTokens.length > 0) {
                logger.debug(`rag-dynamic-context: Attempting exact name match for tokens: ${nameTokens.join(", ")}`);
                const { data: exactMatchPeople, error: exactMatchError } = await supabase
                    .from('people')
                    .select('name, description')
                    .eq('user_id', userId)
                    .in_('name_lowercase', nameTokens);

                if (exactMatchError) {
                    logger.warn("rag-dynamic-context: Error during exact name match for people:", exactMatchError.message);
                } else if (exactMatchPeople && exactMatchPeople.length === 1) {
                    const person = exactMatchPeople[0];
                    const personContext = person.name && person.description ? `${person.name}: ${person.description}` : person.description;
                    if (personContext) {
                        ragResults.push(`[Regarding People Mentioned]:\n${personContext}`);
                        personFoundByExactMatch = true;
                        logger.info(`rag-dynamic-context: Found one person by exact name match: ${person.name}`);
                    }
                } else if (exactMatchPeople && exactMatchPeople.length > 1) {
                    logger.info(`rag-dynamic-context: Found multiple people (${exactMatchPeople.length}) by exact name match. Will proceed to vector search for disambiguation.`);
                } else {
                    logger.info("rag-dynamic-context: No people found by exact name match.");
                }
            }
        } catch(e) {
            logger.error("rag-dynamic-context: Exception during People RAG (exact name match part):", e);
        }
    }

    if (!personFoundByExactMatch) {
        try {
            logger.debug("rag-dynamic-context: Performing vector search for people.");
            const { data: personVectorData, error: personVectorError } = await supabase
                .rpc('match_people_by_embedding', {
                    p_user_id: userId,
                    p_query_embedding: userMessageEmbedding,
                    p_match_limit: RAG_PEOPLE_LIMIT
                });
            if (personVectorError) {
                logger.warn("rag-dynamic-context: Error fetching people by vector for RAG via RPC:", personVectorError.message);
            } else if (personVectorData && personVectorData.length > 0) {
                const peopleContexts = personVectorData.map(p => p.name && p.description ? `${p.name}: ${p.description}` : p.description).filter(Boolean);
                if (peopleContexts.length > 0) {
                     ragResults.push(`[Regarding People Mentioned]:\n${peopleContexts.join('\n---\n')}`);
                }
            }
        } catch (e) {
            logger.error("rag-dynamic-context: Exception during People RAG (vector search part via RPC):", e);
        }
    }

    // RAG for AI Knowledge (Overthinking Domain)
    try {
      const { data: knowledgeRagData, error: knowledgeRagError } = await supabase
        .rpc('match_ai_knowledge', {
            p_effective_rationality_id: effectiveRationality,
            p_query_embedding: userMessageEmbedding,
            p_match_limit: RAG_KNOWLEDGE_LIMIT
        });
      
      if (knowledgeRagError) {
        logger.warn(`rag-dynamic-context: Error fetching AI knowledge for RAG (rationality ID ${effectiveRationality}):`, knowledgeRagError.message);
      } else if (knowledgeRagData && knowledgeRagData.length > 0) {
        knowledgeRagData.forEach(k => k.knowledge_text && ragResults.push(`[Relevant Info for Overthinking]: ${k.knowledge_text}`));
      }
    } catch (e) {
      logger.error("rag-dynamic-context: Exception during AI Knowledge RAG:", e);
    }

    let formattedRagContextText = "";
    let ragContextTokens = 0;

    if (ragResults.length > 0) {
      formattedRagContextText = "ADDITIONAL CONTEXT FROM YOUR HISTORY AND KNOWLEDGE BASE:\n" + ragResults.join("\n\n");
      try {
        ragContextTokens = Math.ceil(formattedRagContextText.length / 3.5);
        logger.debug(`rag-dynamic-context: Calculated ragContextTokens (estimated): ${ragContextTokens}`);
      } catch (e) {
        logger.warn("rag-dynamic-context: Could not calculate tokens for RAG context, defaulting to 0.", e);
        ragContextTokens = 0;
      }
    }
    
    return new Response(JSON.stringify({ formattedRagContextText, ragContextTokens }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("rag-dynamic-context: Unhandled error in request handler:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 