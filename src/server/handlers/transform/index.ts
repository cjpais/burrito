import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { MODELS, extractJSON } from "../../../cognition";
import dayjs from "dayjs";
import { CompletionCache } from "../../../memory/cache";
import {
  rateLimitedQueryExecutor,
  writeHashMetadata,
} from "../../../misc/misc";

const cache = new CompletionCache<any>({ name: "transform" });

const TransformRequestSchema = z.object({
  hashes: z.array(z.string()).optional(),
  prompt: z.string(),
  systemPrompt: z.string().optional(),
  mode: z.enum(["each", "all"]).optional().default("each"),
  completionType: z.enum(["json", "text"]).optional().default("json"),
  model: z
    .enum(["gpt4", "gpt3.5", "mistral7b", "mixtral"])
    .optional()
    .default("mixtral"),
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

const transformEach = async (params: any) => {};

const transformAll = async (params: any) => {};

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
    data = data.filter((m) => params.hashes.includes(m.hash));
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
        qd.push({
          created: d.created,
          date: dayjs(d.created * 1000).format("MMM D, YYYY - h:mma"),
          hash: d.hash,
          title: d.title,
          summary: d.summary,
          description: d.description,
          caption: d.caption,
          userData: d.userData,
          text: d.audio ? d.audio.transcript : "",
        });
      } else {
        // console.log(
        //   "using existing transform",
        //   d.transforms[params.save.app],
        //   d.hash
        // );
        er.push({ completion: d.transforms[params.save.app], hash: d.hash });
      }
      return [qd, er];
    },
    [[], []]
  );

  console.log(
    `transforming: ${queryData.length}. existing: ${existingResults.length}`
  );

  const completionFunc = MODELS[params.model].func;

  // TODO these are their own functions really.
  if (params.mode === "each") {
    const queries = queryData.map((d) => async () => ({
      hash: d.hash,
      debug: params.debug,
      completion: await completionFunc(
        params.systemPrompt
          ? params.systemPrompt
          : "You are a helpful assistant.",
        `${params.prompt}\n\n${JSON.stringify(d, null, 2)}`
      ),
    }));

    const results = await rateLimitedQueryExecutor(
      queries,
      MODELS[params.model].rl
    );
    const response = results.map((r, i) => ({
      hash: r.hash,
      // modelPrompt: queries
      completion:
        params.completionType === "json"
          ? extractJSON(r.completion)
          : r.completion,
    }));
    // console.log(results);

    // do this async
    if (params.save && params.save.app) {
      response.map(async (r) => {
        // TODO, this is not thread safe.
        let entry = metadataList.find((m) => m.hash === r.hash);
        if (!entry.transforms) {
          entry.transforms = {};
        }

        entry.transforms[params.save.app] = r.completion;

        // save back to the database
        writeHashMetadata(r.hash, entry);
      });
    }

    let responseArr = [...response, ...existingResults];

    if (params.debug) {
      responseArr = responseArr.map((r) => {
        const d = metadataList.find((m) => m.hash === r.hash);
        // const promptData = {}
        const promptData = {
          created: d.created,
          date: dayjs(d.created * 1000).format("MMM D, YYYY - h:mma"),
          hash: d.hash,
          title: d.title,
          summary: d.summary,
          description: d.description,
          caption: d.caption,
          userData: d.userData,
          text: d.audio ? d.audio.transcript : "",
        };

        return {
          ...r,
          prompt: `${params.prompt}\n\n${JSON.stringify(promptData, null, 2)}`,
        };
      });
    }

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
      const completion = await completionFunc(
        params.systemPrompt
          ? params.systemPrompt
          : "You are a helpful assistant.",
        `${params.prompt}\n\n${JSON.stringify(queryData, null, 2)}`
      );

      const response =
        params.completionType === "json" ? extractJSON(completion) : completion;

      cache.set(cacheKey, response, params.cacheFor);
      return new Response(JSON.stringify(response), { status: 200 });
    }
  }
};
