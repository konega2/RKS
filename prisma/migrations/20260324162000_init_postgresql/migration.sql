CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Piloto" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "apellidos" TEXT NOT NULL,
  "edad" INTEGER NOT NULL,
  "dni" TEXT NOT NULL,
  "socio" BOOLEAN NOT NULL,
  "entrenamiento" BOOLEAN NOT NULL,
  "dorsal" INTEGER,
  "foto" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Piloto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PreCarrera" (
  "id" SERIAL NOT NULL,
  "pilotoId" INTEGER NOT NULL,
  "peso" DOUBLE PRECISION,
  "lastre" DOUBLE PRECISION,
  "kart" INTEGER,
  "verificado" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PreCarrera_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PreCarrera_pilotoId_key" UNIQUE ("pilotoId")
);

CREATE TABLE IF NOT EXISTS "Vuelta" (
  "id" SERIAL NOT NULL,
  "pilotoId" INTEGER NOT NULL,
  "sesion" TEXT NOT NULL,
  "numero" INTEGER NOT NULL,
  "tiempo" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vuelta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Sancion" (
  "id" SERIAL NOT NULL,
  "pilotoId" INTEGER NOT NULL,
  "sesion" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "valor" DOUBLE PRECISION NOT NULL,
  "motivo" TEXT NOT NULL,
  "vuelta" INTEGER,
  CONSTRAINT "Sancion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResultadoCarrera" (
  "id" SERIAL NOT NULL,
  "pilotoId" INTEGER NOT NULL,
  "posicion" INTEGER NOT NULL,
  "puntos" INTEGER NOT NULL,
  CONSTRAINT "ResultadoCarrera_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Evento" (
  "id" SERIAL NOT NULL,
  "faseActual" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Fase" (
  "id" SERIAL NOT NULL,
  "nombre" TEXT NOT NULL,
  "hora" TEXT NOT NULL,
  CONSTRAINT "Fase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Anuncio" (
  "id" SERIAL NOT NULL,
  "mensaje" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Anuncio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Vuelta_sesion_pilotoId_idx" ON "Vuelta"("sesion", "pilotoId");
CREATE INDEX IF NOT EXISTS "Vuelta_sesion_numero_idx" ON "Vuelta"("sesion", "numero");
CREATE INDEX IF NOT EXISTS "Sancion_sesion_pilotoId_idx" ON "Sancion"("sesion", "pilotoId");
CREATE INDEX IF NOT EXISTS "ResultadoCarrera_posicion_idx" ON "ResultadoCarrera"("posicion");
CREATE INDEX IF NOT EXISTS "ResultadoCarrera_pilotoId_idx" ON "ResultadoCarrera"("pilotoId");
CREATE INDEX IF NOT EXISTS "Fase_nombre_idx" ON "Fase"("nombre");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PreCarrera_pilotoId_fkey'
  ) THEN
    ALTER TABLE "PreCarrera"
      ADD CONSTRAINT "PreCarrera_pilotoId_fkey"
      FOREIGN KEY ("pilotoId") REFERENCES "Piloto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Vuelta_pilotoId_fkey'
  ) THEN
    ALTER TABLE "Vuelta"
      ADD CONSTRAINT "Vuelta_pilotoId_fkey"
      FOREIGN KEY ("pilotoId") REFERENCES "Piloto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Sancion_pilotoId_fkey'
  ) THEN
    ALTER TABLE "Sancion"
      ADD CONSTRAINT "Sancion_pilotoId_fkey"
      FOREIGN KEY ("pilotoId") REFERENCES "Piloto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ResultadoCarrera_pilotoId_fkey'
  ) THEN
    ALTER TABLE "ResultadoCarrera"
      ADD CONSTRAINT "ResultadoCarrera_pilotoId_fkey"
      FOREIGN KEY ("pilotoId") REFERENCES "Piloto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
