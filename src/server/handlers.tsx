import { z } from "zod";
import { metadataList } from ".";
import { renderToReadableStream } from "react-dom/server";
import Index from "./pages";
import Entry from "./pages/entry";
import { collection } from "../memory/vector";

export const RequestMetadataSchema = z.object({
  type: z.enum(["audio", "text"]).optional(),
  created: z.number().optional(),
});
export type GenericObject = { [key: string]: any };

export const notFoundHandler = (request: Request) => {
  return new Response("not found", { status: 404 });
};

export const indexHandler = async (request: Request) => {
  const sortedMetadata = metadataList.sort((a, b) => b.created - a.created);
  const page = await renderToReadableStream(
    <Index metadata={sortedMetadata} />
  );

  return new Response(page, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};

export const entryHandler = async (request: Request) => {
  const url = new URL(request.url);
  const hash = decodeURIComponent(url.pathname).split("/").pop();
  const metadata = metadataList.find((m) => m.hash === hash);
  if (!metadata) return notFoundHandler(request);

  const queryEmbeddings = metadata.audio.chunks.map((chunk) => chunk.embedding);

  // get similar docs
  const similar = await collection.query({
    queryEmbeddings,
    nResults: 5,
    where: {
      hash: {
        $ne: metadata.hash,
      },
    },
    include: ["metadatas", "distances"],
  });

  let similarSimple = [];
  for (let i = 0; i < similar.metadatas[0].length; i++) {
    const meta = metadataList.find(
      (m) => m.hash === similar.metadatas[0][i].hash
    );
    similarSimple.push({
      hash: similar.metadatas[0][i].hash,
      distance: similar.distances[0][i],
      summary: meta.summary,
      title: meta.title,
    });
  }
  similarSimple = similarSimple.sort((a, b) => a.distance - b.distance);
  let unique = new Map();

  similarSimple.forEach((item) => {
    unique.set(item.hash, item);
  });
  const uniqueArray = Array.from(unique.values()).sort(
    (a, b) => a.distance - b.distance
  );

  const page = await renderToReadableStream(
    <Entry metadata={metadata} similar={uniqueArray} />
  );
  return new Response(page, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
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

export const fileHandler = async (request: Request) => {
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
      return new Response(file, { status: 200 });
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
        },
      });
    }
  } catch (error) {
    console.log(error);
    return notFoundHandler(request);
  }
};
