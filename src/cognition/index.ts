import { generateCompletion } from "./openai";

export const summarize = async (
  text: string,
  summaryLength: string = "4 Sentences"
) => {
  return generateCompletion(
    `You are excellent at summarizing. Summarize the following text into ${summaryLength}. If the text is shorter than ${summaryLength}, just repeat the text.`,
    text,
    null,
    "gpt-4-1106-preview"
  );
};
