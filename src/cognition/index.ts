import { generateCompletion } from "./openai";

export type CompletionParams = {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  schema?: any;
  stream?: boolean;
};

export type RunCompletionParams = {
  name: string;
  systemPrompt?: string;
  userPrompt: string;
  model?: "gpt-3.5-turbo-1106" | "gpt-4-1106-preview";
};

const CODE_REGEX = /```.*?\n([\s\S]*?)```/;

export const summarize = async (
  text: string,
  summaryLength: string = "4 short sentences"
) => {
  return generateCompletion({
    systemPrompt: `You are excellent at summarizing. Summarize the following text into ${summaryLength}. If the text is shorter than ${summaryLength}, output the text as it was given to you.`,
    userPrompt: text,
    model: "gpt-4-1106-preview",
  });
};

export const runCodeCompletion = async ({
  name,
  systemPrompt = "You are a helpful assistant.",
  userPrompt = "",
  model = "gpt-4-1106-preview",
}: RunCompletionParams): Promise<string | null> => {
  const rawCompletion = (await generateCompletion({
    // const rawCompletion = (await generateTogetherCompletion(
    systemPrompt,
    userPrompt,
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
  systemPrompt = "You are a helpful assistant.",
  userPrompt = "",
  model = "gpt-4-1106-preview",
}: RunCompletionParams): Promise<T | null> => {
  const rawCompletion = (await generateCompletion({
    // const rawCompletion = (await generateTogetherCompletion(
    systemPrompt,
    userPrompt,
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
