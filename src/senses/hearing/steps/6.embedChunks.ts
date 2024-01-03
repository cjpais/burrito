import { z } from "zod";
import { generateEmbeddings } from "../../../cognition/openai";
import { Step, merge } from "../../../cognition/pipeline";
import { ChunkEmbeddings, ChunkEmbeddingsSchema } from "./4.getChunkEmbeddings";
import { embed } from "../../../memory/vector";

export const getChunkEmbeddingsStep: Step<ChunkEmbeddings, ChunkEmbeddings> = {
  name: "getChunkEmbeddings",
  inputType: ChunkEmbeddingsSchema,
  outputType: ChunkEmbeddingsSchema,
  validate: async (metadata) => {
    // TODO ensure the embeddings are in the vdb

    return true;
  },
  run: async (metadata) => {
    const transcriptions = metadata.audio.chunks.map(
      (chunk) => chunk.transcript
    );
    const ids = metadata.audio.chunks.map(
      (chunk) => `${metadata.hash}_${chunk.number}`
    );
    const embeddings = metadata.audio.chunks.map((chunk) => chunk.embedding);
    // const meta =

    // embed()

    return metadata;
  },
};
