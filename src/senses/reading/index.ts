import { FileMetadata } from "../../memory/files";
import { GenericObject } from "../../server/handlers";

const readingSteps = [];

export const processReading = async (
  metadata: FileMetadata & GenericObject
) => {
  console.log("processing reading");
  return metadata;
};
