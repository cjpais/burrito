import fs from "fs";
import { ChatModels, inference } from "./inference";

export const DEFAULT_SYS_PROMPT = "You are a helpful assistant.";
export const DEFAULT_JSON_SYS_PROMPT =
  "You are a helpful assistant. You only respond in JSON.";

export interface CompletionParams {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  schema?: any;
  stream?: boolean;
  json?: boolean;
}

export type RunCompletionParams = {
  name: string;
  systemPrompt?: string;
  userPrompt: string;
  model?: ChatModels;
};

const CODE_REGEX = /```.*?\n([\s\S]*?)```/;

type SummarizeParams = {
  summaryLength?: string;
  userData?: string;
  model?: string;
};

export const summarize = async (
  text: string,
  params: SummarizeParams = {
    summaryLength: "4 short sentences",
    model: "gpt4",
  }
) => {
  const toSummarize = params.userData
    ? `Here is some user provided context: ${params.userData}\n${text}`
    : text;

  // TODO really should have better type hints to avoid this
  if (!params.model) params.model = "gpt4";

  return inference.chat({
    systemPrompt: `You are excellent at summarizing. Summarize from the first person point of view. Summarize the following text into ${params.summaryLength}. If the text is shorter than ${params.summaryLength}, output the text as it was given to you.`,
    prompt: toSummarize,
    model: params.model,
  });
};

export const runCodeCompletion = async ({
  name,
  systemPrompt = DEFAULT_SYS_PROMPT,
  userPrompt = "",
  model = "gpt4",
}: RunCompletionParams): Promise<string | null> => {
  const rawCompletion = (await inference.chat({
    systemPrompt,
    prompt: userPrompt,
    model,
  })) as string;

  const match = rawCompletion.match(CODE_REGEX);
  if (!match || match.length < 2) {
    console.log(
      `NO MATCH FOUND FOR COMPLETION: ${name}\n\nRAW COMPLETION: ${rawCompletion}`
    );
    return null;
  }

  console.log("CODE COMPLETION MODEL", model);
  console.log("CODE COMPLETION SYSTEM PROMPT", systemPrompt);
  console.log("CODE COMPLETION USER PROMPT", systemPrompt);

  return match[1];
};

export const runJsonCompletion = async <T>({
  name,
  systemPrompt = DEFAULT_JSON_SYS_PROMPT,
  userPrompt = "",
  model = "gpt4",
}: RunCompletionParams): Promise<T | null> => {
  const rawCompletion = (await inference.chat({
    systemPrompt,
    prompt: userPrompt,
    model,
  })) as string;

  let result: T;

  try {
    result = JSON.parse(rawCompletion);
    // console.log(name, systemPrompt, userPrompt, model, rawCompletion, match[1]);
    return result;
  } catch {
    const match = rawCompletion.match(CODE_REGEX);
    // console.log(name, systemPrompt, userPrompt, model, rawCompletion, match[1]);
    if (match && match.length > 1) {
      result = JSON.parse(match[1]);
      return result;
    } else {
      console.log(
        `NO MATCH FOUND FOR COMPLETION: ${name}\n\nRAW COMPLETION: ${rawCompletion}`
      );
    }
  }

  return null;
};

export const extractJSON = <T>(text: string): T | null => {
  let result: T | null = null;
  try {
    result = JSON.parse(text) as T;
  } catch {
    try {
      const match = text.match(CODE_REGEX);
      if (match && match.length > 1) {
        result = JSON.parse(match[1]) as T;
      } else {
        console.log(`NO JSON MATCH FOUND FOR TEXT: ${text}`);
      }
    } catch {
      console.log(`NO JSON MATCH FOUND FOR TEXT: ${text}`);
    }
  }

  return result;
};

export const generateTranscriptions = async (files: string[]) => {
  const model = process.env.LOCAL_WHISPER_API_URL
    ? "local-whisper"
    : "oai-whisper";

  console.log("running transcriptions", files, model);

  const transcriptions = await Promise.all(
    files.map((filename, idx) => {
      const file = process.env.LOCAL_WHISPER_API_URL
        ? filename
        : fs.createReadStream(filename);

      return inference
        .transcribe({
          model,
          file,
        })
        .then((text) => ({ number: idx, text }));
    })
  );

  return transcriptions.sort((a, b) => a.number - b.number).map((t) => t.text);
};
