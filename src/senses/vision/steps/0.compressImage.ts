import { z } from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { Step } from "../../../cognition/pipeline";
import fs from "fs";
import { compressImage } from "../../../external/ffmpeg";

const OutputSchema = FileMetadataSchema.extend({
  compressed: z.string(),
});

type Output = z.infer<typeof OutputSchema>;

export const compressImageStep: Step<FileMetadata, Output> = {
  name: "compressImage",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // check that the file exists on the filesystem
    if (metadata.compressed !== "compressed.jpg") return false;

    const fileInfo = await getFileInfo(metadata);

    return fs.existsSync(`${fileInfo.dir}/compressed.jpg`);
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const compressed = `${fileInfo.dir}/compressed.jpg`;
    await compressImage(fileInfo.path, compressed);
    return {
      ...metadata,
      compressed: "compressed.jpg",
    };
  },
};
