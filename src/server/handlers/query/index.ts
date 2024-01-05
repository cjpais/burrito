import { z } from "zod";
import Ajv, { ValidateFunction } from "ajv";
import { generateCompletion } from "../../../cognition/openai";
import { query } from "../../../memory/vector";

type PipelineFunction = (input: any) => Promise<any>;

const QueryRequestSchema = z.object({
  query: z.string(),
  schema: z.any().optional(),
});

const QueryResponseSchema = z.object({});

// todo queries:
// what have i been doing
// what have i been thinking
// latest 10 entries
// next 10 entries (chained??)
// give me entries related to blah sorted by time
// what is this doc related to?

export const handleQueryRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ajv = new Ajv();
  let ajvSchema: ValidateFunction<unknown>;
  let response;

  try {
    const data = await request.json();
    const { query: q, schema } = QueryRequestSchema.parse(data);

    // if there is a json schema validate it
    // if (schema) {
    //   if (schema instanceof Object) {
    //     ajvSchema = ajv.compile(schema);
    //   } else {
    //     ajvSchema = ajv.compile(JSON.parse(schema));
    //   }
    // }
    const docs = await query(q, 10);

    const response = await generateCompletion(
      q,
      docs.documents[0].join("\n\n")
    );

    return new Response(JSON.stringify({ response, docs: docs.documents[0] }), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response("Bad request", { status: 400 });
  }
};
