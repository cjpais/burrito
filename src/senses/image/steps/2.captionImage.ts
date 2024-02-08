import { Input } from "quicktype-core";
import { Step } from "../../../cognition/pipeline";
import z from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { generateImageCompletion } from "../../../cognition/openai";
import { DESCRIBE_IMAGE_PROMPT, ImageDescription } from "../../../misc/prompts";
import { extractJSON } from "../../../cognition";

const OutputSchema = FileMetadataSchema.extend({
  caption: z.string(),
  description: z.string(),
  extractedText: z.string().or(z.null()).optional(),
});

type Output = z.infer<typeof OutputSchema>;

export const captionImageStep: Step<FileMetadata, Output> = {
  name: "captionImage",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // return false;
    return true;
  },
  run: async (metadata) => {
    let caption = "";
    let description = "";
    let extractedText = "";
    const resp = await generateImageCompletion({
      prompt: DESCRIBE_IMAGE_PROMPT,
      image: metadata,
    });

    // if failure, just return metadata as is (need to mark as failed)
    // if (!resp) return metadata;
    if (resp) {
      const json = extractJSON<ImageDescription>(resp);
      caption = json?.caption ?? "";
      description = json?.description ?? "";
      extractedText = json?.extractedText ?? "";
    }
    // if (!json) return metadata; // TODO retry here.

    const output = {
      ...metadata,
      caption,
      description,
      extractedText,
    };
    return output;
  },
};
