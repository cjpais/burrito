import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { generateCompletion } from "../../../cognition/openai";
import { findSimilar } from "../../../memory/vector";
import {
  ChunkEmbeddings,
  ChunkEmbeddingsSchema,
  ChunkWithEmbeddingSchema,
} from "./4.getChunkEmbeddings";
import { SummarizedAudioSchema } from "./7.generateSummary";
import { ChunkWithSummarySchema } from "./5.getChunkSummaries";

const InputSchema = z.object({
  hash: z.string(),
  summary: z.string(),
  audio: z.object({
    chunks: z.array(ChunkWithEmbeddingSchema.merge(ChunkWithSummarySchema)),
  }),
});

type Input = z.infer<typeof InputSchema>;

export const CompostSchema = InputSchema.extend({
  compost: z.string(),
});

export type CompostedAudio = z.infer<typeof CompostSchema>;

export const generateCompostStep: Step<Input, CompostedAudio> = {
  name: "generateCompost",
  inputType: InputSchema,
  outputType: CompostSchema,
  validate: async (metadata) => {
    return true;
  },
  run: async (metadata) => {
    const embeddings = metadata.audio.chunks.map((chunk) => chunk.embedding);
    const similar = await findSimilar(embeddings, 5, {
      hash: {
        $ne: metadata.hash,
      },
    });

    const summaries = [
      `First Text: ${metadata.summary}`,
      ...similar.map((item) => item.summary),
    ].join("\n\n");

    const compost = (await generateCompletion(
      "you are excellent at summarizing. think step by step. first figuring out the major themes in the first text. finding only related themes in the subsequent texts. then composing and summarizing those themes into a single text.",
      summaries
    )) as string;
    return {
      ...metadata,
      compost,
    };
  },
};
