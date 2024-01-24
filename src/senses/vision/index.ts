import { Step, processPipeline } from "../../cognition/pipeline";
import { FileMetadata } from "../../memory/files";
import { metadataList } from "../../server";
import { GenericObject } from "../../server/handlers";
import { getMetadataStep } from "../hearing/steps/0a.getMetadata";
import { compressImageStep } from "./steps/0.compressImage";
import { reverseGeocodeStep } from "./steps/1.reverseGeocode";
import { captionImageStep } from "./steps/2.captionImage";
import { titleImageStep } from "./steps/3.titleImage";
import { embedImageStep } from "./steps/4.embedImage";

const visionPipelineSteps: Step<any, any>[] = [
  getMetadataStep,
  compressImageStep,
  reverseGeocodeStep,
  captionImageStep,
  titleImageStep,
  embedImageStep,
];

export const processVision = async (metadata: FileMetadata & GenericObject) => {
  const newMetadata = await processPipeline(metadata, visionPipelineSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
