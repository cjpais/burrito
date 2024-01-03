import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { FileMetadataSchema } from "../../../memory/files";
import { ChunkEmbeddings } from "./4.getChunkEmbeddings";
import { ChunkSummaries, ChunkSummariesSchema } from "./5.getChunkSummaries";

export const SummarySchema = FileMetadataSchema.extend({
  summary: z.string(),
});

export const SummarizedAudioSchema = ChunkSummariesSchema.merge(SummarySchema);

export type SummarizedAudio = z.infer<typeof SummarizedAudioSchema>;

export const generateSummaryStep: Step<ChunkSummaries, SummarizedAudio> = {
  name: "generateSummary",
  inputType: ChunkSummariesSchema,
  outputType: SummarizedAudioSchema,
  run: async (metadata) => {
    const summary = metadata.audio.chunks
      .map((chunk) => chunk.summary)
      .join("\n\n");
    return {
      ...metadata,
      summary,
    };
  },
};
