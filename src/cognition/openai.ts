import OpenAI from "openai";
import fs from "fs";
import { FileMetadata, getFileInfo } from "../memory/files";
import { CompletionParams } from ".";

// TODO should this be in 'understanding' or something? TBD
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateCompletion = async ({
  systemPrompt = "You are a helpful assistant.",
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
