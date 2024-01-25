import { Step } from "../../../cognition/pipeline";
import { divide, add } from "mathjs";
import { ChunkEmbeddings, ChunkEmbeddingsSchema } from "./4.getChunkEmbeddings";
import { z } from "zod";
import { TranscribedAudioMetadataSchema } from "./2.transcribeAudio";

export const EmbeddingSchema = TranscribedAudioMetadataSchema.extend({
  embedding: z.array(z.number()).length(1536),
});

type Embedding = z.infer<typeof EmbeddingSchema>;

export const combineEmbeddingsStep: Step<ChunkEmbeddings, Embedding> = {
  name: "combineEmbeddings",
  inputType: ChunkEmbeddingsSchema,
  outputType: EmbeddingSchema,
  run: async (metadata) => {
    const embeddings = metadata.audio.chunks.map((chunk) => chunk.embedding);
    const combined = divide(
      embeddings.reduce((a, b) => add(a, b)),
      embeddings.length
    ) as number[];

    return {
      ...metadata,
      embedding: combined,
    };
  },
};
