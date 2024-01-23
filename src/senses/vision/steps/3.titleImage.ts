import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { generateCompletion } from "../../../cognition/openai";

const InputSchema = z.object({
  caption: z.string(),
  location: z.string().optional(),
});

const OutputSchema = z.object({
  title: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const titleImageStep: Step<Input, Output> = {
  name: "titleImage",
  inputType: InputSchema,
  outputType: OutputSchema,
  run: async (metadata) => {
    const additionalPrompt = metadata.location
      ? `the photo was taken in ${metadata.location}`
      : "";
    metadata.title = await generateCompletion(
      `you are excellent at writing titles. proivide a singular title for the text. ${additionalPrompt}`,
      metadata.caption
    );
    return metadata;
  },
};
