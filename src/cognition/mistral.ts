import MistralClient from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

const client = new MistralClient(apiKey);

export const generateMistralCompletion = async (
  systemPrompt: string,
  message: string,
  model: "mistral-medium" | "mistral-small" | "mistral-tiny" = "mistral-medium"
) => {
  const chatResponse = await client.chat({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
  });

  return chatResponse.choices[0].message.content;
};
