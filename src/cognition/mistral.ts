import MistralClient from "@mistralai/mistralai";
import { CompletionParams } from ".";

const apiKey = process.env.MISTRAL_API_KEY;

const client = new MistralClient(apiKey);

export const generateMistralCompletion = async ({
  systemPrompt = "You are a helpful assistant.",
  userPrompt,
  model = "mistral-medium", // "mistral-medium" | "mistral-small" | "mistral-tiny"
  stream = false,
}: CompletionParams) => {
  if (stream) throw new Error("Stream not supported by Mistral");

  const chatResponse = await client.chat({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return chatResponse.choices[0].message.content;
};
