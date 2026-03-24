-- CreateTable
CREATE TABLE "Evento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "faseActual" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "hora" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Anuncio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mensaje" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Fase_nombre_idx" ON "Fase"("nombre");
