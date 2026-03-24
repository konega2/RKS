-- CreateTable
CREATE TABLE "Vuelta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pilotoId" INTEGER NOT NULL,
    "sesion" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tiempo" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vuelta_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "Piloto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sancion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pilotoId" INTEGER NOT NULL,
    "sesion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "motivo" TEXT NOT NULL,
    CONSTRAINT "Sancion_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "Piloto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Vuelta_sesion_pilotoId_idx" ON "Vuelta"("sesion", "pilotoId");

-- CreateIndex
CREATE INDEX "Vuelta_sesion_numero_idx" ON "Vuelta"("sesion", "numero");

-- CreateIndex
CREATE INDEX "Sancion_sesion_pilotoId_idx" ON "Sancion"("sesion", "pilotoId");
