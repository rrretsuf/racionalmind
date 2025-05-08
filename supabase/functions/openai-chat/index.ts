import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; 
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = "o4-mini-2025-04-16";

// Helper: Custom TransformStream to parse OpenAI SSE and format for client
class OpenAIStreamParser extends TransformStream<string, Uint8Array> {
  private accumulatedData = "";
  private encoder = new TextEncoder();

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
                const clientSseMsg = `data: ${JSON.stringify({ text: deltaContent })}\n\n`;
                controller.enqueue(this.encoder.encode(clientSseMsg));
              }
              // Handle other potential data structures if needed (e.g., finish_reason)
              // else if (parsed.choices?.[0]?.finish_reason) {
              //   console.log("Finish Reason:", parsed.choices[0].finish_reason);
              // }

            } catch (e) {
              console.error("Error parsing OpenAI JSON chunk:", e, "Chunk content:", dataContent);
              // Send an error chunk to the client
              const errorMsg = `data: ${JSON.stringify({ error: "Error processing stream data" })}\n\n`;
              try { controller.enqueue(this.encoder.encode(errorMsg)); } catch (enqueueError) { console.error("Failed to enqueue parse error:", enqueueError); }
            }
          } else if (line.trim()) {
             // Log lines that don't start with 'data: ' but are not empty
             console.warn("Received non-data line from OpenAI:", line);
          }
        }
      },
    });
  }
}


serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response('ok', { headers: corsHeaders });
  }
  console.log(`Received ${req.method} request`);

  try {
    // --- Authentication & Parameter Validation ---.
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const sessionId = url.searchParams.get("session_id");
    const userMessageText = url.searchParams.get("text");

    // Validate required parameters
     if (!userMessageText || !sessionId || !userId) {
       const missingParams = [
         !userMessageText && "text",
         !sessionId && "session_id",
         !userId && "user_id"
       ].filter(Boolean).join(", ");

       console.error(`Request missing parameters: ${missingParams}`);
       return new Response(JSON.stringify({ error: `Missing required query parameters: ${missingParams}` }), {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     console.log(`Processing request: user_id=${userId}, session_id=${sessionId}`);


    // --- OpenAI Key Check ---
    if (!OPENAI_API_KEY) {
      console.error('FATAL: Missing OPENAI_API_KEY environment variable.');
      return new Response(JSON.stringify({ error: "Server configuration error: OpenAI API key not set." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TODO: Implement Chat History & RAG Context Retrieval ---
    // Fetch history/context based on userId and sessionId BEFORE constructing messages
    // const messagesToOpenAI = await constructMessagesWithHistory(userId, sessionId, userMessageText);
    console.log("Skipping history/RAG lookup for now."); // Placeholder log

    // --- Construct OpenAI Request ---
    const messages = [
      {
        role: "system",
        content: "You are a helpful AI assistant. Your name is Rational Mind. You are designed to help users explore and manage thoughts that lead to overthinking, and promote self-understanding and mental clarity. You should be supportive and act as an \"Overthinking Buddy\".",
      },
      { role: "user", content: userMessageText },
    ];

    const openaiPayload = {
      model: OPENAI_MODEL,
      messages: messages,
      stream: true,
      max_completion_tokens: 300,
    };
    console.log("Sending payload to OpenAI:", JSON.stringify(openaiPayload, null, 2));


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
    console.log(`OpenAI response status: ${openaiResponse.status}`);


    // --- Handle OpenAI Errors ---
     if (!openaiResponse.ok || !openaiResponse.body) {
       const errorBodyText = await openaiResponse.text();
       console.error("OpenAI API Error:", { status: openaiResponse.status, statusText: openaiResponse.statusText, body: errorBodyText });
       let errorDetail = errorBodyText;
       try {
         errorDetail = JSON.parse(errorBodyText);
        } catch {
          console.warn("OpenAI error response body was not valid JSON.");
        }

       return new Response(JSON.stringify({ error: "OpenAI API request failed", details: errorDetail }), {
         status: openaiResponse.status,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }

    // --- Pipe the Stream ---
    console.log("OpenAI request successful, starting stream piping...");
    const stream = openaiResponse.body
      .pipeThrough(new TextDecoderStream()) 
      .pipeThrough(new OpenAIStreamParser()) 
      .pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
        flush(controller) {
          console.log("Source stream ended, flushing final client [DONE] marker.");
          try {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          } catch (e) {
             console.error("Error enqueuing final [DONE] in flush:", e);
          }
        }
      }));


    // --- Return SSE Response ---
    console.log("Returning SSE stream to client.");
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
    console.error("Unhandled error in Edge Function main try-catch:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});