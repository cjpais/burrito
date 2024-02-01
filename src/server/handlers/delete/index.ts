import { z } from "zod";
import { metadataList, validateAuthToken } from "../..";
import { collection } from "../../../memory/vector";
import fs from "fs";

const DeleteRequestSchema = z.object({
  hash: z.string(),
});

export const handleDeleteRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { hash } = DeleteRequestSchema.parse(body);

  // remove from data list
  const removeIndex = metadataList.findIndex((m) => m.hash === hash);
  if (removeIndex > -1) {
    metadataList.splice(removeIndex, 1);
  }

  // remove vector embeddings
  collection.delete({
    where: {
      hash: hash,
    },
  });

  // remove file from fs
  fs.rmSync(`${process.env.BRAIN_STORAGE_ROOT}/data/${hash}`, {
    recursive: true,
    force: true,
  });

  return new Response("OK", { status: 200 });
};
