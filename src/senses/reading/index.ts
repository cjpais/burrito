import { FileInfo, FileMetadata } from "../../memory/files";
import { GenericObject } from "../../server/handlers";

const readingSteps = [];

export const processReading = async (
  metadata: FileMetadata & GenericObject,
  fileInfo: FileInfo
) => {
  console.log("processing reading");
  return metadata;
};
