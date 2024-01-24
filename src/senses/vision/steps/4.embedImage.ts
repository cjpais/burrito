import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { collection, embed } from "../../../memory/vector";
import { generateEmbeddings } from "../../../cognition/openai";

const InputSchema = z.object({
  description: z.string(),
  hash: z.string(),
});

const OutputSchema = InputSchema.extend({
  embedding: z.array(z.number()).length(1536),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const embedImageStep: Step<Input, Output> = {
  name: "embedImage",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    const result = await collection.get({ ids: [metadata.hash] });
    if (result.ids.length !== 1) {
      return false;
    }
    return true;
  },
  run: async (metadata) => {
    const embedding = await generateEmbeddings([metadata.description]);
    await embed([metadata.description], [metadata.hash], [{}], embedding);

    return {
      ...metadata,
      embedding: embedding[0],
    };
  },
};
