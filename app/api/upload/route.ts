import { put } from "@vercel/blob";

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return Response.json({ error: "Content-Type inválido." }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const rawFile = formData.get("file");

    if (!(rawFile instanceof File)) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    if (rawFile.size === 0) {
      return Response.json({ error: "Archivo vacío." }, { status: 400 });
    }

    if (!rawFile.type.startsWith("image/")) {
      return Response.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
    }

    if (rawFile.size > MAX_IMAGE_SIZE_BYTES) {
      return Response.json(
        { error: "La imagen supera el máximo permitido (4MB)." },
        { status: 400 },
      );
    }

    const sanitizedName = rawFile.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const uniqueName = `pilotos/${Date.now()}-${crypto.randomUUID()}-${sanitizedName}`;

    const blob = await put(
      uniqueName,
      rawFile,
      {
        access: "public",
      },
    );

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Upload error" }, { status: 500 });
  }
}
