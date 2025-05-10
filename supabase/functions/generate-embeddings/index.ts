import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { EMBEDDING_MODEL_NAME } from "../_shared/constants.ts";

declare const Supabase: any;

let embeddingModel: any;
try {
  embeddingModel = new Supabase.ai.Session(EMBEDDING_MODEL_NAME);
  logger.info(`generate-embeddings: Supabase.ai.Session('${EMBEDDING_MODEL_NAME}') initialized successfully.`);
} catch (e) {
  logger.error("generate-embeddings: FATAL - Failed to initialize Supabase.ai.Session:", e);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!embeddingModel) {
        logger.error("generate-embeddings: Embedding model is not initialized. Cannot process request.");
        return new Response(JSON.stringify({ error: "Embedding model not initialized" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { input } = await req.json();

    if (!input || typeof input !== 'string' || input.trim() === "") {
      logger.error("generate-embeddings: Missing or invalid 'input' in request body. Must be a non-empty string.");
      return new Response(JSON.stringify({ error: "Missing or invalid 'input' in request body. Must be a non-empty string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logger.debug(`generate-embeddings: Received text for embedding (first 50 chars): "${input.substring(0, 50)}"`);

    const embedding = await embeddingModel.run(input, {
      mean_pool: true,
      normalize: true,
    });

    logger.info("generate-embeddings: Embedding generated successfully.");
    return new Response(JSON.stringify({ embedding }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logger.error("generate-embeddings: Error processing request:", error.message, error.stack ? error.stack : "No stack available");
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});