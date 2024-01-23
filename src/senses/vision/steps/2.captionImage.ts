import { Input } from "quicktype-core";
import { Step } from "../../../cognition/pipeline";
import z from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { generateImageCompletion } from "../../../cognition/openai";

const OutputSchema = z.object({
  caption: z.string(),
});

type Output = z.infer<typeof OutputSchema>;

export const captionImageStep: Step<FileMetadata, Output> = {
  name: "captionImage",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    return true;
  },
  run: async (metadata) => {
    const resp = await generateImageCompletion({
      image: metadata,
    });

    metadata.caption = resp;
    return metadata;
  },
};
