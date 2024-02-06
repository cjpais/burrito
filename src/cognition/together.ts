import OpenAI from "openai";
import { CompletionParams } from ".";
import { ChatCompletion } from "openai/resources/index.mjs";

const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
});

export const generateTogetherCompletion = async ({
  systemPrompt = "You are a helpful assistant.",
  userPrompt,
  model = "mistralai/Mixtral-8x7B-Instruct-v0.1",
  stream = false,
}: CompletionParams) => {
  const result = await together.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    // max_tokens: 32000,
    // stop: ["[/INST]", "</s>"],
    temperature: 0.3,
    top_p: 0.7,
    stream,
  });

  if (stream) return result;

  const response = (result as ChatCompletion).choices[0].message.content;

  return response;
};
