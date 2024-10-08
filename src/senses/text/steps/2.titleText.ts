import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { inference } from "../../../cognition/inference";

const InputSchema = z.object({
  text: z.string(),
  summary: z.string(),
});

const OutputSchema = z.object({
  text: z.string(),
  summary: z.string(),
  title: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const titleTextStep: Step<Input, Output> = {
  name: "titleText",
  inputType: InputSchema,
  outputType: OutputSchema,
  run: async (metadata) => {
    // TODO try to extract the title from the first lines of the text

    const title = await inference.chat({
      systemPrompt: `you are excellent at writing titles. proivide a singular title for the text`,
      prompt: metadata.summary,
      model: "4o-mini",
    });

    if (!title) return metadata;

    return {
      ...metadata,
      title,
    };
  },
};
