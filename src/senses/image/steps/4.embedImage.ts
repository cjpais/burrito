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
    // return false;
    // remove existing embeddings and update them
    // collection.delete({ ids: [metadata.hash] });

    const idResult = await collection.get({ ids: [metadata.hash] });
    if (idResult.ids.length !== 1) {
      return false;
    }

    const metadataResult = await collection.get({
      where: { hash: metadata.hash },
    });
    if (metadataResult.ids.length !== 1) {
      return false;
    }

    return true;
  },
  run: async (metadata) => {
    // TODO remove the concept of "image" from the embedding
    const embedding = await generateEmbeddings([metadata.description]);
    await embed(
      [metadata.description],
      [metadata.hash],
      [{ hash: metadata.hash }],
      embedding
    );

    return {
      ...metadata,
      embedding: embedding[0],
    };
  },
};
