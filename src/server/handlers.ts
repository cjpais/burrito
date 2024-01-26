import { z } from "zod";
import { validateAuthToken } from ".";
import { findSimilar } from "../memory/vector";
import { QueryRequestSchema } from "./handlers/query";
import { executeQuery } from "../tools/jsvm";

export const RequestMetadataSchema = z.object({
  type: z.enum(["audio", "text"]).optional(),
  created: z.number().optional(),
});
export type GenericObject = { [key: string]: any };

export const notFoundHandler = (request: Request) => {
  return new Response("not found", { status: 404 });
};

export const metadataHandler = async (request: Request) => {
  try {
    const url = new URL(request.url);
    const hash = decodeURIComponent(url.pathname).split("/").pop();
    const metadata = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/metadata.json`
    ).json();

    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: {
        contentType: "application/json",
      },
    });
  } catch (error) {
    console.log(error);
    return notFoundHandler(request);
  }
};

export const imageHandler = async (request: Request) => {
  console.log(`[request] /image`);
  try {
    const url = new URL(request.url);
    const hash = decodeURIComponent(url.pathname).split("/").pop();
    const metadata = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/metadata.json`
    ).json();

    // this assumes the pipeline has run correctly and `compressed.jpg` exists
    if (metadata.type !== "image") {
      return notFoundHandler(request);
    }
    const compressedImage = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/compressed.jpg`
    );

    return new Response(compressedImage, {
      status: 200,
      headers: {
        "Content-Type": metadata.type,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.log(error);
    return notFoundHandler(request);
  }
};

export const videoHandler = async (request: Request) => {
  console.log(`[request] /video`);
  try {
    const url = new URL(request.url);
    const hash = decodeURIComponent(url.pathname).split("/").pop();
    const metadata = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/metadata.json`
    ).json();

    // this assumes the pipeline has run correctly and `compressed.jpg` exists
    if (metadata.type !== "video") {
      return notFoundHandler(request);
    }
    const file = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/compressed.mp4`
    );

    const range = request.headers.get("range");
    if (!range || range === "bytes=0-1") {
      return new Response(file, {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } else {
      let [start, end] = range
        .replace(/bytes=/, "")
        .split("-")
        .map(Number);

      start = start || 0;
      end = end ? end : file.size - 1;

      // Check if the range is valid
      if (start >= file.size || end >= file.size) {
        return new Response(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            "Content-Range": `bytes */${file.size}`,
            "Content-Type": file.type,
          },
        });
      }

      const partialFile = file.slice(start, end + 1);

      return new Response(partialFile, {
        status: 206, // Partial Content
        headers: {
          "Content-Range": `bytes ${start}-${end}/${file.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": `${partialFile.size}`,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  } catch (error) {
    console.log(error);
    return notFoundHandler(request);
  }
};

export const fileHandler = async (request: Request) => {
  console.log(`[request] /file`);
  try {
    const url = new URL(request.url);
    const hash = decodeURIComponent(url.pathname).split("/").pop();
    const metadata = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/metadata.json`
    ).json();

    const file = await Bun.file(
      `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/data.${metadata.ext}`
    );

    const range = request.headers.get("range");
    if (!range || range === "bytes=0-1") {
      return new Response(file, {
        status: 200,
        headers: {
          // "Cache-Control": "public, max-age=31536000",
        },
      });
    } else {
      let [start, end] = range
        .replace(/bytes=/, "")
        .split("-")
        .map(Number);

      start = start || 0;
      end = end ? end : file.size - 1;

      // Check if the range is valid
      if (start >= file.size || end >= file.size) {
        return new Response(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            "Content-Range": `bytes */${file.size}`,
            "Content-Type": file.type,
          },
        });
      }

      const partialFile = file.slice(start, end + 1);

      return new Response(partialFile, {
        status: 206, // Partial Content
        headers: {
          "Content-Range": `bytes ${start}-${end}/${file.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": `${partialFile.size}`,
          // "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  } catch (error) {
    console.log(error);
    return notFoundHandler(request);
  }
};

const EmbeddingRequestSchema = z.object({
  vectors: z.array(z.array(z.number()).length(1536)),
  num: z.number().max(50).optional(),
});

export const SimilarEntrySchema = z.object({
  hash: z.string(),
  distance: z.number(),
  summary: z.string(),
  title: z.string(),
});

export const handleDataRequest = async (request: Request) => {
  // TODO this will be another tool for the brain to use eventually.

  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { query } = QueryRequestSchema.parse(body);

    const result = await executeQuery(query);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(`Bad request.\n\n Error: ${error}`, { status: 400 });
  }
};

export const EmbeddingResponseSchema = z.array(SimilarEntrySchema);

export const handleEmbeddingsRequest = async (request: Request) => {
  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  try {
    const body = await request.json();
    const { vectors, num } = EmbeddingRequestSchema.parse(body);

    const similar = await findSimilar(vectors, num || 5);

    return new Response(JSON.stringify(similar), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(`Bad request.\n\n Error: ${error}`, { status: 400 });
  }
};
