import { BunFile } from "bun";
import { z } from "zod";
import mime from "mime";
import fs from "fs";
import { hash } from "../misc/misc";

export const FileMetadataSchema = z.object({
  hash: z.string(),
  type: z.string(),
  ext: z.string(),
  created: z.number(),
  added: z.number(),
  originalName: z.string(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const getFilePath = (metadata: FileMetadata) => {
  return `${process.env.BRAIN_STORAGE_ROOT!}/data/${metadata.hash}/data.${
    metadata.ext
  }`;
};

const FileInfoSchema = z.object({
  path: z.string(),
  dir: z.string(),
  ext: z.string(),
  hash: z.string(),
  mime: z.string(),
  status: z.enum(["new", "exists"]),
});

export type FileInfo = z.infer<typeof FileInfoSchema>;
export type FileStatus = z.infer<typeof FileInfoSchema>["status"];

export const hashFile = async (file: File | BunFile) => {
  const buffer = await file.arrayBuffer();
  return hash(buffer);
};

export const getFileInfo = async (metadata: FileMetadata) => {
  const path = getFilePath(metadata);
  const ext = path.split(".").pop()!;
  const mimeType = mime.getType(path)!;

  return {
    path,
    dir: path.split("/").slice(0, -1).join("/"),
    ext,
    hash: metadata.hash,
    mime: mimeType,
    status: "exists" as const,
  };
};

export const storeFile = async (file: File | BunFile): Promise<FileInfo> => {
  let fi: FileInfo;
  let status: FileStatus = "new";
  const ext = file.name?.split(".").pop()!;
  const hash = await hashFile(file);
  const name = `${hash}`;
  const mimeType = mime.getType(name)!;
  const dir = `${process.env.BRAIN_STORAGE_ROOT!}/data/${name}`;
  const path = `${dir}/data.${ext}`;

  // if the file doesnt exist, make sure to create it
  if (!fs.existsSync(path)) {
    fs.mkdirSync(dir, { recursive: true });
  } else {
    console.log(`📁 file with hash ${hash} already exists`);
    status = "exists";
    // TODO further handling
  }

  await Bun.write(path, file);

  return {
    path,
    dir,
    ext,
    hash,
    mime: mimeType,
    status,
  };
};
