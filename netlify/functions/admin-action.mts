import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const password = req.headers.get("x-admin-password") || "";

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { id, action } = body as { id: string; action: "aprobar" | "rechazar" };

    if (!id || !["aprobar", "rechazar"].includes(action)) {
      return new Response(JSON.stringify({ error: "Solicitud invalida." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const postsStore = getStore("posts");
    const post = await postsStore.get(id, { type: "json" });

    if (!post) {
      return new Response(JSON.stringify({ error: "Publicacion no encontrada." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (action === "aprobar") {
      await postsStore.setJSON(id, { ...post, status: "aprobado" });
    } else {
      const imagesStore = getStore("images");
      await postsStore.delete(id);
      await imagesStore.delete(id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error al procesar la accion." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/admin/action",
};
