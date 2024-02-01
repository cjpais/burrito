import { z } from "zod";
import Ajv, { ValidateFunction } from "ajv";
import { metadataList, validateAuthToken } from "../..";
import dayjs from "dayjs";
import {
  INFERENCE_NEEDED_SYSTEM_PROMPT,
  INTERPRET_DATA_PROMPT_TEMPLATE,
  KEYWORD_SYS_PROMPT,
  NEW_CODE_SYSTEM_PROMPT,
} from "../../../misc/prompts";
import Mustache from "mustache";
import { randomUUID } from "node:crypto";
import { keywordSearch } from "../../../tools/keyword";
import { execute } from "../../../tools/jsvm";
import { runCodeCompletion, runJsonCompletion } from "../../../cognition";

export const QueryRequestSchema = z.object({
  query: z.string(),
  schema: z.any().optional(),
});

const cache = {};

// todo queries:
// what have i been doing
// what have i been thinking
// latest 10 entries
// next 10 entries (chained??)
// give me entries related to blah sorted by time
// what is this doc related to?
const interpretDataCompletion = async (
  req: z.infer<typeof QueryRequestSchema>,
  data: any
) => {
  const prompt = Mustache.render(INTERPRET_DATA_PROMPT_TEMPLATE, {
    question: req.query,
    output: JSON.stringify(req.schema, null, 2),
    data: JSON.stringify(data, null, 2),
  });

  return await runJsonCompletion<any>({
    name: "interpret data",
    userPrompt: prompt,
  });
};

const runBasicCompletions = async (req: z.infer<typeof QueryRequestSchema>) => {
  const inferenceCompletion = runJsonCompletion<{
    infer: boolean;
    explanation: string;
  }>({
    name: "is inference necessary?",
    systemPrompt: INFERENCE_NEEDED_SYSTEM_PROMPT,
    userPrompt: `Question: ${req.query}\nOutput Format: ${JSON.stringify(
      req.schema,
      null,
      2
    )} `,
  });

  // TODO we dont need to parse the JSON this will cause error as is.
  const codeCompletion = runCodeCompletion({
    name: "generate code",
    systemPrompt: NEW_CODE_SYSTEM_PROMPT,
    userPrompt: `Question: ${req.query}`,
  });

  const keywordCompletion = runJsonCompletion<string[]>({
    name: "generate keywords",
    systemPrompt: KEYWORD_SYS_PROMPT,
    userPrompt: `Question: ${req.query}`,
    model: "gpt-3.5-turbo-1106",
  });

  const [inferenceNeeded, code, keywords] = await Promise.all([
    inferenceCompletion,
    codeCompletion,
    keywordCompletion,
  ]);

  return { inferenceNeeded, code, keywords };
};

export const handleQueryRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const ajv = new Ajv();
  let ajvSchema: ValidateFunction<unknown>;
  let response;

  try {
    const reqData = await request.json();
    const queryRequest = QueryRequestSchema.parse(reqData);

    const metadata = metadataList.map((m: any) => ({
      created: m.created,
      date: dayjs(m.created * 1000).format("MMM D, YYYY - h:mma"),
      hash: m.hash,
      title: m.title,
      summary: m.summary,
      text: m.audio ? m.audio.transcript : "",
      embedding: m.embedding,
    }));

    const uuid = randomUUID();
    console.log("--------------uuid---------------", uuid);

    // get the basic completions needed to execute code and generate keywords
    const { inferenceNeeded, code, keywords } = await runBasicCompletions(
      queryRequest
    );

    console.log("inference needed", inferenceNeeded);
    console.log("code", code);
    console.log("keywords", keywords);

    if (!code) return new Response("Error generating code", { status: 500 });
    if (!keywords)
      return new Response("Error generating keywords", { status: 500 });
    if (!inferenceNeeded)
      return new Response("Error generating inference", { status: 500 });

    let data;

    // // execute the code
    const codeData = execute(code, metadata);

    // // perform keyword search
    const keywordData = await keywordSearch(keywords, codeData);

    if (inferenceNeeded.infer) {
      data = await interpretDataCompletion(queryRequest, keywordData);
    } else {
      data = keywordData;
    }
    // return new Response(JSON.stringify({ inferenceNeeded, keywords, code }), {
    //   status: 200,
    // });

    return new Response(
      JSON.stringify({
        data,
        // generationDetails: {
        //   inferenceNeeded,
        //   code,
        //   keywords,
        //   codeData,
        //   keywordData,
        // },
      }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log(error);
    return new Response("Bad request", { status: 400 });
  }
};
