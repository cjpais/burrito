import { processPipeline } from "../../cognition/pipeline";
import { FileMetadata } from "../../memory/files";
import { metadataList } from "../../server";
import { GenericObject } from "../../server/handlers";
import { getTextStep } from "./steps/0.getText";
import { summarizeTextStep } from "./steps/1.summarizeText";
import { titleTextStep } from "./steps/2.titleText";
import { embedTextStep } from "./steps/3.embedText";

const readingSteps = [
  getTextStep,
  summarizeTextStep,
  titleTextStep,
  embedTextStep,
];

export const processText = async (metadata: FileMetadata & GenericObject) => {
  const newMetadata = await processPipeline(metadata, readingSteps);
  metadataList.push(newMetadata);

  return newMetadata;
};
