import { z } from "zod";
import { validateAuthToken } from "../..";
import { ChatModelsEnum } from "../../../cognition/inference";

export const InstallDataSchema = z.object({
  systemPrompt: z
    .string()
    .optional()
    .default(
      "you are a helpful assistant. a person is going to ask you a question about some data. respond to their question using the data. respond only in JSON."
    ),
  prompt: z.string(),
  mode: z.enum(["each"]).default("each"),
  model: ChatModelsEnum.optional().default("mixtral"),
});

export type InstallData = z.infer<typeof InstallDataSchema>;

export const InstallRequestSchema = InstallDataSchema.extend({
  app: z.string(),
  // run over existing?
  // filters, only on certain data
});

const INSTALLED_TRANSFORMS_PATH = `${process.env
  .BRAIN_STORAGE_ROOT!}/transforms.json`;

// TODO this is really messy. Would really want to be having unique ids.
export let installedTransforms: Record<string, InstallData> = {};

export const populateInstalledTransforms = async () => {
  if (!INSTALLED_TRANSFORMS_PATH) return;
  try {
    installedTransforms = await Bun.file(INSTALLED_TRANSFORMS_PATH).json();
  } catch (e) {
    console.error("Error populating installed transforms: ", e);
  }
};

export const handleInstallRequest = async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { app, ...params } = InstallRequestSchema.parse(body);

  // save to transforms.json
  if (!installedTransforms[app]) {
    installedTransforms[app] = {
      ...params,
    };
    Bun.write(INSTALLED_TRANSFORMS_PATH, JSON.stringify(installedTransforms));
  } else {
    return new Response(JSON.stringify({ result: "Already installed" }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ result: "Installed" }), { status: 200 });
};
