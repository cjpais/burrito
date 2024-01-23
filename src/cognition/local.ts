import { FileMetadata, getFileInfo } from "../memory/files";

export const generateLocalImageCompletion = async ({
  systemPrompt,
  prompt,
  image,
  maxTokens,
}: {
  systemPrompt?: string;
  prompt?: string;
  image: FileMetadata;
  maxTokens?: number;
}) => {
  const fileInfo = await getFileInfo(image);
  const buf = await Bun.file(fileInfo.path).arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  const reqBody = JSON.stringify({
    stream: false,
    prompt: `A chat between a curious human and an artifical intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.\nUSER:[img-10]caption this image\nASSISTANT:`,
    stop: ["</s>", "Llama:", "User:"],
    temperature: 0.2,
    imageData: [
      {
        data: b64,
        id: 10,
      },
    ],
  });
  const resp = await fetch("https://caption.burrito.place/completion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: reqBody,
  })
    .then((r) => r.json())
    .catch((e) => {
      console.log("error", e.message);
    });

  return resp.content;
};
