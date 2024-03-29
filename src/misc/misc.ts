import dayjs from "dayjs";
import { FileMetadata } from "../memory/files";
import { GenericObject } from "../server/handlers";

export type StringOrBuffer = string | Buffer;

export const hash = (input: StringOrBuffer) => {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(input);
  return hasher.digest("hex");
};

export const rateLimitedQueryExecutor = <T>(
  queries: (() => Promise<T>)[],
  maxPerSecond: number
): Promise<T[]> => {
  if (queries.length === 0) {
    return Promise.resolve([]);
  }
  console.log(
    `Rate limiting ${queries.length} queries to ${maxPerSecond} per second`
  );
  let index = 0; // Track the current index of the queries array
  const allPromises: Promise<T>[] = []; // Store all initiated query promises

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (index >= queries.length) {
        clearInterval(intervalId); // Stop the interval when all queries are initiated
        Promise.all(allPromises).then(resolve).catch(reject); // Wait for all queries to complete
        return;
      }

      // Initiate up to 'maxPerSecond' queries in parallel and store their promises
      for (let i = 0; i < maxPerSecond && index < queries.length; i++) {
        console.log(`Initiating query ${index + 1} of ${queries.length}`);
        const queryPromise = queries[index++]();
        allPromises.push(queryPromise);
        queryPromise.catch(console.error); // Optionally log errors without stopping other queries
      }
    }, 1000); // Set the interval to 1 second (1000 milliseconds)
  });
};

export const writeHashMetadata = (
  hash: string,
  metadata: Partial<FileMetadata> & GenericObject
) => {
  Bun.write(
    `${process.env.BRAIN_STORAGE_ROOT}/data/${hash}/metadata.json`,
    JSON.stringify(metadata)
  );
};

export const getSimpleData = (d: FileMetadata & GenericObject) => {
  return {
    created: d.created,
    date: dayjs(d.created * 1000).format("MMM D, YYYY - h:mma"),
    hash: d.hash,
    title: d.title,
    summary: d.summary,
    description: d.description,
    caption: d.caption,
    userData: d.userData,
    text: d.audio ? d.audio.transcript : "",
  };
};
