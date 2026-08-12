import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("photo");
    const desc = (formData.get("desc") || "").toString().trim();
    const location = (formData.get("location") || "").toString().trim();

    if (!(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: "Falta la foto." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "El archivo debe ser una imagen." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (file.size > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "La imagen es muy pesada (max. 8 MB)." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!location) {
      return new Response(JSON.stringify({ error: "Falta el lugar donde se encontro." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const id = crypto.randomUUID();

    const imagesStore = getStore("images");
    const arrayBuffer = await file.arrayBuffer();
    await imagesStore.set(id, arrayBuffer, {
      metadata: { contentType: file.type },
    });

    const postsStore = getStore("posts");
    await postsStore.setJSON(id, {
      id,
      desc: desc.slice(0, 500),
      location: location.slice(0, 200),
      date: new Date().toISOString(),
      status: "pendiente",
    });

    return new Response(
      JSON.stringify({
        ok: true,
        id,
        message: "Gracias! Tu publicacion quedara visible apenas sea revisada.",
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Error al subir la foto." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/upload",
};
