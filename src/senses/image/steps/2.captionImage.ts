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

const InputSchema = FileMetadataSchema.extend({
  compressed: z.string(),
});

const OutputSchema = InputSchema.extend({
  caption: z.string(),
  description: z.string(),
  extractedText: z.string().or(z.null()).optional(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const captionImageStep: Step<Input, Output> = {
  name: "captionImage",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // return false;
    return true;
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);
    const image = `${fileInfo.dir}/${metadata.compressed}`;

    const resp = await generateImageCompletion({
      prompt: DESCRIBE_IMAGE_PROMPT,
      image: image,
    });

    // if failure, just return metadata as is (need to mark as failed)
    if (!resp) return metadata;
    const json = extractJSON<ImageDescription>(resp);
    if (!json) return metadata; // TODO retry here.

    const output = {
      ...metadata,
      caption: json.caption,
      description: json.description,
      extractedText: json.extractedText,
    };
    return output;
  },
};
