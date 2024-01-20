import { validateAuthToken } from "../..";
import { getMediaFileInfo } from "../../../external/ffmpeg";
import {
  FileInfo,
  FileMetadata,
  FileMetadataSchema,
  hashFile,
  storeFile,
} from "../../../memory/files";
import { processHearing } from "../../../senses/hearing";
import { processReading } from "../../../senses/reading";
import { GenericObject, RequestMetadataSchema } from "../../handlers";

const activeRequests = new Map<string, boolean>();

type PipelineFunction = (
  metadata: FileMetadata & GenericObject
) => Promise<FileMetadata & GenericObject>;

export const storePipelines = new Map<string, PipelineFunction>([
  ["audio", processHearing],
  ["text", processReading],
]);

// TODO note this probably needs to be able to be sent a pipeline as well.
export const handleStoreRequest = async (request: Request) => {
  // TODO turn this into a pipeline?
  let metadata: Partial<FileMetadata> & GenericObject = {};
  let fileInfo: FileInfo | null = null;

  if (request.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  console.log("form data", formData);

  // TODO move this to a pipeline too.
  try {
    const file = formData.get("data") as File;
    metadata.hash = await hashFile(file);

    // check if we are already processing this file
    if (activeRequests.has(metadata.hash)) {
      return new Response("File already being processed", { status: 200 });
    } else {
      activeRequests.set(metadata.hash, true);
    }

    // TODO handle this error in a reasonable way
    const { type } = RequestMetadataSchema.parse(
      JSON.parse((formData.get("metadata") as string) ?? "{}")
    );
    const mimeType = file.type;
    const basicType = mimeType?.split("/")[0];

    if (type && basicType !== type) {
      return new Response(
        `File type ${mimeType} does not match metadata type ${type}`,
        { status: 400 }
      );
    }

    if (!mimeType || !basicType)
      return new Response(
        `Failed to infer type. No type found for ${mimeType}.`,
        { status: 400 }
      );

    metadata.type = basicType;

    // if the file is stored sucessfully we can
    fileInfo = await storeFile(file);
    metadata.ext = fileInfo.ext;

    metadata.added = Math.floor(new Date().getTime() / 1000);
    metadata.created = metadata.added;
    metadata.originalName = file.name;

    console.log(type);
    if (basicType === "audio") {
      // probe the file to get the created date
      // TODO move this to a pipeline
      const probe = await getMediaFileInfo(fileInfo.path);
      if (probe.format.tags?.creation_time) {
        metadata.created = Math.floor(
          new Date(probe.format.tags.creation_time).getTime() / 1000
        );
      }
      // metadata.created = probe.streams[0].
    }

    if (fileInfo.status === "exists") {
      // load the metadata into the variable
      // TODO validate that it has anything.
      metadata = {
        ...metadata,
        ...JSON.parse(await Bun.file(`${fileInfo.dir}/metadata.json`).text()),
      };
    }

    const parsedMetadata: FileMetadata & GenericObject =
      FileMetadataSchema.passthrough().parse(metadata);

    // run steps
    if (storePipelines.has(basicType)) {
      let pipeline = storePipelines.get(basicType)!;
      metadata = await pipeline(parsedMetadata);
    } else {
      return new Response(`No pipeline for type ${basicType}`, { status: 400 });
    }

    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: {
        contentType: "application/json",
      },
    });
  } catch (e) {
    console.log("Internal Server Error", e);
    return new Response(`Internal Server Error: ${e}`, { status: 500 });
  } finally {
    if (metadata.hash) activeRequests.delete(metadata.hash);
    if (fileInfo) {
      // write out metadata.json
      Bun.write(`${fileInfo.dir}/metadata.json`, JSON.stringify(metadata));
    }
  }
};
