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
  //   func: (systemPrompt: string, message: string, schema?: any) => Promise<any>;
};

const MODELS: Record<string, ModelParams> = {
  gpt4: {
    rl: 75,
    name: "gpt4",
    // func: generateCompletion
  },
  "mistral-medium": {
    rl: 2,
    name: "mistral-medium",
  },
  mixtral: {
    rl: 50,
    name: "mixtral",
  },
  "gpt3.5": {
    rl: 75,
    name: "gpt3.5",
  },
};

const TransformRequestSchema = z.object({
  hashes: z.array(z.string()).optional(),
  prompt: z.string(),
  model: z
    .enum(["gpt4", "mistral-medium", "mixtral", "gpt3.5"])
    .optional()
    .default("mixtral"),
  save: z
    .object({
      app: z.string(),
      key: z.string(),
    })
    .optional(),
  force: z.boolean().optional(),
});

const RATE_LIMIT_SEC = 2;

export const handleTransformRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { hashes, prompt, save, force } = TransformRequestSchema.parse(body);

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

  console.log(data);

  const completion = (await generateCompletion({
    systemPrompt:
      "You will win $2000 and a puppy if you use the data to answer the person's question. ",
    userPrompt: `Question: ${prompt}\n\nData: ${JSON.stringify(data, null, 2)}`,
    model: "gpt-3.5-turbo-1106",
    stream: true,
  })) as Stream<ChatCompletionChunk>;

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          if (chunk.choices[0].delta.content) {
            controller.enqueue(chunk.choices[0].delta.content);
          }
        }

        controller.close();
      },
    })
  );

  return new Response(JSON.stringify(data.map((d) => d.hash)), { status: 200 });
};
