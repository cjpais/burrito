import OpenAI from "openai";
import fs from "fs";
import { FileMetadata, getFileInfo } from "../memory/files";
import { CompletionParams, DEFAULT_SYS_PROMPT } from ".";
import { ChatCompletion } from "openai/resources/index.mjs";
import { generateTranscription } from "./transcription";

// TODO should this be in 'understanding' or something? TBD
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateCompletion = async ({
  systemPrompt = DEFAULT_SYS_PROMPT,
  userPrompt,
  schema,
  model = "gpt-3.5-turbo-1106",
  stream = false,
}: CompletionParams) => {
  const result = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: schema
      ? [
          {
            type: "function",
            function: {
              name: "transform",
              description:
                "Always call this function to transform the given data into exact output.",
              parameters: {
                ...schema,
              },
            },
          },
        ]
      : undefined,
    stream,
  });

  if (stream) return result;
  const message = (result as ChatCompletion).choices[0].message;

  const response =
    schema && message.tool_calls
      ? message.tool_calls[0].function.arguments
      : message.content;

  return response;
};

export const generateEmbeddings = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    input: texts,
    model: "text-embedding-ada-002",
  });
  return response.data.map((d) => d.embedding);
};

export const openAITranscription = async ({
  file,
  model,
  prompt,
}: {
  file: fs.ReadStream;
  model: "whisper-1";
  prompt?: string | undefined;
}) => {
  return (
    await openai.audio.transcriptions.create({
      file: file,
      model: model,
      prompt: prompt,
    })
  ).text;
};

export const generateTranscriptions = async (files: string[]) => {
  const transcriptions = await Promise.all(
    files.map((filename, idx) => {
      return generateTranscription({
        file: filename,
        model: "whisper-1",
        provider: "whispercpp",
      }).then((text) => ({ number: idx, text }));
    })
  );

  return transcriptions.sort((a, b) => a.number - b.number).map((t) => t.text);
};

export const generateImageCompletion = async ({
  systemPrompt,
  prompt,
  image,
  maxTokens,
}: {
  systemPrompt?: string;
  prompt?: string;
  image: string;
  maxTokens?: number;
}) => {
  const file = Bun.file(image);
  const mime = file.type;
  const buf = await file.arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content: systemPrompt || DEFAULT_SYS_PROMPT,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${b64}`,
            },
          },
          { type: "text", text: prompt || "caption this image" },
        ],
      },
    ],
    max_tokens: maxTokens || 1500,
  });

  return response.choices[0].message.content;
};
