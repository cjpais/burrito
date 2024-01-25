import OpenAI from "openai";
import fs from "fs";
import { FileMetadata, getFileInfo } from "../memory/files";

// TODO should this be in 'understanding' or something? TBD
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const local = new OpenAI({
  apiKey: "sk-no-key",
  baseURL: "http://192.168.1.210:8080/v1",
});

export const generateLocalCompletion = async (
  systemPrompt: string,
  message: string,
  model: string = "mistralai/Mixtral-8x7B-Instruct-v0.1"
) => {
  const result = await local.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 32000,
    // stop: ["[/INST]", "</s>"],
    temperature: 0.3,
  });

  const response = result.choices[0].message.content;

  return response;
};

export const generateCompletion = async (
  systemPrompt: string,
  message: string,
  schema?: any,
  model: string = "gpt-3.5-turbo-1106"
) => {
  const result = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
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
  });

  const response =
    schema && result.choices[0].message.tool_calls
      ? result.choices[0].message.tool_calls[0].function.arguments
      : result.choices[0].message.content;

  return response;
};

export const generateEmbeddings = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    input: texts,
    model: "text-embedding-ada-002",
  });
  return response.data.map((d) => d.embedding);
};

export const generateTranscriptions = async (files: string[]) => {
  const transcriptions = await Promise.all(
    files.map((filename, idx) => {
      return openai.audio.transcriptions
        .create({
          file: fs.createReadStream(filename),
          model: "whisper-1",
          prompt: "Transcribe the audio.",
        })
        .then((transcription) => ({
          transcription: transcription.text,
          number: idx,
        }));
    })
  );

  return transcriptions
    .sort((a, b) => a.number - b.number)
    .map((t) => t.transcription);
};

export const generateImageCompletion = async ({
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

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "system",
        content: systemPrompt || "You are a helpful assistant.",
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${fileInfo.mime};base64,${b64}`,
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
