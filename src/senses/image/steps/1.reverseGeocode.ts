import { z } from "zod";
import { Step, merge } from "../../../cognition/pipeline";
import { generateCompletion } from "../../../cognition/openai";

const API_URL = `https://us1.locationiq.com/v1/reverse`;

const InputSchema = z.object({
  latitude: z.number().or(z.string()).optional(),
  longitude: z.number().or(z.string()).optional(),
});

const OutputSchema = z.object({
  latitude: z.number().or(z.string()).optional(),
  longitude: z.number().or(z.string()).optional(),
  location: z.string().optional(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

export const reverseGeocodeStep: Step<Input, Output> = {
  name: "reverseGeocode",
  inputType: InputSchema,
  outputType: OutputSchema,
  validate: async (metadata) => {
    // return false;
    if (metadata.latitude && metadata.longitude) {
      return metadata.location ? true : false;
    }
    return true;
  },
  run: async (metadata) => {
    let output: Output = {
      latitude: metadata.latitude,
      longitude: metadata.longitude,
    };
    if (metadata.latitude && metadata.longitude) {
      const response = await fetch(
        `${API_URL}?key=${process.env.LOCATION_IQ_API_KEY}&lat=${metadata.latitude}&lon=${metadata.longitude}&zoom=14&format=json`
      )
        .then((res) => res.json())
        .catch((err) => {
          console.log("ERROR", err);
        });

      const rawLocation = response.display_name;

      output.location = await generateCompletion(
        `you are a helpful assistant. you follow instructions carefully

      you are to take the location text given and simplify it.
      you output only the simplified text. be as specific as possible while not revealing addresses. Output with dash inbeween the two most relevant places in the string`,
        rawLocation,
        null,
        "gpt-3.5-turbo-1106"
      );
      console.log("gpt location", output.location, "\ninput", rawLocation);
    }

    const o = merge(output, metadata);
    console.group(o);

    return o;
  },
};
