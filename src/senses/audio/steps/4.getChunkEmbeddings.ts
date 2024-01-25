import { z } from "zod";
import { generateEmbeddings } from "../../../cognition/openai";
import {
  TranscribedAudioMetadata,
  TranscribedAudioMetadataSchema,
  TranscribedChunkSchema,
} from "./2.transcribeAudio";
import { Step, merge } from "../../../cognition/pipeline";

export const ChunkWithEmbeddingSchema = TranscribedChunkSchema.extend({
  embedding: z.array(z.number()).length(1536),
});

export const ChunkEmbeddingsSchema = TranscribedAudioMetadataSchema.merge(
  z.object({
    audio: z.object({
      chunks: z.array(ChunkWithEmbeddingSchema),
    }),
  })
);

export type ChunkEmbeddings = z.infer<typeof ChunkEmbeddingsSchema>;

export const getChunkEmbeddingsStep: Step<
  TranscribedAudioMetadata,
  ChunkEmbeddings
> = {
  name: "getChunkEmbeddings",
  inputType: TranscribedAudioMetadataSchema,
  outputType: ChunkEmbeddingsSchema,
  run: async (metadata) => {
    const embeddings = await generateEmbeddings(
      metadata.audio.chunks.map((chunk) => chunk.transcript)
    );

    const chunkEmbeddings = metadata.audio.chunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    return merge(metadata, {
      audio: {
        chunks: chunkEmbeddings,
      },
    });
  },
};
