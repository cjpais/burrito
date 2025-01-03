import { Step } from "../../../cognition/pipeline";
import z from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import {
  DESCRIBE_IMAGE_PROMPT_TEMPLATE,
  ImageDescription,
} from "../../../misc/prompts";
import { extractJSON } from "../../../cognition";
import Mustache from "mustache";
import { inference, VISION_MODELS } from "../../../cognition/inference";

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

const visionModelKeys = Object.keys(
  VISION_MODELS
) as (keyof typeof VISION_MODELS)[];

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

    const prompt = Mustache.render(DESCRIBE_IMAGE_PROMPT_TEMPLATE, {
      additional:
        typeof metadata.userData === "string"
          ? ` using the context provided by a person: ${metadata.userData}`
          : "",
    });

    const file = Bun.file(image);
    const mime = file.type;
    const buf = await file.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");

    const resp = await inference.see({
      model: "gpt4v",
      prompt,
      data: b64,
      mime,
    });

    const captions = await Promise.all(
      visionModelKeys.map(async (model) => {
	try {
        const resp = await inference.see({
          model,
          prompt:
            typeof metadata.userData === "string"
              ? `describe this image in detail using the context provided by a person: ${metadata.userData}`
              : "describe this image in detail",
          data: b64,
          mime,
        });
        return { model, resp };
	} catch (e) {
        return { model, resp: "error" };
	}

      })
    );

    // if failure, just return metadata as is (need to mark as failed)
    if (!resp) return metadata;
    const json = extractJSON<ImageDescription>(resp);
    if (!json) return metadata; // TODO retry here.

    const output = {
      ...metadata,
      caption: json.caption,
      description: json.description,
      extractedText: json.extractedText,
      imageCaptions: captions,
    };
    return output;
  },
};
