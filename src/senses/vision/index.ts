import { Step, processPipeline } from "../../cognition/pipeline";
import { FileMetadata } from "../../memory/files";
import { metadataList } from "../../server";
import { GenericObject } from "../../server/handlers";
import { getMetadataStep } from "../hearing/steps/0a.getMetadata";
import { reverseGeocodeStep } from "./steps/1.reverseGeocode";
import { captionImageStep } from "./steps/2.captionImage";
import { titleImageStep } from "./steps/3.titleImage";

const visionPipelineSteps: Step<any, any>[] = [
  getMetadataStep,
  reverseGeocodeStep,
  captionImageStep,
  titleImageStep,
];

export const processVision = async (metadata: FileMetadata & GenericObject) => {
  const newMetadata = await processPipeline(metadata, visionPipelineSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
