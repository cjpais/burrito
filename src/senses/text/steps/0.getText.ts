import { z } from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { Step, merge } from "../../../cognition/pipeline";

const OutputSchema = FileMetadataSchema.extend({
  text: z.string(),
});

type Output = z.infer<typeof OutputSchema>;

export const getTextStep: Step<FileMetadata, Output> = {
  name: "getText",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const text = await Bun.file(fileInfo.path).text();
    return merge(metadata, { text });
  },
};
