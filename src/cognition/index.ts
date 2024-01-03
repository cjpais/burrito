import { generateCompletion } from "./openai";

export const summarize = async (
  text: string,
  summaryLength: string = "4 Sentences"
) => {
  return generateCompletion(
    `You are an excellent summarizer. You will summarize any text into ${summaryLength}`,
    text
  );
};
