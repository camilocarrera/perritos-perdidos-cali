import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const id = context.params.id;

  if (!id) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const imagesStore = getStore("images");
    const result = await imagesStore.getWithMetadata(id, { type: "arrayBuffer" });

    if (!result) {
      return new Response("Not found", { status: 404 });
    }

    const contentType = (result.metadata?.contentType as string) || "image/jpeg";

    return new Response(result.data, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Not found", { status: 404 });
  }
};

export const config: Config = {
  path: "/api/image/:id",
};
