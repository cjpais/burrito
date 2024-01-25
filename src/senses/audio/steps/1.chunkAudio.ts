import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import {
  FileInfo,
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
  getFilePath,
} from "../../../memory/files";
import { getMediaFileInfo, processChunk } from "../../../external/ffmpeg";
import { pipelineLog } from "../../../cognition/pipeline";
import fs from "fs";
import { CleanAudio, CleanAudioSchema } from "./0b.cleanAudio";

export const InitialChunkSchema = z.object({
  filename: z.string(),
  number: z.number(),
});

export const ChunkMetadataSchema = z.object({
  audio: z.object({
    durationSec: z.number(),
    chunkSizeSec: z.number(),
    chunks: z.array(InitialChunkSchema),
  }),
});

export const InitialAudioMetadataSchema =
  CleanAudioSchema.and(ChunkMetadataSchema);
export type InitialAudioMetadata = z.infer<typeof InitialAudioMetadataSchema>;

const chunkAudio = async (
  src: string,
  destPath: string,
  lenSec: number = 5 * 60
  //   { overlapSec = 30 }: { overlapSec?: number }
): Promise<z.infer<typeof ChunkMetadataSchema>> => {
  let newMetadata: z.infer<typeof ChunkMetadataSchema>;
  console.log(`🔪 Chunking ${src}`);
  const ext = src.split(".").pop();

  const metadata = await getMediaFileInfo(src);

  const duration = metadata.format.duration!;
  const durationStr = `${Math.floor(duration / 60)}min:${Math.floor(
    duration % 60
  )}sec (${duration}sec)`;
  const numChunks = Math.ceil(duration / lenSec);

  console.log(
    `🔪 Splitting ${durationStr} into ${numChunks} ${lenSec / 60}min chunks`
  );

  const outputFiles: { filename: string; number: number }[] = [];
  for (let i = 0; i < numChunks; i++) {
    const filename = `chunk_${i}.${ext}`;
    const outputFileName = `${destPath}/${filename}`;
    await processChunk(src, i * lenSec, lenSec, outputFileName);
    outputFiles.push({ filename: filename, number: i });
  }

  newMetadata = {
    audio: {
      durationSec: duration,
      chunkSizeSec: lenSec,
      chunks: outputFiles,
    },
  };

  return newMetadata;
};

const validateChunkAudioStep = async (
  metadata: InitialAudioMetadata
): Promise<boolean> => {
  const fileInfo = await getFileInfo(metadata);
  const info = await getMediaFileInfo(metadata.audio.cleanedFile);
  // validate duration is the same
  const duration = info.format.duration;
  if (
    !duration ||
    Math.ceil(duration) !== Math.ceil(metadata.audio.durationSec)
  ) {
    console.log(
      `duration doesnt match. got ${metadata.audio.durationSec} expected ${duration}`
    );
    return false;
  }

  const expectedNumChunks = Math.ceil(duration / metadata.audio.chunkSizeSec);
  if (metadata.audio.chunks.length !== expectedNumChunks) {
    console.log("number of chunks doesnt match");
    return false;
  }

  // determine the number of chunks from the original file
  for (let i = 0; i < metadata.audio.chunks.length; i++) {
    const chunk = metadata.audio.chunks[i];
    if (chunk.filename !== `chunk_${i}.${metadata.ext}`) {
      console.log("chunk filename doesnt match", chunk.filename);
      return false;
    }
    if (chunk.number !== i) return false;

    const chunkPath = `${fileInfo.dir}/${chunk.filename}`;
    if (!fs.existsSync(chunkPath)) {
      console.log("chunk doesnt exist", chunkPath);
      return false;
    }
  }

  return true;
};

export const chunkAudioStep: Step<CleanAudio, InitialAudioMetadata> = {
  name: "chunkAudio",
  inputType: CleanAudioSchema,
  outputType: InitialAudioMetadataSchema,
  validate: validateChunkAudioStep,
  run: async (metadata) => {
    pipelineLog(metadata.hash, "Chunking Audio");
    const fileInfo = await getFileInfo(metadata);
    const newMetadata = await chunkAudio(
      metadata.audio.cleanedFile,
      fileInfo.dir
    );
    return merge(metadata, newMetadata);
  },
};
