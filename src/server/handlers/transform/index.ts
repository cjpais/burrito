import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { generateCompletion } from "../../../cognition/openai";
import { Stream } from "openai/streaming.mjs";
import { ChatCompletionChunk } from "openai/resources/index.mjs";
import { execute } from "../../../tools/jsvm";
import {
  CODE_SYSTEM_PROMPT,
  NEW_CODE_SYSTEM_PROMPT,
} from "../../../misc/prompts";
import { runCodeCompletion } from "../../../cognition";
import dayjs from "dayjs";
import { generateTogetherCompletion } from "../../../cognition/together";

type ModelParams = {
  rl: number;
  name: string;
  func: (systemPrompt: string, userPrompt: string) => Promise<string>;
  //   func: (systemPrompt: string, message: string, schema?: any) => Promise<any>;
};

const MODELS: Record<string, ModelParams> = {
  gpt4: {
    rl: 75,
    name: "gpt4",
    func: async (systemPrompt: string, userPrompt: string) =>
      (await generateCompletion({
        systemPrompt,
        userPrompt,
        model: "gpt-4-1106-preview",
      })) as string,
  },
  // "mistral-medium": {
  //   rl: 2,
  //   name: "mistral-medium",
  //   func: (systemPrompt: string, userPrompt: string, stream: boolean) =>
  //     generateCompletion({
  //       systemPrompt,
  //       userPrompt,
  //       stream,
  //       model: "gpt-4-1106-preview",
  //     }),
  // },
  mixtral: {
    rl: 50,
    name: "mixtral",
    func: async (systemPrompt: string, userPrompt: string) =>
      (await generateTogetherCompletion({
        systemPrompt,
        userPrompt,
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      })) as string,
  },
  mistral7b: {
    rl: 50,
    name: "mistral7b",
    func: async (systemPrompt: string, userPrompt: string) =>
      (await generateTogetherCompletion({
        systemPrompt,
        userPrompt,
        model: "mistralai/Mistral-7B-Instruct-v0.2",
      })) as string,
  },
  "gpt3.5": {
    rl: 75,
    name: "gpt3.5",
    func: async (systemPrompt: string, userPrompt: string) =>
      (await generateCompletion({
        systemPrompt,
        userPrompt,
        model: "gpt-3.5-turbo-0125",
      })) as string,
  },
};

const TransformRequestSchema = z.object({
  hashes: z.array(z.string()).optional(),
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  model: z
    .enum(["gpt4", "gpt3.5", "mistral7b", "mixtral"])
    .optional()
    .default("mixtral"),
  save: z
    .object({
      app: z.string(),
      key: z.string(),
    })
    .optional(),
  force: z.boolean().optional(),
  // stream: z.boolean().optional().default(false),
});

function rateLimitedQueryExecutor<T>(
  queries: (() => Promise<T>)[],
  maxPerSecond: number
): Promise<T[]> {
  let index = 0; // Track the current index of the queries array
  const allPromises: Promise<T>[] = []; // Store all initiated query promises

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (index >= queries.length) {
        clearInterval(intervalId); // Stop the interval when all queries are initiated
        Promise.all(allPromises).then(resolve).catch(reject); // Wait for all queries to complete
        return;
      }

      // Initiate up to 'maxPerSecond' queries in parallel and store their promises
      for (let i = 0; i < maxPerSecond && index < queries.length; i++) {
        const queryPromise = queries[index++]();
        allPromises.push(queryPromise);
        queryPromise.catch(console.error); // Optionally log errors without stopping other queries
      }
    }, 1000); // Set the interval to 1 second (1000 milliseconds)
  });
}

export const handleTransformRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { hashes, prompt, save, force, model, systemPrompt } =
    TransformRequestSchema.parse(body);

  let data = metadataList;

  if (hashes) {
    data = data.filter((m) => hashes.includes(m.hash));
  }

  data = data.map((m: any) => ({
    created: m.created,
    date: dayjs(m.created * 1000).format("MMM D, YYYY - h:mma"),
    hash: m.hash,
    title: m.title,
    summary: m.summary,
    description: m.description,
    caption: m.caption,
    text: m.audio ? m.audio.transcript : "",
  }));

  const completionFunc = MODELS[model].func;
  const queries = data.map((d) => async () => ({
    hash: d.hash,
    completion: await completionFunc(
      systemPrompt ? systemPrompt : "You are a helpful assistant.",
      `${prompt}\n\n${JSON.stringify(d, null, 2)}`
    ),
  }));

  const results = await rateLimitedQueryExecutor(queries, MODELS[model].rl);
  console.log(results);

  return new Response(JSON.stringify(results), { status: 200 });
};
