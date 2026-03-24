import { NextResponse } from "next/server";

import { getPublicHomeSnapshot } from "@/lib/public-home";

export async function GET() {
  try {
    const snapshot = await getPublicHomeSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("/api/public/home failed", error);

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        eventTitle: "RKS Karting Event",
        circuito: "Chiva",
        faseActual: "registro",
        faseActualLabel: "Registro",
        estadoActual: "Registro",
        estadoResumen: "Entrenamiento · Por definir",
        siguienteFase: {
          nombre: "entrenamiento",
          label: "Entrenamiento",
          hora: "Por definir",
        },
        horarios: {
          registro: "",
          entrenamiento: "",
          qualy: "",
          carrera: "",
        },
        anuncios: [],
        anuncioDestacado: null,
        ultimoResultado: {
          sesion: "Última sesión",
          top3: [],
        },
        totalPilotos: 0,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
