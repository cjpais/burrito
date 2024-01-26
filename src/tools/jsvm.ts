import vm from "vm";
import { metadataList } from "../server";
import { generateCompletion } from "../cognition/openai";
import { CODE_SYSTEM_PROMPT } from "../misc/prompts";
import { hash } from "../misc/misc";
import fs from "fs";

const CODE_CACHE_PATH = `${process.env
  .BRAIN_STORAGE_ROOT!}/codeCompletionCache.json`;

export let codeCompletionCache: Record<string, string> = {};

const populateCodeCache = async () => {
  if (!fs.existsSync(CODE_CACHE_PATH)) return;
  try {
    const fileCodeCache = await Bun.file(CODE_CACHE_PATH).text();
  } catch (e) {
    console.error("Error populating code cache: ", e);
  }
};

// populate codeCompletionCache from disk
populateCodeCache();

export const executeQuery = async (query: string) => {
  const queryHash = hash(query);
  let code = codeCompletionCache[queryHash];

  if (!code) {
    console.log("generating code completion");
    // const completion = await generateCompletion(CODE_SYSTEM_PROMPT, query);
    const codeCompletion = (await generateCompletion(
      CODE_SYSTEM_PROMPT,
      query,
      {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The code to execute",
          },
        },
        required: ["code"],
      },
      "gpt-4-1106-preview"
    )) as string;
    try {
      code = JSON.parse(codeCompletion as string).code;
    } catch {
      console.error("Error parsing code completion: ", codeCompletion);
    }
    codeCompletionCache[queryHash] = code;
    Bun.write(CODE_CACHE_PATH, JSON.stringify(codeCompletionCache));
  }

  console.log("Executing code: ", code);
  const execResult = execute(code, metadataList);
  const result = execResult ? execResult : { text: code };
  return result;
};

export const execute = (code: string, data: any) => {
  const script = new vm.Script(code);
  const context = vm.createContext({ console, data });
  const results = script.runInContext(context);
  return results;
};
