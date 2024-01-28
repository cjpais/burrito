import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { collection, embed } from "../../../memory/vector";
import { generateEmbeddings } from "../../../cognition/openai";

const InputSchema = z.object({
  hash: z.string(),
  text: z.string(),
  summary: z.string(),
});

const OutputSchema = InputSchema.extend({
  embedding: z.array(z.number()).length(1536),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const embedTextStep: Step<Input, Output> = {
  name: "embedText",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
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
  run: async (metadata: Input): Promise<Output> => {
    let embedding;
    if (metadata.text.length > 2000) {
      // embed summary
      embedding = await generateEmbeddings([metadata.summary]);
    } else {
      // embed text
      embedding = await generateEmbeddings([metadata.text]);
    }

    await embed(
      [metadata.text],
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
