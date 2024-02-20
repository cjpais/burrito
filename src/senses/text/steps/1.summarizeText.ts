import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { summarize } from "../../../cognition";

const InputSchema = z.object({
  text: z.string(),
  userData: z.any().optional(),
});

const OutputSchema = z.object({
  text: z.string(),
  summary: z.string(),
  userData: z.any().optional(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const summarizeTextStep: Step<Input, Output> = {
  name: "summarizeText",
  inputType: InputSchema,
  outputType: OutputSchema,
  run: async (metadata) => {
    const summary = await summarize(metadata.text, {
      userData:
        typeof metadata.userData === "string" ? metadata.userData : undefined,
    });

    if (!summary) {
      return metadata;
    }

    return {
      ...metadata,
      summary,
    };
  },
};
