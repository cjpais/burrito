import {
  OpenAIProvider,
  MistralProvider,
  TogetherProvider,
  WhisperCppProvider,
  createRateLimiter,
  VisionModel,
  TranscriptionModel,
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
  "gpt4",
  "gpt3.5",
  "mistral7b",
  "mixtral",
  "mistral-small",
  "mistral-medium",
  "mistral-large",
  "qwen1.5",
]);
export type ChatModels = z.infer<typeof ChatModelsEnum>;

const CHAT_MODELS: Record<ChatModels, ChatModel> = {
  gpt4: {
    name: "gpt4",
    providerModel: "gpt-4-0125-preview",
    provider: openai,
    rateLimiter: oaiChatLimiter,
  },
  "gpt3.5": {
    name: "gpt3.5",
    providerModel: "gpt-3.5-turbo-0125",
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
  "qwen1.5": {
    name: "qwen1.5",
    providerModel: "Qwen/Qwen1.5-72B-Chat",
    provider: together,
    rateLimiter: togetherLimiter,
  },
};

const VISION_MODELS: Record<string, VisionModel> = {
  gpt4v: {
    name: "gpt4v",
    providerModel: "gpt-4-vision-preview",
    provider: openai,
    rateLimiter: oaiChatLimiter,
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
