import { Operation, applyPatch } from "fast-json-patch";
import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { writeHashMetadata } from "../../../misc/misc";

const EditRequestSchema = z.object({
  hash: z.string(),
  patches: z.array(
    z.object({
      op: z.enum(["add", "remove", "replace", "move", "copy", "test", "_get"]),
      path: z.string(),
      value: z.any().optional(), // TODO: this should be optional based on the op
      from: z.string().optional(),
    })
  ),
});

export type EditRequestParams = {
  hash: string;
  patches: Operation[];
};

export const handleEditRequest = async (request: Request) => {
  // is this a patch or post?
  if (request.method !== "PATCH" && request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { hash, patches } = EditRequestSchema.parse(body);

  const data = metadataList.find((m) => m.hash === hash);

  // if hash doesnt exist, return 404
  if (!data) return new Response("Not found", { status: 404 });

  // apply patches
  applyPatch(data, patches as Operation[]);

  // save to disk
  writeHashMetadata(hash, data);

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
