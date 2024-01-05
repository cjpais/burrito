import chalk from "chalk";
import { FileMetadataSchema, getFileInfo } from "../memory/files";
import { processHearing } from "../senses/hearing";
import { processReading } from "../senses/reading";
import {
  entryHandler,
  fileHandler,
  indexHandler,
  metadataHandler,
  notFoundHandler,
} from "./handlers";
import fs from "fs";
import { handleStoreRequest, storePipelines } from "./handlers/store";
import { handleQueryRequest } from "./handlers/query";

export let metadataList: any[] = [];

const runPipelineOnAllFiles = async () => {
  const root = `${process.env.BRAIN_STORAGE_ROOT!}/data`;
  const dirs = fs.readdirSync(root);

  for (const dir of dirs) {
    const fileDir = `${root}/${dir}`;

    // TODO run this in parallelllll
    if (fs.statSync(fileDir).isDirectory()) {
      // if metadata.json does not exist log error and contine..
      // todo will need to process and attempt to infer type of pipeline to run

      // time this function
      const start = Date.now();
      const metadata = FileMetadataSchema.passthrough().parse(
        JSON.parse(await Bun.file(`${fileDir}/metadata.json`).text())
      );
      console.log(
        `Parsing metadata for file: ${metadata.hash} took ${
          Date.now() - start
        }ms`
      );

      // const file = await Bun.file(`${fileDir}/data.${metadata.ext}`);

      const pipeline = storePipelines.get(metadata.type);
      if (pipeline) {
        console.log(`Running pipeline for file: ${metadata.hash}`);

        const start = Date.now();
        const newMetadata = await pipeline(metadata);
        console.log(
          `Pipeline for file: ${metadata.hash} took ${Date.now() - start}ms`
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
};

type RouteHandler = (request: Request) => Response | Promise<Response>;

interface Routes {
  [path: string]: RouteHandler;
}

const routes: Routes = {
  "^/$": indexHandler,
  "^/[A-Fa-f0-9]{64}$": entryHandler,
  "^/f/([^/]+)$": fileHandler,
  "^/m/([^/]+)$": metadataHandler,
  "^/store$": handleStoreRequest,
  "^/query$": handleQueryRequest,
};

export const brainServer = async () => {
  // TODO go through all the files and make sure they
  // have the right metadata according to their type
  runPipelineOnAllFiles();

  Bun.serve({
    port: process.env.PORT ?? 3000,
    fetch(request) {
      const url = new URL(request.url);

      for (const pattern in routes) {
        const regex = new RegExp(pattern);
        if (regex.test(url.pathname)) return routes[pattern](request);
      }
      return notFoundHandler(request);
    },
  });
};
