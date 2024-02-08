import chalk from "chalk";
import { z } from "zod";

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

export interface Pipeline<Input, Output> {
  name: string;
  input: Input;
  steps: Step<any, any>[];
  tag?: string;
}

export interface Step<Input, Output> {
  name: string;
  inputType: z.ZodType<Input>;
  outputType: z.ZodType<Output>;
  validate?: (input: Output) => Promise<boolean>;
  run: (input: Input) => Promise<Output>;
}

// const runPipelineStep =

export const processPipeline = async <Input>(
  input: Input,
  steps: Step<any, any>[],
  tag?: string
): Promise<any> => {
  let output = JSON.parse(JSON.stringify(input));

  for (const step of steps) {
    const parsedInput = step.inputType.safeParse(output);
    if (!parsedInput.success) {
      throw new Error(
        `Input to step is not valid.\nError: ${parsedInput.error.message}`
      );
    }

    // if we can parse the output type of the step, we can skip it if valid
    // console.log("processing output", output);
    const parsedOutput = step.outputType.safeParse(output);
    if (parsedOutput.success) {
      const isValid = step.validate
        ? await step.validate(parsedOutput.data)
        : true;

      if (isValid) {
        // console.log(`Skipping step ${step.name}`);
        continue;
      }
    } else {
      console.log(`Couldn't parse output of step ${step.name}`);
      console.log(parsedOutput.error.message);
    }

    console.log(`Running step ${step.name}`);
    const newOutput = await step.run(output);
    const parsedNewOutput = step.outputType.safeParse(newOutput);
    if (!parsedNewOutput.success) {
      console.error(
        // `Output of step is not valid.\nOutput: ${JSON.stringify(
        //   newOutput
        // )}\nStep: ${step.name}\nExpected: ${JSON.stringify(step.outputType)}`
        chalk.red(
          `Output of step is not valid.\nError: ${parsedNewOutput.error.message}`
        )
      );
      // TODO should not return early, but figure out best course of action
      return output;
    }
    output = newOutput;
  }

  // console.log(`Finished processing pipeline ${tag ?? ""}`);

  return output;
};
