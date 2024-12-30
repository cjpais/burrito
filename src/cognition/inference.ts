import {
  OpenAIProvider,
  MistralProvider,
  TogetherProvider,
  WhisperCppProvider,
  createRateLimiter,
  VisionModel,
  TranscriptionModel,
  AnthropicProvider,
  EmbeddingModel,
  ChatModel,
  Inference,
} from "@cjpais/inference";
import { z } from "zod";

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
});
const oaiChatLimiter = createRateLimiter(150);
const oaiWhisperLimiter = createRateLimiter(1.5);

const anthropic = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
const anthropicLimiter = createRateLimiter(0.5);

const openrouter = new OpenAIProvider({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1",
});
const openrouterLimiter = createRateLimiter(100);

const together = new TogetherProvider({
  apiKey: process.env.TOGETHER_API_KEY!,
});
const togetherLimiter = createRateLimiter(90);

const mistral = new MistralProvider({
  apiKey: process.env.MISTRAL_API_KEY!,
});
const mistralLimiter = createRateLimiter(10);

const whisperCpp = new WhisperCppProvider({
  url: process.env.LOCAL_WHISPER_API_URL!,
});
const whisperCppLimiter = createRateLimiter(1);

export const ChatModelsEnum = z.enum([
  "tiny",
  "small",
  "mid",
  "expensive",
  "gpt4",
  "4o-mini",
  "mistral7b",
  "mixtral",
  "mistral-small",
  "mistral-medium",
  "mistral-large",
  "qwen2.5",
  "llama3-405b",
  "llama3-70b",
  "llama3-8b",
  "llama3-3b",
  "llama3-1b",
  "ministral-8b",
  "o1-mini",
  "4o",
  "qwq",
  "flash-r",
  "flash",
]);
export type ChatModels = z.infer<typeof ChatModelsEnum>;

const CHAT_MODELS: Record<ChatModels, ChatModel> = {
  tiny: {
    name: "llama3-1B",
    providerModel: "meta-llama/llama-3.2-1b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  small: {
    name: "ministral-8B",
    providerModel: "ministral-8b-2410",
    provider: mistral,
    rateLimiter: mistralLimiter,
  },
  mid: {
    name: "qwen2.5-72B",
    providerModel: "qwen/qwen-2.5-72b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  expensive: {
    name: "sonnet3.5",
    providerModel: "claude-3-5-sonnet-20240620",
    provider: anthropic,
    rateLimiter: anthropicLimiter,
  },
  // code: {},
  gpt4: {
    name: "gpt4",
    providerModel: "gpt-4-0125-preview",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "4o-mini": {
    name: "4o-mini",
    providerModel: "gpt-4o-mini",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "4o": {
    name: "4o",
    providerModel: "gpt-4o",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "o1-mini": {
    name: "o1-mini",
    providerModel: "o1-mini",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  mistral7b: {
    name: "mistral7b",
    providerModel: "mistralai/Mistral-7B-Instruct-v0.2",
    provider: together,
    rateLimiter: togetherLimiter,
  },
  mixtral: {
    name: "mixtral",
    providerModel: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    provider: together,
    rateLimiter: togetherLimiter,
  },
  "mistral-small": {
    name: "mistral-small",
    providerModel: "mistral-small-latest",
    provider: mistral,
    rateLimiter: mistralLimiter,
  },
  "mistral-medium": {
    name: "mistral-medium",
    providerModel: "mistral-medium-latest",
    provider: mistral,
    rateLimiter: mistralLimiter,
  },
  "mistral-large": {
    name: "mistral-large",
    providerModel: "mistral-large-latest",
    provider: mistral,
    rateLimiter: mistralLimiter,
  },
  "qwen2.5": {
    name: "qwen2.5-72B",
    providerModel: "qwen/qwen-2.5-72b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-405b": {
    name: "llama3-405B",
    providerModel: "meta-llama/llama-3.1-405b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-70b": {
    name: "llama3-70B",
    providerModel: "meta-llama/llama-3.1-70b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-8b": {
    name: "llama3-8B",
    providerModel: "meta-llama/llama-3.1-8b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-3b": {
    name: "llama3-3B",
    providerModel: "meta-llama/llama-3.2-3b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-1b": {
    name: "llama3-1B",
    providerModel: "meta-llama/llama-3.2-1b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "ministral-8b": {
    name: "ministral-8b",
    providerModel: "ministral-8b-2410",
    provider: mistral,
    rateLimiter: mistralLimiter,
  },
  qwq: {
    name: "qwq",
    providerModel: "qwen/qwq-32b-preview",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  flash: {
    name: "flash",
    providerModel: "google/gemini-2.0-flash-exp:free",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "flash-r": {
    name: "flash-r",
    providerModel: "google/gemini-2.0-flash-thinking-exp:free",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
};

export const VISION_MODELS: Record<string, VisionModel> = {
  gpt4v: {
    name: "gpt4v",
    providerModel: "gpt-4-vision-preview",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "4o": {
    name: "4o",
    providerModel: "gpt-4o",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "sonnet3.5": {
    name: "sonnet3.5",
    providerModel: "claude-3-5-sonnet-20240620",
    provider: anthropic,
    rateLimiter: anthropicLimiter,
  },
  "qwen2-72b-vl": {
    name: "qwen2-72b-vl",
    providerModel: "qwen/qwen-2-vl-72b-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-90b": {
    name: "llama3-90b",
    providerModel: "meta-llama/llama-3.2-90b-vision-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  "llama3-11b": {
    name: "llama3-11b",
    providerModel: "meta-llama/llama-3.2-11b-vision-instruct",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
  pixtral: {
    name: "pixtral",
    providerModel: "mistralai/pixtral-12b",
    provider: openrouter,
    rateLimiter: openrouterLimiter,
  },
};

export type VisionModels = "gpt4v";

const AUDIO_MODELS: Record<string, TranscriptionModel> = {
  "oai-whisper": {
    name: "oai-whisper",
    providerModel: "whisper-1",
    provider: openai,
    rateLimiter: oaiWhisperLimiter,
  },
  "local-whisper": {
    name: "local-whisper",
    providerModel: "whisper-large-v3.Q5", // this is ignored
    provider: whisperCpp,
    rateLimiter: whisperCppLimiter,
  },
};

export type AudioModels = "oai-whisper" | "local-whisper";

const EMBEDDING_MODELS: Record<string, EmbeddingModel> = {
  ada: {
    name: "ada",
    providerModel: "text-embedding-ada-002",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
};

export type EmbeddingModels = "ada";

export const inference = new Inference({
  chatModels: CHAT_MODELS,
  visionModels: VISION_MODELS,
  audioModels: AUDIO_MODELS,
  embeddingModels: EMBEDDING_MODELS,
});
