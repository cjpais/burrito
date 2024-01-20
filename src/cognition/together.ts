import OpenAI from "openai";

const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
});

export const generateTogetherCompletion = async (
  systemPrompt: string,
  message: string,
  model: string = "mistralai/Mixtral-8x7B-Instruct-v0.1"
) => {
  const result = await together.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    // max_tokens: 32000,
    // stop: ["[/INST]", "</s>"],
    temperature: 0.3,
    top_p: 0.7,
  });

  const response = result.choices[0].message.content;

  return response;
};
