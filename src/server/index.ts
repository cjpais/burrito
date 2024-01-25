import chalk from "chalk";
import { FileMetadataSchema, getFileInfo } from "../memory/files";
import { processHearing } from "../senses/audio";
import { processReading } from "../senses/text";
import {
  entryHandler,
  fileHandler,
  handleDataRequest,
  handleEmbeddingsRequest,
  imageHandler,
  indexHandler,
  metadataHandler,
  notFoundHandler,
} from "./handlers";
import fs from "fs";
import { handleStoreRequest, storePipelines } from "./handlers/store";
import { handleQueryRequest } from "./handlers/query";

export let metadataList: any[] = [];

const colorType = (type: string) => {
  const output = `[${type}]`;
  switch (type) {
    case "audio":
      return chalk.blue(output);
    case "text":
      return chalk.yellow(output);
    case "video":
      return chalk.magenta(output);
    case "image":
      return chalk.green(output);
    default:
      return output;
  }
};

const runPipelineOnAllFiles = async () => {
  const root = `${process.env.BRAIN_STORAGE_ROOT!}/data`;
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  const dirs = fs.readdirSync(root);

  // init metadata list
  console.log("INIT METADATA LIST");
  for (const dir of dirs) {
    const fileDir = `${root}/${dir}`;
    if (fs.statSync(fileDir).isDirectory()) {
      const metadata = FileMetadataSchema.passthrough().parse(
        JSON.parse(await Bun.file(`${fileDir}/metadata.json`).text())
      );
      metadataList.push(metadata);
    }
  }

  for (const dir of dirs) {
    const fileDir = `${root}/${dir}`;

    // TODO run this in parallelllll
    if (fs.statSync(fileDir).isDirectory()) {
      // if metadata.json does not exist log error and contine..
      // todo will need to process and attempt to infer type of pipeline to run

      // time this function
      const metadata = FileMetadataSchema.passthrough().parse(
        JSON.parse(await Bun.file(`${fileDir}/metadata.json`).text())
      );

      // const file = await Bun.file(`${fileDir}/data.${metadata.ext}`);

      const pipeline = storePipelines.get(metadata.type);
      if (pipeline) {
        // console.log(`Running pipeline for file: ${metadata.hash}`);

        const start = Date.now();
        const newMetadata = await pipeline(metadata);
        console.log(
          `${colorType(metadata.type)} pipeline for ${metadata.hash} took ${
            Date.now() - start
          }ms`
        );

        if (JSON.stringify(newMetadata) !== JSON.stringify(metadata)) {
          console.log("metadata changed, updating");
          await Bun.write(
            `${fileDir}/metadata.json`,
            JSON.stringify(newMetadata)
          );
        }
      } else {
        console.log(
          `No pipeline found for type ${metadata.type} file: ${metadata.hash}`
        );
      }
    }
  }

  console.log("REMOVING DUPLICATES");
  metadataList = metadataList.reduce((acc, curr) => {
    if (!acc.find((m: any) => m.hash === curr.hash)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  // write this file to disk
  console.log("WRITING METADATA LIST");
  await Bun.write(
    `${process.env.BRAIN_STORAGE_ROOT!}/metadata.json`,
    JSON.stringify(metadataList)
  );
};

type RouteHandler = (request: Request) => Response | Promise<Response>;

interface Routes {
  [path: string]: RouteHandler;
}

const routes: Routes = {
  "^/$": indexHandler,
  "^/[A-Fa-f0-9]{64}$": entryHandler,
  "^/f/([^/]+)$": fileHandler,
  "^/i/([^/]+)$": imageHandler,
  "^/m/([^/]+)$": metadataHandler,
  "^/store$": handleStoreRequest,
  "^/query$": handleQueryRequest,
  "^/query/embeddings$": handleEmbeddingsRequest,
  "^/query/data$": handleDataRequest,
};

export const validateAuthToken = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.split(" ")[1];
  if (token !== process.env.AUTH_SECRET) return false;

  return true;
};

export const brainServer = async () => {
  // TODO go through all the files and make sure they
  // have the right metadata according to their type
  const port = process.env.PORT ?? 8000;

  Bun.serve({
    port: port,
    fetch(request) {
      const url = new URL(request.url);

      for (const pattern in routes) {
        const regex = new RegExp(pattern);
        if (regex.test(url.pathname)) return routes[pattern](request);
      }
      return notFoundHandler(request);
    },
  });

  console.log(`Server running at http://localhost:${port}`);
};

runPipelineOnAllFiles();
