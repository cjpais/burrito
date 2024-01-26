import { renderToReadableStream } from "react-dom/server";
import { metadataList } from "..";
import Index from "./pages";
import { notFoundHandler } from "../handlers";
import Entry from "./pages/entry";
import chalk from "chalk";
import { findSimilar } from "../../memory/vector";

export type BurritoPeer = {
  name: string;
  display: string;
  url: string;
};

const fetchPeers = async () => {
  const data = await fetch("https://burrito.place/api/participants").then(
    (res) => res.json()
  );
  return data as BurritoPeer[];
};

export const indexHandler = async (request: Request) => {
  console.log(`[request] /`);
  const sortedMetadata = metadataList.sort((a, b) => b.created - a.created);
  console.log(`[request] / ${sortedMetadata.length} memories`);
  const page = await renderToReadableStream(
    <Index metadata={sortedMetadata} />
  );
  console.log(`[request] / rendered`);

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

  let queryEmbeddings: null | number[][] = [metadata.embedding];
  let similar:
    | {
        hash: string;
        distance: number;
        summary: string;
        title: string;
      }[]
    | null = null;
  let peersSimilar: any[] | null = null;

  // get similar docs
  if (queryEmbeddings) {
    similar = await findSimilar(queryEmbeddings, 5, {
      hash: {
        $ne: metadata.hash,
      },
    });

    // console.log(similar);
    const peers = await fetchPeers();

    peersSimilar = [
      ...(
        await Promise.all(
          peers.map(async (peer) =>
            fetch(`${peer.url}/query/embeddings`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                vectors: queryEmbeddings,
                num: 5,
              }),
            })
              .then((res) => res.json())
              // .then((j) => EmbeddingResponseSchema.parse(j))
              .then((d) => d.map((s) => ({ ...s, peer })))
              .catch((err) => {
                console.log(
                  `${chalk.red("[error]")} peer ${peer.name} with error`,
                  err
                );
                return null;
              })
          )
        )
      ).flat(),
    ];
  }

  peersSimilar = peersSimilar
    ?.filter((d) => d !== null)
    ?.sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  const page = await renderToReadableStream(
    <Entry
      metadata={metadata}
      similar={similar?.filter((d) => d.distance < 0.24)}
      peersSimilar={
        peersSimilar &&
        peersSimilar.filter((d) => d !== null && d.distance < 0.24)
      }
    />
  );
  return new Response(page, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};
