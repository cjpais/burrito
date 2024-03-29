import vm from "vm";
import { metadataList } from "../server";
import { CODE_SYSTEM_PROMPT } from "../misc/prompts";
import { hash } from "../misc/misc";
import fs from "fs";
import { inference } from "../cognition/inference";

const CODE_CACHE_PATH = `${process.env
  .BRAIN_STORAGE_ROOT!}/codeCompletionCache.json`;

export let codeCompletionCache: Record<
  string,
  { code: string; query: string }
> = {};

export const populateCodeCache = async () => {
  if (!fs.existsSync(CODE_CACHE_PATH)) return;
  try {
    const fileCodeCache = await Bun.file(CODE_CACHE_PATH).text();
    codeCompletionCache = JSON.parse(fileCodeCache);
  } catch (e) {
    console.error("Error populating code cache: ", e);
  }
};

export const executeQuery = async (query: string, force: boolean = false) => {
  const queryHash = hash(query);
  let code = null;

  if (codeCompletionCache[queryHash] && !force) {
    if (codeCompletionCache[queryHash].code) {
      code = codeCompletionCache[queryHash].code;
    }
  }

  if (!code) {
    console.log("generating code completion");
    const codeCompletion = await inference.chat({
      systemPrompt: CODE_SYSTEM_PROMPT,
      prompt: query,
      model: "mixtral",
      json: true,
    });
    try {
      code = JSON.parse(codeCompletion as string).code;
    } catch {
      console.error("Error parsing code completion: ", codeCompletion);
    }
  }

  console.log("Executing code: ", code);
  const execResult = execute(code, metadataList);

  if (execResult) {
    codeCompletionCache[queryHash] = { code, query };
    Bun.write(CODE_CACHE_PATH, JSON.stringify(codeCompletionCache));
  }

  const result = execResult ? execResult : { text: code };
  return result;
};

export const execute = (code: string, data: any) => {
  const script = new vm.Script(code);
  const context = vm.createContext({ console, data });
  const results = script.runInContext(context);
  return results;
};
