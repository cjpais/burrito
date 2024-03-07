import { Step } from "../../../cognition/pipeline";
import { ChunkEmbeddings, ChunkEmbeddingsSchema } from "./4.getChunkEmbeddings";
import { collection, embed } from "../../../memory/vector";

export const embedChunksStep: Step<ChunkEmbeddings, ChunkEmbeddings> = {
  name: "embedChunks",
  inputType: ChunkEmbeddingsSchema,
  outputType: ChunkEmbeddingsSchema,
  validate: async (metadata) => {
    // TODO ensure the embeddings are in the vdb
    const ids = metadata.audio.chunks.map(
      (chunk) => `${metadata.hash}_${chunk.number}`
    );
    const result = await collection.get({ ids });
    if (result.ids.length !== ids.length) {
      return false;
    }

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
    const meta = [];

    for (let i = 0; i < transcriptions.length; i++) {
      meta.push({
        hash: metadata.hash,
        chunk: i,
        type: metadata.type,
        added: metadata.added,
        created: metadata.created,
      });
    }

    await embed(transcriptions, ids, meta, embeddings);

    return metadata;
  },
};
