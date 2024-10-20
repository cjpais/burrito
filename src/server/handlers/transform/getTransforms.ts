import { validateAuthToken } from "../..";
import { installedTransforms } from "../install";

export const handleGetTransformsRequest = async (request: Request) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!validateAuthToken(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(JSON.stringify(installedTransforms), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
