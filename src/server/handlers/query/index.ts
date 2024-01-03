import { z } from "zod";
import Ajv, { ValidateFunction } from "ajv";

type PipelineFunction = (input: any) => Promise<any>;

const QueryRequestSchema = z.object({
  query: z.string(),
  schema: z.string().or(z.any()).optional(),
});

const QueryResponseSchema = z.object({});

export const handleQueryRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const ajv = new Ajv();
  let ajvSchema: ValidateFunction<unknown>;
  let response;

  try {
    const data = await request.json();
    const { query, schema } = QueryRequestSchema.parse(data);

    // if there is a json schema validate it
    // if (schema) {
    //   if (schema instanceof Object) {
    //     ajvSchema = ajv.compile(schema);
    //   } else {
    //     ajvSchema = ajv.compile(JSON.parse(schema));
    //   }
    // }

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response("Bad request", { status: 400 });
  }
};
