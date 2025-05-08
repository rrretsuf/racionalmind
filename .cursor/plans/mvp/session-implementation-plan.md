# Rational Mind - Session & Context Integration Plan (MVP)

This plan outlines the steps required to implement the advanced session management, context/memory system, and RAG capabilities as defined in `@context-memory-feature.md`, replacing the basic `gemini-chat` functionality.

## Implementation Checklist

**Phase 1: Foundation & Core Structure**

*   [x] **Database Schema Overhaul:**
    *   [x] Define SQL migrations for `sessions`, `people`, `ai_knowledge`, `profiles` tables.
    *   [x] Add required text columns (e.g., `sessions.patterns`, `people.description`).
    *   [x] Add `vector(512)` embedding columns (`summary_embedding`, `patterns_embedding`, `name_embedding`, `knowledge_embedding`).
    *   [x] Create `ivfflat` indexes on all embedding columns using cosine distance.
    *   [x] Apply migrations to Supabase DB.
*   [x] **`gemini-chat` Edge Function Refactoring:**
    *   [x] Change function to accept POST requests with `{ session_id, user_id, text }`.
    *   [x] Implement input validation for `session_id`, `user_id`, `text`.
    *   [ ] Implement basic control flow: differentiate between first message and subsequent messages in a session.
    *   [x] Add basic error handling (invalid input, missing data, DB errors).
    *   [x] Stub out placeholder calls for fetching context and using Gemini SDK.
*   [x] Create openai-chat edge function
*   [x] Switch client to OpenAI streaming
*   [x] Remove Gemini chat function and dependencies

**Phase 2: Context & Caching**

*   [ ] **Static Context & Gemini SDK Caching:**
    *   [ ] Implement logic in `gemini-chat` to fetch static context (System Prompt, Static Profile, Dynamic Profile, Main Pattern) based on `user_id` and `avatar_name`.
    *   [x] Integrate Gemini SDK caching mechanism (`CachedContent`).
    *   [ ] Create `CachedContent` on the *first* message using static context.
    *   [ ] Ensure subsequent calls reference the cached content identifier.
*   [x] **Message Persistence:**
    *   [x] Implement logic in `gemini-chat` to insert user messages into the `messages` table.
    *   [x] Implement logic in `gemini-chat` to insert AI responses into the `messages` table.
    *   [x] Ensure messages are correctly linked to `session_id` and `user_id`.
    *   [x] Ensure messages include auto-generated embeddings.

**Phase 3: RAG Implementation**

*   [ ] **RAG Utility Functions:**
    *   [ ] Create shared `generateEmbedding(text)` function using Supabase AI (`gte-small`).
    *   [ ] Create `findRelevantSummaries(embedding, userId)` function (pgvector query on `sessions`).
    *   [ ] Create `findRelevantPatterns(embedding, userId)` function (pgvector query on `sessions.patterns_embedding`).
    *   [ ] Create `findRelevantPeople(messageText, userId, embedding)` function (name match + vector fallback on `people`).
    *   [ ] Create `findRelevantKnowledge(embedding, avatarName)` function (pgvector query on `ai_knowledge`).
*   [ ] **Integrate RAG into `gemini-chat`:**
    *   [ ] Call RAG utility functions on *subsequent* messages.
    *   [ ] Assemble the retrieved dynamic context.
    *   [ ] Pass dynamic context + user message to Gemini, referencing the `CachedContent`.

**Phase 4: Supporting Functions & Frontend**

*   [ ] **Supporting Edge Functions Verification:**
    *   [ ] Ensure `create-session` function correctly starts new sessions and triggers `process-session-end` for the previous one.
    *   [ ] Ensure `process-session-end` function performs async summary, pattern extraction, profile updates, and people management.
*   [ ] **Frontend - Session History Display:**
    *   [ ] **Backend:** Create mechanism (new Edge Function or direct Supabase client call via service) to fetch session list (from `sessions`) and messages for a selected session. Implement RLS.
    *   [ ] **Frontend:** Create `history.tsx` screen.
    *   [ ] **Frontend:** Implement UI to display the list of past sessions (summary, timestamp).
    *   [ ] **Frontend:** Implement navigation to a detail view showing messages for a selected session (read-only).

**Phase 5: Testing & Refinement**

*   [ ] **Testing:**
    *   [ ] Write Deno tests for RAG utility functions (accuracy, thresholds).
    *   [ ] Test `gemini-chat` logic (context assembly, cache hits/misses).
    *   [ ] Test `create-session` and `process-session-end` interactions.
    *   [ ] Manually test the end-to-end chat flow and history display.
*   [ ] **Refinement:**
    *   [ ] Tune RAG parameters (k, θ) based on testing.
    *   [ ] Optimize queries and function performance.
    *   [ ] Address any bugs or UX issues identified. 