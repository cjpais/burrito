import vm from "vm";
import { metadataList } from "../server";
import { generateCompletion } from "../cognition/openai";
import { CODE_SYSTEM_PROMPT } from "../../prompts";

export let codeCompletionCache: Map<string, string> = new Map();

export const executeQuery = async (query: string) => {
  let codeCompletion = codeCompletionCache.get(query);

  if (!codeCompletion) {
    console.log("generating code completion");
    // const completion = await generateCompletion(CODE_SYSTEM_PROMPT, query);
    codeCompletion = (await generateCompletion(
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
    codeCompletionCache.set(query, codeCompletion);
  }

  const code = JSON.parse(codeCompletion as string).code;
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
