import { z } from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { Step } from "../../../cognition/pipeline";
import fs from "fs";
import { compressVideo } from "../../../external/ffmpeg";

const OutputSchema = FileMetadataSchema.extend({
  compressed: z.string(),
});

type Output = z.infer<typeof OutputSchema>;

const COMPRESSED_FILENAME = "compressed.mp4";

export const compressVideoStep: Step<FileMetadata, Output> = {
  name: "compressVideo",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // check that the file exists on the filesystem
    if (metadata.compressed !== COMPRESSED_FILENAME) return false;

    const fileInfo = await getFileInfo(metadata);

    return fs.existsSync(`${fileInfo.dir}/${COMPRESSED_FILENAME}`);
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const compressed = `${fileInfo.dir}/${COMPRESSED_FILENAME}`;
    await compressVideo(fileInfo.path, compressed);
    return {
      ...metadata,
      compressed: COMPRESSED_FILENAME,
    };
  },
};
