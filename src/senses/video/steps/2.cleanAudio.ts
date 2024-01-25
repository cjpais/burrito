import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";
import fs from "fs";
import { cleanAudio } from "../../../external/ffmpeg";

const InputSchema = FileMetadataSchema.extend({
  audioTrack: z.string(),
});

const OutputSchema = InputSchema.extend({
  audio: z.object({
    cleanedFile: z.string(),
  }),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

const CLEANED_AUDIO_FILENAME = "clean.mp3";

export const cleanAudioStep: Step<Input, Output> = {
  name: "cleanAudio",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    return fs.existsSync(metadata.audio.cleanedFile);
  },
  // TODO this needs to accept a param of what file (metadata item) to clean
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const inputFile = `${fileInfo.dir}/${metadata.audioTrack}`;
    const ouputFile = `${fileInfo.dir}/${CLEANED_AUDIO_FILENAME}`;
    await cleanAudio(inputFile, ouputFile);
    metadata = merge(metadata, {
      audio: {
        cleanedFile: ouputFile,
      },
    });
    return metadata;
  },
};
