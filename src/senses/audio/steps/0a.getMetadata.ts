import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { FileMetadataSchema, getFileInfo } from "../../../memory/files";
import { cleanAudio, getMediaFileInfo } from "../../../external/ffmpeg";
import fs from "fs";
import exifr from "exifr";
import dayjs from "dayjs";

type Metadata = z.infer<typeof FileMetadataSchema & any>;

const parseQuicktimeISO6709 = (location: string) => {
  const regex = /([+-]?\d+\.\d+)([+-]\d+\.\d+)([+-]\d+\.\d+)/;
  const matches = location.match(regex);
  console.log("matches", matches);

  if (matches) {
    return {
      latitude: matches[1].replace("+", ""),
      longitude: matches[2].replace("+", ""),
      altitude: matches[3].replace("+", ""),
    };
  } else {
    return {
      latitude: null,
      longitude: null,
      altitude: null,
    };
  }
};

export const getMetadataStep: Step<Metadata, Metadata> = {
  name: "getMetadata",
  inputType: FileMetadataSchema,
  outputType: FileMetadataSchema,
  validate: async (metadata) => {
    // if (metadata.type === "video") {
    //   return false;
    // }
    // if the created and added times are the same we should attempt to get the real creation time
    return metadata.created === metadata.added ? false : true;
  },
  run: async (metadata: Metadata) => {
    const fileInfo = await getFileInfo(metadata);

    // TODO should we just store entire raw EXIF/Probe blob?

    if (metadata.type === "audio") {
      const probe = await getMediaFileInfo(fileInfo.path);
      if (probe.format.tags?.creation_time) {
        metadata.created = Math.floor(
          new Date(probe.format.tags.creation_time).getTime() / 1000
        );
      }
    } else if (metadata.type === "video") {
      const probe = await getMediaFileInfo(fileInfo.path);

      const created = probe.format.tags?.["com.apple.quicktime.creationdate"];
      if (created) {
        metadata.created = dayjs(created).unix();
      }

      const rawLocation = probe.format.tags?.[
        "com.apple.quicktime.location.ISO6709"
      ] as string | undefined;

      if (rawLocation) {
        console.log("raw location", rawLocation);
        const { latitude, longitude, altitude } =
          parseQuicktimeISO6709(rawLocation);
        metadata.latitude = latitude;
        metadata.longitude = longitude;
        metadata.altitude = altitude;
      }

      const make = probe.format.tags?.["com.apple.quicktime.make"];
      const model = probe.format.tags?.["com.apple.quicktime.model"];

      if (make && model) {
        metadata.video = {};
        metadata.video.camera = `${make} ${model}`;
      }
    } else if (metadata.type === "image") {
      const file = await Bun.file(fileInfo.path).arrayBuffer();
      if (metadata.ext !== "webp") {
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
    }

    return metadata;
  },
};
