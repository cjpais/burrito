import { z } from "zod";
import {
  TranscribedAudioMetadata,
  TranscribedAudioMetadataSchema,
} from "./2.transcribeAudio";
import { Step, merge } from "../../../cognition/pipeline";

const FullTranscriptSchema = TranscribedAudioMetadataSchema.and(
  z.object({ audio: z.object({ transcript: z.string() }) })
);

export type FullTranscript = z.infer<typeof FullTranscriptSchema>;

export const getFullTranscriptStep: Step<
  TranscribedAudioMetadata,
  FullTranscript
> = {
  name: "getFullTranscript",
  inputType: TranscribedAudioMetadataSchema,
  outputType: FullTranscriptSchema,
  run: async (metadata, fileInfo) => {
    const transcript = metadata.audio.chunks
      .map((chunk) => chunk.transcript)
      .join(" ");

    // TODO this needs to be typesafe too.
    return merge(metadata, {
      audio: {
        transcript: transcript,
      },
    });
  },
};
