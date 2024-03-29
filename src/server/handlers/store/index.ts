import { colorType, validateAuthToken } from "../..";
import {
  FileInfo,
  FileMetadata,
  FileMetadataSchema,
  hashFile,
  storeFile,
} from "../../../memory/files";
import { processAudio } from "../../../senses/audio";
import { processText } from "../../../senses/text";
import { processImage } from "../../../senses/image";
import { processVideo } from "../../../senses/video";
import { GenericObject, RequestMetadataSchema } from "../../handlers";
import { sendMessage } from "../../../external/jared";
import { installedTransforms } from "../install";
import { transformEach } from "../transform/transform";
import { getSimpleData } from "../../../misc/misc";

const activeRequests = new Map<string, boolean>();

type Metadata = FileMetadata & GenericObject;

type PipelineFunction = (metadata: Metadata) => Promise<Metadata>;

export const storePipelines = new Map<string, PipelineFunction>([
  ["audio", processAudio],
  ["text", processText],
  ["video", processVideo],
  ["image", processImage],
]);

const runStorePipeline = async (metadata: Metadata, fileInfo: FileInfo) => {
  const start = Date.now();

  // TODO make pipeline a class or refactor to some schema to 'install' a pipeline
  let pipeline = storePipelines.get(metadata.type)!;
  metadata = await pipeline(metadata);

  // const transformsToRun = Object.keys(installedTransforms).filter(

  // TODO this is a hack to avoid touching pipeline before refactor
  const transforms = await Promise.all(
    Object.entries(installedTransforms).map(async ([app, params]) => ({
      app: app,
      transform: await transformEach([getSimpleData(metadata)], {
        ...params,
        completionType: "json",
        debug: false,
      }),
    }))
  );

  console.log("transforms", transforms);

  transforms.forEach((t) => {
    metadata.transforms = metadata.transforms || {};
    metadata.transforms[t.app] = t.transform[0].completion;
  });

  console.log("metadata", metadata);

  console.log(
    `${colorType(metadata.type)} pipeline for ${metadata.hash} took ${
      Date.now() - start
    }ms`
  );
  if (metadata.hash) activeRequests.delete(metadata.hash);

  console.log("here");
  const jsonData = JSON.stringify(metadata);
  console.log("here2");
  Bun.write(`${fileInfo.dir}/metadata.json`, JSON.stringify(metadata));
  console.log("here3");

  // hit callbacks
  await sendMessage(`Added your ${metadata.type} to the burrito!`);
  sendMessage(
    `https://${process.env.BRAIN_NAME}.burrito.place/${metadata.hash}`
  );
};

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
    const { type, callbackUrl, userData } = RequestMetadataSchema.parse(
      JSON.parse((formData.get("metadata") as string) ?? "{}")
    );
    console.log("User data", userData);
    let mimeType = file.type;
    // hack, if file is .MOV make sure the type is video
    if (file.name.split(".").pop()?.toLowerCase() === "mov")
      mimeType = "video/quicktime";

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
    metadata.userData = userData;

    if (fileInfo.status === "exists") {
      // load the metadata into the variable
      // TODO validate that it has anything.
      metadata = {
        ...metadata,
        ...JSON.parse(await Bun.file(`${fileInfo.dir}/metadata.json`).text()),
      };

      sendMessage("you've already added this file!");

      return new Response(JSON.stringify(metadata), {
        status: 200,
        headers: {
          contentType: "application/json",
        },
      });
    }

    const parsedMetadata: FileMetadata & GenericObject =
      FileMetadataSchema.passthrough().parse(metadata);

    // run steps
    if (storePipelines.has(basicType)) {
      runStorePipeline(parsedMetadata, fileInfo);
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
    if (fileInfo) {
      console.log("fileInfo", fileInfo);
      // write out metadata.json
      Bun.write(`${fileInfo.dir}/metadata.json`, JSON.stringify(metadata));
    }
  }
};
