import { z } from "zod";
import { generateEmbeddings } from "../../../cognition/openai";
import {
  TranscribedAudioMetadata,
  TranscribedAudioMetadataSchema,
  TranscribedChunkSchema,
} from "./2.transcribeAudio";
import { Step, merge } from "../../../cognition/pipeline";
import { summarize } from "../../../cognition";

export const ChunkWithSummarySchema = TranscribedChunkSchema.extend({
  summary: z.string(),
});

export const ChunkSummariesSchema = TranscribedAudioMetadataSchema.merge(
  z.object({
    audio: z.object({
      chunks: z.array(ChunkWithSummarySchema),
    }),
  })
);

export type ChunkSummaries = z.infer<typeof ChunkSummariesSchema>;

export const getChunkSummariesStep: Step<
  TranscribedAudioMetadata,
  ChunkSummaries
> = {
  name: "getChunkSummaries",
  inputType: TranscribedAudioMetadataSchema,
  outputType: ChunkSummariesSchema,
  validate: async (metadata) => {
    // return false;
    return true;
  },
  run: async (metadata) => {
    const transcripts = metadata.audio.chunks.map((chunk) => chunk.transcript);
    const promises = transcripts.map((transcript) => summarize(transcript));
    const summaries = await Promise.all(promises);

    const chunkSummaries = metadata.audio.chunks.map((chunk, i) => ({
      ...chunk,
      summary: summaries[i],
    }));

    return merge(metadata, {
      audio: {
        chunks: chunkSummaries,
      },
    });
  },
};
