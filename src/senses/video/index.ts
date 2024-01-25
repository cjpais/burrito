import { Step, processPipeline } from "../../cognition/pipeline";
import { FileMetadata } from "../../memory/files";
import { metadataList } from "../../server";
import { GenericObject } from "../../server/handlers";
import { audioPipelineSteps } from "../audio";
import { getMetadataStep } from "../audio/steps/0a.getMetadata";
import { reverseGeocodeStep } from "../image/steps/1.reverseGeocode";
import { compressVideoStep } from "./steps/0.compressVideo";
import { extractAudioStep } from "./steps/1.extractAudio";
import { cleanAudioStep } from "./steps/2.cleanAudio";

const modifiedAudioPipelineSteps: Step<any, any>[] =
  audioPipelineSteps.slice(2);

const videoPipelineSteps: Step<any, any>[] = [
  getMetadataStep,
  compressVideoStep,
  reverseGeocodeStep,
  extractAudioStep,
  cleanAudioStep,
  ...modifiedAudioPipelineSteps,
];

export const processVideo = async (metadata: FileMetadata & GenericObject) => {
  const newMetadata = await processPipeline(metadata, videoPipelineSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
