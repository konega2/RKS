import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file", { status: 400 });
    }

    const blob = await put(
      `pilotos/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      }
    );

    return Response.json({ url: blob.url });
  } catch (error) {
    console.error(error);
    return new Response("Upload error", { status: 500 });
  }
}
