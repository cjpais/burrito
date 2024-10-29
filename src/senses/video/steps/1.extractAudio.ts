import { z } from "zod";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";
import { Step } from "../../../cognition/pipeline";
import fs from "fs";
import { extractAudio } from "../../../external/ffmpeg";

const InputSchema = FileMetadataSchema.extend({
  compressed: z.string(),
});

const OutputSchema = FileMetadataSchema.extend({
  compressed: z.string(),
  audioTrack: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

const AUDIO_TRACK_FILENAME = "audio.mp3";

export const extractAudioStep: Step<Input, Output> = {
  name: "extractAudio",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // check that the file exists on the filesystem
    if (metadata.audioTrack !== AUDIO_TRACK_FILENAME) return false;

    const fileInfo = await getFileInfo(metadata);

    return fs.existsSync(`${fileInfo.dir}/${AUDIO_TRACK_FILENAME}`);
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const audioTrack = `${fileInfo.dir}/${AUDIO_TRACK_FILENAME}`;
    const compressedVideo = `${fileInfo.dir}/${metadata.compressed}`;

    try {
      await extractAudio(compressedVideo, audioTrack);
    } catch {
      console.error("Error extracting audio");
      return { ...metadata };
    }
    return {
      ...metadata,
      audioTrack: AUDIO_TRACK_FILENAME,
    };
  },
};
