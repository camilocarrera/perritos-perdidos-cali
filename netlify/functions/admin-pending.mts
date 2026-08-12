import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const password = req.headers.get("x-admin-password") || "";

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const postsStore = getStore("posts");
    const { blobs } = await postsStore.list();

    const posts = await Promise.all(
      blobs.map((b) => postsStore.get(b.key, { type: "json" }))
    );

    const pendientes = posts
      .filter((p: any) => p && p.status === "pendiente")
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    return new Response(JSON.stringify(pendientes), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error al cargar pendientes." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/admin/pending",
};
