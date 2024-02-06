import OpenAI from "openai";
import { FileMetadata, getFileInfo } from "../memory/files";
import { CompletionParams } from ".";
import { ChatCompletion } from "openai/resources/index.mjs";

const local = new OpenAI({
  apiKey: "sk-no-key",
  baseURL: "http://192.168.1.210:8080/v1",
});

export const generateLocalCompletion = async ({
  systemPrompt = "You are a helpful assistant.",
  userPrompt,
  model = "mistralai/Mixtral-8x7B-Instruct-v0.1",
  stream = false,
}: CompletionParams) => {
  const result = await local.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 32000,
    // stop: ["[/INST]", "</s>"],
    temperature: 0.3,
    stream,
  });

  if (stream) return result;

  const response = (result as ChatCompletion).choices[0].message.content;

  return response;
};

export const generateLocalImageCompletion = async ({
  systemPrompt,
  prompt,
  image,
  maxTokens,
}: {
  systemPrompt?: string;
  prompt?: string;
  image: FileMetadata;
  maxTokens?: number;
}) => {
  const fileInfo = await getFileInfo(image);
  const buf = await Bun.file(fileInfo.path).arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  const reqBody = JSON.stringify({
    stream: false,
    prompt: `A chat between a curious human and an artifical intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.\nUSER:[img-10]caption this image\nASSISTANT:`,
    stop: ["</s>", "Llama:", "User:"],
    temperature: 0.2,
    imageData: [
      {
        data: b64,
        id: 10,
      },
    ],
  });
  const resp = await fetch("https://caption.burrito.place/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: reqBody,
  })
    .then((r) => r.json())
    .catch((e) => {
      console.log("error", e.message);
    });

  return resp.content;
};
