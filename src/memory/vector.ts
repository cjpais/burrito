import { ChromaClient, Collection, OpenAIEmbeddingFunction } from "chromadb";
import z from "zod";

export const Embedding = z.array(z.number());
export const client = new ChromaClient();

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY!,
});

export let collection: Collection;
try {
  collection = await client.createCollection({
    name: process.env.BRAIN_NAME!,
    embeddingFunction: embedder,
    metadata: { "hnsw:space": "cosine" },
  });
} catch {
  collection = await client.getCollection({
    name: process.env.BRAIN_NAME!,
    embeddingFunction: embedder,
  });
}

export const embed = async (
  text: string[],
  ids: string[],
  metadata: any[],
  embeddings?: number[][]
) =>
  await collection.add({
    ids: ids,
    metadatas: metadata,
    embeddings: embeddings,
    documents: text,
  });

export const query = async (text: string, nResults: number = 5) =>
  await collection.query({
    nResults,
    queryTexts: [text],
  });
