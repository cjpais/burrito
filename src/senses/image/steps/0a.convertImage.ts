import { z } from "zod";
import {
  FileMetadata,
  FileMetadataSchema,
  getFileInfo,
} from "../../../memory/files";
import { Step } from "../../../cognition/pipeline";
import fs from "fs";

const OutputSchema = FileMetadataSchema.extend({
  converted: z.string().optional(),
});

type Output = z.infer<typeof OutputSchema>;

export const convertImageStep: Step<FileMetadata, Output> = {
  name: "convertImage",
  inputType: FileMetadataSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);

    if (fileInfo.ext.toLowerCase() === "heic") {
      return fs.existsSync(`${fileInfo.dir}/converted.jpg`);
    }

    return true;
  },
  run: async (metadata) => {
    const fileInfo = await getFileInfo(metadata);

    if (fileInfo.ext.toLowerCase() !== "heic") {
      return metadata;
    }

    const image = Bun.file(fileInfo.path);
    const form = new FormData();
    form.append("file", image, `data.${fileInfo.ext}`);

    const response = await fetch(process.env.IMAGINARY_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GEPPETTO_SECRET}`,
      },
      body: form,
    });

    const converted = await response.arrayBuffer();
    Bun.write(`${fileInfo.dir}/converted.jpg`, converted);

    return {
      ...metadata,
      converted: "converted.jpg",
    };
  },
};
