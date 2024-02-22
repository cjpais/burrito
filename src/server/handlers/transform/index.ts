import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { MODELS, extractJSON } from "../../../cognition";
import dayjs from "dayjs";
import { CompletionCache } from "../../../memory/cache";

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
      key: z.string(),
    })
    .optional(),
  force: z.boolean().optional(),
  cacheFor: z.number().optional(),
  // stream: z.boolean().optional().default(false),
});

function rateLimitedQueryExecutor<T>(
  queries: (() => Promise<T>)[],
  maxPerSecond: number
): Promise<T[]> {
  if (queries.length === 0) {
    return Promise.resolve([]);
  }
  console.log(
    `Rate limiting ${queries.length} queries to ${maxPerSecond} per second`
  );
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
        console.log(`Initiating query ${index + 1} of ${queries.length}`);
        const queryPromise = queries[index++]();
        allPromises.push(queryPromise);
        queryPromise.catch(console.error); // Optionally log errors without stopping other queries
      }
    }, 1000); // Set the interval to 1 second (1000 milliseconds)
  });
}

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
        console.log(
          "using existing transform",
          d.transforms[params.save.app],
          d.hash
        );
        er.push({ completion: d.transforms[params.save.app], hash: d.hash });
      }
      return [qd, er];
    },
    [[], []]
  );

  const completionFunc = MODELS[params.model].func;

  // TODO these are their own functions really.
  if (params.mode === "each") {
    const queries = queryData.map((d) => async () => ({
      hash: d.hash,
      completion: await completionFunc(
        params.systemPrompt
          ? params.systemPrompt
          : "You are a helpful assistant.",
        `${prompt}\n\n${JSON.stringify(d, null, 2)}`
      ),
    }));

    const results = await rateLimitedQueryExecutor(
      queries,
      MODELS[params.model].rl
    );
    const response = results.map((r) => ({
      hash: r.hash,
      completion:
        params.completionType === "json"
          ? extractJSON(r.completion)
          : r.completion,
    }));
    console.log(results);

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
        Bun.write(
          `${process.env.BRAIN_STORAGE_ROOT}/data/${r.hash}/metadata.json`,
          JSON.stringify(entry)
        );
      });
    }

    return new Response(JSON.stringify([...response, ...existingResults]), {
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
      console.log("Using cached transform completion");
      return new Response(JSON.stringify(cachedCompletion), { status: 200 });
    } else {
      const completion = await completionFunc(
        params.systemPrompt
          ? params.systemPrompt
          : "You are a helpful assistant.",
        `${prompt}\n\n${JSON.stringify(queryData, null, 2)}`
      );

      const response =
        params.completionType === "json" ? extractJSON(completion) : completion;

      cache.set(cacheKey, response, params.cacheFor);
      return new Response(JSON.stringify(response), { status: 200 });
    }
  }
};
