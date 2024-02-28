import fs from "fs";
import { openAITranscription } from "./openai";

export interface GenerateTranscriptionParams {
  file: fs.ReadStream | string; // todo, accept file path, urls, etc.
  provider?: "openai" | "whispercpp";
  model?: string;
  prompt?: string;
}

export const generateTranscription = async (
  params: GenerateTranscriptionParams
): Promise<string> => {
  // const { file, provider, model, systemPrompt } = params;
  let provider = params.provider;

  console.log("filename", params.file);

  if (!provider || provider === "openai") {
    return await openAITranscription({
      file: params.file as fs.ReadStream,
      model: "whisper-1",
      prompt: params.prompt,
    });
  } else if (provider === "whispercpp") {
    return await whispercppTranscription({
      file: params.file as string,
      model: "whisper-1",
      prompt: params.prompt,
    });
  }

  return "provider not found";
};

type WhisperCPPResponse = {
  text: string;
};

const whispercppTranscription = async ({
  file,
  model,
  prompt,
}: {
  file: string;
  model: string;
  prompt: string | undefined;
}) => {
  const formData = new FormData();

  formData.append("file", Bun.file(file));
  formData.append("temperature", "0.0");
  formData.append("temperature_inc", "0.2");
  formData.append("response_format", "json");
  prompt && formData.append("prompt", prompt);

  return await fetch(`${process.env.LOCAL_WHISPER_API_URL}/inference`, {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to transcribe");
      return res.json() as Promise<WhisperCPPResponse>;
    })
    .then((res) => res.text.replaceAll("\n", ""))
    .catch((err) => {
      console.error(err);
      return "";
    });
};
