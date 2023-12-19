import chalk from "chalk";
import { FileMetadataSchema, getFileInfo } from "../memory/files";
import { processHearing } from "../senses/hearing";
import { processReading } from "../senses/reading";
import {
  PipelineFunction,
  handleStoreRequest,
  notFoundHandler,
} from "./handlers";
import fs from "fs";

export const pipelines = new Map<string, PipelineFunction>([
  ["audio", processHearing],
  ["text", processReading],
]);

const runPipelineOnAllFiles = async () => {
  const root = `${process.env.BRAIN_STORAGE_ROOT!}/data`;
  const dirs = fs.readdirSync(root);

  for (const dir of dirs) {
    const fileDir = `${root}/${dir}`;

    // TODO run this in parallelllll
    if (fs.statSync(fileDir).isDirectory()) {
      // if metadata.json does not exist log error and contine..
      // todo will need to process and attempt to infer type of pipeline to run
      const metadata = FileMetadataSchema.passthrough().parse(
        JSON.parse(await Bun.file(`${fileDir}/metadata.json`).text())
      );

      // const file = await Bun.file(`${fileDir}/data.${metadata.ext}`);

      const pipeline = pipelines.get(metadata.type);
      if (pipeline) {
        console.log(`Running pipeline for file: ${metadata.hash}`);
        await pipeline(metadata);
      } else {
        console.log(
          `No pipeline found for type ${metadata.type} file: ${metadata.hash}`
        );
      }
    }
  }
};

export const brainServer = async () => {
  // TODO go through all the files and make sure they
  // have the right metadata according to their type
  console.time("runPipelineOnAllFiles");
  await runPipelineOnAllFiles();
  console.timeEnd("runPipelineOnAllFiles");
  console.log(chalk.green(`🧠 ${process.env.BRAIN_NAME} is online`));

  Bun.serve({
    port: 53096,
    fetch(request) {
      const url = new URL(request.url);

      if (url.pathname === "/store") {
        return notFoundHandler(request);
      } else if (url.pathname === "/new/store") {
        return handleStoreRequest(request);
      } else {
        return notFoundHandler(request);
      }
    },
  });
};
