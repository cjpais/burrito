import dayjs from "dayjs";
import fs from "fs";

const CACHE_BASE_PATH = `${process.env.BRAIN_STORAGE_ROOT!}/cache`;

export type CachedCompletion<T = any> = {
  cachedAt: number;
  cacheFor: number;
  completion: T;
};

export class CompletionCache<T = any> {
  private cache: Record<string, CachedCompletion<T>>;
  private readonly cacheFor: number;
  private readonly cachePath: string;
  private readonly name: string;

  constructor({ name }: { name: string }) {
    this.name = name;
    this.cache = {};
    this.cacheFor = 60 * 60 * 24 * 7; // 1 week
    this.cachePath = `${CACHE_BASE_PATH}/${name}.json`;
    this.load();
  }

  public load = async () => {
    // if the file exists, load it
    if (fs.existsSync(this.cachePath)) {
      try {
        const rawCache = await Bun.file(this.cachePath).json();

        // TODO: go and evict everything from cache that is too old?

        this.cache = rawCache;

        console.log(`Loaded ${this.name} cache`);
      } catch (e) {
        console.error(`Error populating ${this.name} cache: `, e);
      }
    } else {
      // create the file
      fs.writeFileSync(this.cachePath, "{}");
      console.log(`Created ${this.name} cache`);
    }
  };

  public save = async () => {
    await Bun.write(this.cachePath, JSON.stringify(this.cache));
  };

  public get(key: string): CachedCompletion<T> | undefined {
    return this.cache[key];
  }

  public getValid(key: string): T | undefined {
    return this.cache[key]?.cachedAt + this.cache[key]?.cacheFor >
      dayjs().unix()
      ? this.cache[key].completion
      : undefined;
  }

  public set(key: string, value: T, cacheFor?: number): void {
    this.cache[key] = {
      cachedAt: dayjs().unix(),
      completion: value,
      cacheFor: cacheFor || this.cacheFor,
    };
    this.save();
  }
}
