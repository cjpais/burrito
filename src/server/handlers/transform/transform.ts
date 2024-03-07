import dayjs from "dayjs";
import { TransformRequest } from ".";
import { metadataList } from "../..";
import { extractJSON } from "../../../cognition";
import { inference } from "../../../cognition/inference";
import { writeHashMetadata } from "../../../misc/misc";

// TODO transform single may be helpful too.
export const transformEach = async <T extends { hash: string }>(
  data: T[],
  params: TransformRequest
) => {
  const results = await Promise.all(
    data.map(async (d) => ({
      hash: d.hash,
      debug: params.debug,
      completion: await inference.chat({
        systemPrompt: params.systemPrompt,
        prompt: `${params.prompt}\n\n${JSON.stringify(d, null, 2)}`,
        model: params.model,
        json: params.completionType === "json",
      }),
    }))
  );

  console.log("results", results);

  const response = results.map((r, i) => ({
    hash: r.hash,
    // modelPrompt: queries
    completion:
      params.completionType === "json"
        ? extractJSON(r.completion)
        : r.completion,
  }));
  // console.log(results);

  // do this async
  if (params.save && params.save.app) {
    response.map(async (r) => {
      // TODO, this is not thread safe.
      let entry = metadataList.find((m) => m.hash === r.hash);
      if (!entry.transforms) {
        entry.transforms = {};
      }

      entry.transforms[params.save!.app] = r.completion;

      // save back to the database
      writeHashMetadata(r.hash, entry);
    });
  }

  // let responseArr = [...response, ...existingResults];
  let responseArr = response;

  // TODO probably remove this, need some sort of logging solution
  if (params.debug) {
    responseArr = responseArr.map((r) => {
      const d = metadataList.find((m) => m.hash === r.hash);
      // const promptData = {}
      const promptData = {
        created: d.created,
        date: dayjs(d.created * 1000).format("MMM D, YYYY - h:mma"),
        hash: d.hash,
        title: d.title,
        summary: d.summary,
        description: d.description,
        caption: d.caption,
        userData: d.userData,
        text: d.audio ? d.audio.transcript : "",
      };

      return {
        ...r,
        prompt: `${params.prompt}\n\n${JSON.stringify(promptData, null, 2)}`,
      };
    });
  }

  return responseArr;
};

export const transformAll = async (params: any) => {};
