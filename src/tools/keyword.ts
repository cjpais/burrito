import { innerProduct } from "ml-distance/lib/distances";
import { inference } from "../cognition/inference";

export const keywordSearch = async (keywords: string[], data: any[]) => {
  if (keywords.length === 0 || data.length === 0)
    return data.map(({ embedding, ...d }) => d);

  const validData = data.filter((d) => d.embedding);

  const keywordEmbedding = await inference.embed({
    texts: keywords,
    model: "ada",
  });

  const keywordSimilarities = validData
    .map((d) => {
      // Calculate the average similarity across all keyword embeddings
      const averageSimilarity =
        keywordEmbedding.reduce((total, embedding) => {
          return total + innerProduct(d.embedding, embedding);
        }, 0) / keywordEmbedding.length;

      return {
        ...d,
        similarity: averageSimilarity,
      };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity);
  const topSimilarity = keywordSimilarities[0].similarity;
  console.log("top similarity", topSimilarity);
  const filteredSimilarity = keywordSimilarities
    .filter((d) => topSimilarity - d.similarity < 0.04)
    .map(({ similarity, embedding, ...d }) => d);

  return filteredSimilarity;
};
