import { z } from "zod";
import { generateCompletion } from "../../../cognition/openai";
import { Step } from "../../../cognition/pipeline";

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

    const title = await generateCompletion({
      systemPrompt: `you are excellent at writing titles. proivide a singular title for the text`,
      userPrompt: metadata.summary,
    });

    if (!title) return metadata;

    return {
      ...metadata,
      title,
    };
  },
};
