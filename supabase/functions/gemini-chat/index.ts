import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { logger } from "../_shared/logger.ts"; 

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  const errorMsg = "Missing GEMINI_API_KEY environment variable (must be set as a Supabase secret)";
  logger.error(errorMsg);
  throw new Error(errorMsg); 
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

console.log("Gemini Chat Function Initialized!");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const encodedMessages = url.searchParams.get('messages');
      if (!encodedMessages) {
        return new Response(JSON.stringify({ error: "Missing 'messages' query parameter." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let messages;
      try {
        const decodedJson = atob(decodeURIComponent(encodedMessages)); 
        messages = JSON.parse(decodedJson);
      } catch (e) {
         return new Response(JSON.stringify({ error: "Invalid or malformed 'messages' data." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!Array.isArray(messages)) {
         return new Response(JSON.stringify({ error: "'messages' parameter must be an array." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      logger.debug("Received messages via GET for chat", { count: messages.length });

      const generationConfig = {
        maxOutputTokens: 1024, 
      };
      const result = await model.generateContentStream({
        contents: messages,
        generationConfig: generationConfig,
      });

      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(new TextEncoder().encode('retry: 0\n\n')); 

            for await (const chunk of result.stream) {
              if (chunk.functionCalls?.()) {
                logger.warn("Received unexpected function call in chat stream", chunk.functionCalls());
              } else {
                  const text = chunk.text?.(); 
                  if (text) {
                    const sseChunk = `data: ${JSON.stringify({ text })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(sseChunk));
                  } 
              }
            }
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          } catch (streamError) {
             logger.error("Error during Gemini stream processing", streamError);
             try {
               const errorPayload = `data: ${JSON.stringify({ error: streamError.message || 'Stream processing error' })}\n\n`;
               controller.enqueue(new TextEncoder().encode(errorPayload));
             } catch (e) {}
             controller.error(streamError); 
          } finally {
            logger.info("Closing stream controller.");
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });

    } catch (error) {
      logger.error("Error in gemini-chat function before streaming", error);
      const status = error instanceof URIError || error.message.includes("Invalid") || error.message.includes("Missing") ? 400 : 500;
      return new Response(
        JSON.stringify({ error: error.message || "An unexpected error occurred" }),
        { 
          status: status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});