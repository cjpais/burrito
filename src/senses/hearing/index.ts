import { z } from "zod";
import { FileInfo, FileMetadata, FileMetadataSchema } from "../../memory/files";
import {
  Step,
  merge,
  pipelineLog,
  processPipeline,
} from "../../cognition/pipeline";
import { GenericObject } from "../../server/handlers";
import { chunkAudioStep } from "./steps/1.chunkAudio";
import { transcribeChunksStep } from "./steps/2.transcribeAudio";
import { getFullTranscriptStep } from "./steps/3.getFullTranscript";
import { getChunkEmbeddingsStep } from "./steps/4.embedChunks";

// NOTE THE SCHEMAS ARE FIXED. THEY CANNOT BE CHANGED. IF YOU WANT TO CHANGE THEM YOU NEED TO MAKE A NEW STEP
const hearingSteps: Step<any, any>[] = [
  chunkAudioStep,
  transcribeChunksStep,
  getFullTranscriptStep,
  getChunkEmbeddingsStep,
  // TODO
  // summarise?
  // db? vdb? in memory db?
  // TODO DO WE REMOVE ALL CHUNK FILES AFTER THEY HAVE BEEN PROCESSED? It's mostly just taking up space
];

export const processHearing = async (
  metadata: FileMetadata & GenericObject
) => {
  return await processPipeline(metadata, hearingSteps);
};

// export const processHearing = async (
//   metadata: FileMetadata & GenericObject
// ) => {
//   pipelineLog(metadata.hash, "Processing Hearing");

//   // if metadata is not FileMetadata we error immediately
//   if (!FileMetadataSchema.safeParse(metadata).success) {
//     throw new Error("Metadata is not FileMetadata");
//   }

//   for (const step of hearingSteps) {
//     const parsedInputMetadata = step.inputType.safeParse(metadata);
//     if (!parsedInputMetadata.success) {
//       throw new Error("Input Metadata is not valid");
//     }

//     // 1. Check if the step has been run already according to the metadata this step expects to output
//     const parsedMetadata = step.outputType.safeParse(metadata);

//     if (parsedMetadata.success) {
//       // 2. If it has been run and there is a validation function, validate the data is good.
//       if (step.validate) {
//         // @ts-ignore
//         const isValid = await step.validate(parsedMetadata.data);
//         if (!isValid) {
//           // 3. If the data is not valid, rerun the step
//           pipelineLog(
//             metadata.hash,
//             `Step failed to validate... Re-running step ${step.name}`
//           );
//           // @ts-ignore
//           const newMeta = await step.run(metadata);
//           // validate new metadata
//           const parsedNewMetadata = step.outputType.safeParse(newMeta);
//           if (!parsedNewMetadata.success) {
//             throw new Error(`Output Metadata for ${step.name} is not valid`);
//           }
//           metadata = parsedNewMetadata.data;
//         } else {
//           // 4. If the data is valid, skip the step
//           pipelineLog(metadata.hash, `Skipping step ${step.name}`);
//         }
//       } else {
//         // 3. If there is no validation function, skip the step
//         pipelineLog(metadata.hash, `Skipping step ${step.name}`);
//       }
//     } else {
//       // 2. If we couldn't parse the metadata, run the step
//       pipelineLog(metadata.hash, JSON.stringify(metadata));
//       pipelineLog(
//         metadata.hash,
//         `Couldn't parse metadata... ${parsedMetadata.error.message} Running step ${step.name}`
//       );
//       // @ts-ignore
//       const newMeta = await step.run(parsedInputMetadata.data);
//       // validate new metadata
//       const parsedNewMetadata = step.outputType.safeParse(newMeta);
//       if (!parsedNewMetadata.success) {
//         throw new Error(`Output Metadata for ${step.name} is not valid`);
//       }
//       metadata = parsedNewMetadata.data;
//     }
//   }

//   pipelineLog(metadata.hash, "Finished Processing Hearing");

//   return metadata;
// };
