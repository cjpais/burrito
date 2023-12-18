import chalk from "chalk";
import { z } from "zod";
import { FileInfo } from "../memory/files";

export const pipelineLog = (id: string, message: string) =>
  console.log(
    `🕳️ ${chalk.yellow(`[${id.substring(0, 7)}]:`)} ${chalk.blue(message)}`
  );

export function merge(source: any, target: any) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === `object`) {
      // target[key] ??= new val.__proto__.constructor();
      if (!target[key]) {
        const prototype = Object.getPrototypeOf(val);
        target[key] = prototype ? new prototype.constructor() : {};
      }
      merge(val, target[key]);
    } else {
      target[key] = val;
    }
  }
  return target; // we're replacing in-situ, so this is more for chaining than anything else
}

export interface Step<InputType, OutputType> {
  name: string;
  inputType: z.ZodType<InputType>;
  outputType: z.ZodType<OutputType>;
  validate?: (metadata: OutputType) => Promise<boolean>;
  run: (metadata: InputType, fileInfo: FileInfo) => Promise<OutputType>;
}
