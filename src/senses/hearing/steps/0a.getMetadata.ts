import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";
import { cleanAudio, getMediaFileInfo } from "../../../external/ffmpeg";
import fs from "fs";
import exifr from "exifr";
import dayjs from "dayjs";

type Metadata = z.infer<typeof FileMetadataSchema & any>;

export const getMetadataStep: Step<Metadata, Metadata> = {
  name: "getMetadata",
  inputType: FileMetadataSchema,
  outputType: FileMetadataSchema,
  validate: async (metadata) => {
    // if the created and added times are the same we should attempt to get the real creation time
    return metadata.created === metadata.added ? false : true;
  },
  run: async (metadata: Metadata) => {
    const fileInfo = await getFileInfo(metadata);

    // TODO should we just store entire raw EXIF/Probe blob?

    if (metadata.type === "audio" || metadata.type === "video") {
      const probe = await getMediaFileInfo(fileInfo.path);
      console.log(probe);
      if (probe.format.tags?.creation_time) {
        metadata.created = Math.floor(
          new Date(probe.format.tags.creation_time).getTime() / 1000
        );
      }
    } else if (metadata.type === "image") {
      const file = await Bun.file(fileInfo.path).arrayBuffer();
      const exif = await exifr.parse(file);
      const {
        Make,
        Model,
        DateTimeOriginal,
        // OffsetTimeOriginal,
        latitude,
        longitude,
      } = exif;
      metadata.created = dayjs(DateTimeOriginal).unix();
      latitude && (metadata.latitude = latitude);
      longitude && (metadata.longitude = longitude);
      metadata.image = {};
      Make && Model && (metadata.image.camera = `${Make} ${Model}`);
    }

    return metadata;
  },
};