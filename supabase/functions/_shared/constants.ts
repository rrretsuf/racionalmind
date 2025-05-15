export const CHAT_MODEL_PAYING = "o4-mini-2025-04-16";
export const CHAT_MODEL_FREE = "gpt-4o-mini-2024-07-18";

export const EMBEDDING_MODEL_NAME = 'gte-small';

export const MESSAGE_OVERHEAD_TOKENS = 4;
export const MODEL_CONTEXT_WINDOWS: { [key: string]: number } = {
  [CHAT_MODEL_PAYING]: 100000,
  [CHAT_MODEL_FREE]: 64000,
};
export const DEFAULT_MODEL_CONTEXT_WINDOW = 64000;

export const DEFAULT_TARGET_MAX_OUTPUT_TOKENS_CHAT = 300;
export const DEFAULT_RAG_CONTEXT_BUDGET_TOKENS = 0;
export const DEFAULT_SAFETY_BUFFER_TOKENS = 250;

export const PROCESSING_MAX_TOKENS = 1024;

export const RAG_SESSIONS_LIMIT = 3;
export const RAG_PEOPLE_LIMIT = 2;
export const RAG_KNOWLEDGE_LIMIT = 2;