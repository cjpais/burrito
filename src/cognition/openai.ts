import OpenAI from "openai";
import fs from "fs";

// TODO should this be in 'understanding' or something? TBD
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: "https://api.together.xyz/v1",
});
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

export const generateTogetherCompletion = async (
  systemPrompt: string,
  message: string,
  model: string = "mistralai/Mixtral-8x7B-Instruct-v0.1"
) => {
  const result = await together.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: 3000,
    // stop: ["[/INST]", "</s>"],
    temperature: 0.3,
    top_p: 0.7,
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
