import MistralClient, { ResponseFormats } from "@mistralai/mistralai";
import {
  CompletionParams,
  DEFAULT_JSON_SYS_PROMPT,
  DEFAULT_SYS_PROMPT,
} from ".";

const apiKey = process.env.MISTRAL_API_KEY;

const client = new MistralClient(apiKey);

type MistralCompletionParams = Omit<CompletionParams, "model"> & {
  model:
    | "open-mistral-7b"
    | "open-mixtral-8x7b"
    | "mistral-small-latest"
    | "mistral-medium-latest"
    | "mistral-large-latest";
};

export const generateMistralCompletion = async ({
  systemPrompt = DEFAULT_SYS_PROMPT,
  userPrompt,
  model = "mistral-small-latest",
  stream = false,
  json = false,
}: MistralCompletionParams) => {
  if (stream) throw new Error("Stream not supported by Mistral");

  if (json && systemPrompt === DEFAULT_SYS_PROMPT)
    systemPrompt = DEFAULT_JSON_SYS_PROMPT;

  const chatResponse = await client.chat({
    model: model,
    responseFormat: json
      ? { type: ResponseFormats.json_object }
      : { type: ResponseFormats.text },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return chatResponse.choices[0].message.content;
};
