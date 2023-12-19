import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { generateTranscriptions } from "../../../cognition/openai";
import {
  InitialAudioMetadata,
  InitialAudioMetadataSchema,
  InitialChunkSchema,
} from "./1.chunkAudio";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";

export const TranscribedChunkSchema = InitialChunkSchema.extend({
  transcript: z.string(),
});

export const TranscribedAudioMetadataSchema = FileMetadataSchema.extend({
  audio: z.object({
    durationSec: z.number(),
    chunkSizeSec: z.number(),
    chunks: z.array(TranscribedChunkSchema),
  }),
});

export type TranscribedAudioMetadata = z.infer<
  typeof TranscribedAudioMetadataSchema
> &
  InitialAudioMetadata;

export const transcribeChunksStep: Step<
  InitialAudioMetadata,
  TranscribedAudioMetadata
> = {
  name: "transcribeChunks",
  inputType: InitialAudioMetadataSchema,
  outputType: TranscribedAudioMetadataSchema,
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const transcriptions = await generateTranscriptions(
      metadata.audio.chunks.map((chunk) => `${fileInfo.dir}/${chunk.filename}`)
    );

    const transcribedChunks = metadata.audio.chunks.map((chunk, i) => ({
      ...chunk,
      transcript: transcriptions[i],
    }));

    return merge(metadata, {
      audio: {
        chunks: transcribedChunks,
      },
    });
  },
};
