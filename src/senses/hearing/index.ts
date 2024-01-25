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
import { getChunkEmbeddingsStep } from "./steps/4.getChunkEmbeddings";
import { getChunkSummariesStep } from "./steps/5.getChunkSummaries";
import { metadataList } from "../../server";
import { generateSummaryStep } from "./steps/7.generateSummary";
import { cleanAudioStep } from "./steps/0b.cleanAudio";
import { embedChunksStep } from "./steps/6.embedChunks";
import { addTitleStep } from "./steps/8.addTitle";
import { generateCompostStep } from "./steps/9.compost";
import { combineEmbeddingsStep } from "./steps/10.combineEmbeddings";
import { getMetadataStep } from "./steps/0a.getMetadata";

// NOTE THE SCHEMAS ARE FIXED. THEY CANNOT BE CHANGED. IF YOU WANT TO CHANGE THEM YOU NEED TO MAKE A NEW STEP
const hearingSteps: Step<any, any>[] = [
  getMetadataStep,
  cleanAudioStep,
  chunkAudioStep,
  transcribeChunksStep,
  getFullTranscriptStep,
  getChunkEmbeddingsStep,
  getChunkSummariesStep,
  generateSummaryStep,
  embedChunksStep,
  addTitleStep,
  combineEmbeddingsStep,
  // generateCompostStep,
  // TODO
  // summarise?
  // db? vdb? in memory db?
  // TODO DO WE REMOVE ALL CHUNK FILES AFTER THEY HAVE BEEN PROCESSED? It's mostly just taking up space
];

export const processHearing = async (
  metadata: FileMetadata & GenericObject
) => {
  const newMetadata = await processPipeline(metadata, hearingSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
