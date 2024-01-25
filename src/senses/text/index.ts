import { FileMetadata } from "../../memory/files";
import { GenericObject } from "../../server/handlers";

const readingSteps = [];

export const processText = async (metadata: FileMetadata & GenericObject) => {
  console.log("processing reading");
  return metadata;
};
