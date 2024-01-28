import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { summarize } from "../../../cognition";

const InputSchema = z.object({
  text: z.string(),
});

const OutputSchema = z.object({
  text: z.string(),
  summary: z.string(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const summarizeTextStep: Step<Input, Output> = {
  name: "summarizeText",
  inputType: InputSchema,
  outputType: OutputSchema,
  run: async (metadata) => {
    const summary = await summarize(metadata.text);

    if (!summary) {
      return metadata;
    }

    return {
      ...metadata,
      summary,
    };
  },
};
