import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { inference } from "../../../cognition/inference";

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
    const title = await inference.chat({
      systemPrompt: `you are excellent at writing titles. proivide a singular title for the text`,
      prompt: metadata.caption,
      model: "gpt3.5",
    });

    if (!title) return metadata;

    const output = {
      ...metadata,
      title,
    };
    return output;
  },
};
