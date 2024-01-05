import { generateCompletion } from "./openai";

export const summarize = async (
  text: string,
  summaryLength: string = "4 Sentences"
) => {
  return generateCompletion(
    `You are a computer. You execute english instructions exactly as told. 

    Instructions: You summarize text into 4 sentences. If the text is less than 4 sentences, you will repeat the text exactly as it was written to you.`,
    text
  );
};
