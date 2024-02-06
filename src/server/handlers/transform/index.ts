import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { generateCompletion } from "../../../cognition/openai";

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

  return new Response(JSON.stringify(data.map((d) => d.hash)), { status: 200 });
};
