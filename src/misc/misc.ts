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
