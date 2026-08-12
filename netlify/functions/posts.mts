import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async () => {
  try {
    const postsStore = getStore("posts");
    const { blobs } = await postsStore.list();

    const posts = await Promise.all(
      blobs.map((b) => postsStore.get(b.key, { type: "json" }))
    );

    const cleaned = posts
      .filter((p: any) => p && p.status === "aprobado")
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    return new Response(JSON.stringify(cleaned), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error al cargar publicaciones." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/posts",
};
