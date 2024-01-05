import { z } from "zod";
import { Step } from "../../../cognition/pipeline";
import { generateCompletion } from "../../../cognition/openai";
import {
  SummarizedAudio,
  SummarizedAudioSchema,
  SummarySchema,
} from "./7.generateSummary";

export const TitleSchema = SummarySchema.extend({
  title: z.string(),
});

export const TitledAudioSchema = TitleSchema.merge(SummarizedAudioSchema);

export type TitledAudio = z.infer<typeof TitledAudioSchema>;

export const addTitleStep: Step<SummarizedAudio, TitledAudio> = {
  name: "addTitle",
  inputType: SummarizedAudioSchema,
  outputType: TitledAudioSchema,
  validate: async (metadata) => {
    return true;
  },
  run: async (metadata) => {
    const title = (await generateCompletion(
      "you are excellent at writing titles. proivide a singular title for the text.",
      metadata.summary
    )) as string;
    return {
      ...metadata,
      title,
    };
  },
};
