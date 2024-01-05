import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";
import { cleanAudio } from "../../../external/ffmpeg";
import fs from "fs";

export const CleanAudioSchema = FileMetadataSchema.extend({
  audio: z.object({
    cleanedFile: z.string(),
  }),
});

export type CleanAudio = z.infer<typeof CleanAudioSchema>;

export const cleanAudioStep: Step<
  z.infer<typeof FileMetadataSchema & any>,
  CleanAudio
> = {
  name: "cleanAudio",
  inputType: FileMetadataSchema,
  outputType: CleanAudioSchema,
  validate: async (metadata) => {
    return fs.existsSync(metadata.audio.cleanedFile);
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const ouputFile = `${fileInfo.dir}/clean.${fileInfo.ext}`;
    await cleanAudio(fileInfo.path, ouputFile);
    metadata = merge(metadata, {
      audio: {
        cleanedFile: ouputFile,
      },
    });
    return metadata;
  },
};
