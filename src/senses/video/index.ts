import { Step, processPipeline } from "../../cognition/pipeline";
import { FileMetadata } from "../../memory/files";
import { metadataList } from "../../server";
import { GenericObject } from "../../server/handlers";

const videoPipelineSteps: Step<any, any>[] = [];

export const processVideo = async (metadata: FileMetadata & GenericObject) => {
  const newMetadata = await processPipeline(metadata, videoPipelineSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
