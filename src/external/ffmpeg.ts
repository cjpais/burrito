import ffmpeg from "fluent-ffmpeg";

export const getMediaFileInfo = async (filePath: string) => {
  const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        console.error("Error reading file metadata:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  if (!metadata.format) throw new Error("No format found");
  if (!metadata.format.duration) throw new Error("No duration found");

  return metadata;
};

export function processChunk(
  fileName: string,
  startTime: number,
  duration: number,
  outputFileName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(fileName)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputFileName)
      .on("end", () => {
        console.log(`Processed chunk: ${outputFileName}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Error processing chunk: ${outputFileName}`, err);
        reject(err);
      })
      .run();
  });
}
