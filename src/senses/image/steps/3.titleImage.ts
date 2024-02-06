import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { generateCompletion } from "../../../cognition/openai";

const InputSchema = z.object({
  caption: z.string(),
  location: z.string().optional(),
});

const OutputSchema = InputSchema.extend({
  title: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const titleImageStep: Step<Input, Output> = {
  name: "titleImage",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // return false;
    return true;
  },
  run: async (metadata) => {
    const title = await generateCompletion({
      systemPrompt: `you are excellent at writing titles.å proivide a singular title for the text`,
      userPrompt: metadata.caption,
    });

    if (!title) return metadata;

    const output = {
      ...metadata,
      title,
    };
    return output;
  },
};
