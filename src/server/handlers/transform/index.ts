import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { DEFAULT_SYS_PROMPT, extractJSON } from "../../../cognition";
import dayjs from "dayjs";
import { CompletionCache } from "../../../memory/cache";
import {
  getSimpleData,
  rateLimitedQueryExecutor,
  writeHashMetadata,
} from "../../../misc/misc";
import { ChatModelsEnum, inference } from "../../../cognition/inference";
import { transformEach } from "./transform";

const cache = new CompletionCache<any>({ name: "transform" });

export const TransformRequestSchema = z.object({
  hashes: z.array(z.string()).optional(),
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  mode: z.enum(["each", "all"]).optional().default("each"),
  completionType: z.enum(["json", "text"]).optional().default("json"),
  model: ChatModelsEnum.optional().default("mixtral"),
  save: z
    .object({
      app: z.string(),
    })
    .optional(),
  force: z.boolean().optional(),
  cacheFor: z.number().optional(),
  debug: z.boolean().optional().default(false),
  // stream: z.boolean().optional().default(false),
});

export type TransformRequest = z.infer<typeof TransformRequestSchema>;

// TODO we really need to check that the return type is what the user is expecting
export const handleTransformRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const params = TransformRequestSchema.parse(body);

  // TODO this block should be a function
  let data = metadataList;

  if (params.hashes) {
    data = data.filter((m) => params.hashes!.includes(m.hash));
  }

  const [queryData, existingResults] = data.reduce(
    ([qd, er], d) => {
      if (
        !params.save ||
        !params.save.app ||
        !d.transforms ||
        !d.transforms[params.save.app] ||
        params.force ||
        params.mode === "all"
      ) {
        qd.push(getSimpleData(d));
      } else {
        er.push({ completion: d.transforms[params.save.app], hash: d.hash });
      }
      return [qd, er];
    },
    [[], []]
  );

  console.log(
    `transforming: ${queryData.length}. existing: ${existingResults.length}`
  );

  // TODO these are their own functions really.
  if (params.mode === "each") {
    const systemPrompt = params.systemPrompt
      ? params.systemPrompt
      : DEFAULT_SYS_PROMPT;

    const transform = await transformEach(queryData, {
      ...params,
      systemPrompt,
    });

    const responseArr = [...transform, ...existingResults];

    return new Response(JSON.stringify(responseArr), {
      status: 200,
    });
  } else {
    const cacheKey = JSON.stringify({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      hashes: params.hashes,
      model: params.model,
      completionType: params.completionType,
    });
    const cachedCompletion = cache.getValid(cacheKey);

    if (cachedCompletion && !params.force) {
      console.log(
        "Using cached transform completion",
        JSON.stringify(cachedCompletion)
      );
      return new Response(JSON.stringify(cachedCompletion), { status: 200 });
    } else {
      const completion = await inference.chat({
        systemPrompt: params.systemPrompt
          ? params.systemPrompt
          : DEFAULT_SYS_PROMPT,
        prompt: `${params.prompt}\n\n${JSON.stringify(queryData, null, 2)}`,
        model: params.model,
        json: params.completionType === "json",
      });

      const response =
        params.completionType === "json" ? extractJSON(completion) : completion;

      cache.set(cacheKey, response, params.cacheFor);
      return new Response(JSON.stringify(response), { status: 200 });
    }
  }
};
