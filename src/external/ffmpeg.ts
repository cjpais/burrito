import ffmpeg, { ffprobe } from "fluent-ffmpeg";

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

export const cleanAudio = async (
  input: string,
  output: string
): Promise<void> => {
  // TODO set low pass dependent on sample rate
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .audioFilter(
        "silenceremove=start_periods=1:stop_periods=-1:stop_duration=5:start_threshold=-40dB:stop_threshold=-40dB"
      )
      // .audioFilter("highpass=f=80")
      // .audioFilter("lowpass=f=8000")
      .audioFilter("acompressor")
      .audioFilter("loudnorm=I=-16:TP=-1.5:LRA=11")

      // Event: on process completion
      .on("end", () => {
        console.log(`Audio cleaned and saved to ${output}`);
        resolve();
      })

      // Event: on error
      .on("error", (err) => {
        console.error(`An error occurred: ${err.message}`);
        reject(err);
      })

      // Output the processed file
      .save(output);
  });
};

export const compressImage = async (
  input: string,
  output: string,
  size?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .size("1024x?") // Scale the image to a width of 1024 and keep the aspect ratio
      .withOutputOption("-q:v 2") // Set the quality factor for the output
      .on("end", () => {
        console.log(`Image compressed and saved to ${output}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`An error occurred: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

export const compressVideo = async (
  input: string,
  output: string,
  size?: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .videoFilter("scale=w='if(gt(iw,ih),1280,-2)':h='if(gt(iw,ih),-2,1280)'")
      .videoCodec("libx264")
      .addOptions(["-crf 23", "-preset medium"])
      .outputOptions("-pix_fmt yuv420p")
      .output(output)
      .on("end", () => {
        console.log(`Video compressed and saved to ${output}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`An error occurred: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

export const extractAudio = async (
  input: string,
  output: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffprobe(input, (err, metadata) => {
      if (err) {
        console.error("Error reading file metadata:", err);
        reject(err);
      }

      const hasAudio = metadata.streams.some(
        (stream) => stream.codec_type === "audio"
      );
      if (!hasAudio) {
        console.log("No audio stream found in input file");
        Bun.write(output, "").then(() => resolve());
        return;
      }
    });

    ffmpeg(input)
      .output(output)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .on("end", () => {
        console.log(`Audio extracted and saved to ${output}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`An error occurred: ${err.message}`);
        reject(err);
      })
      .run();
  });
};
