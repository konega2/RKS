-- CreateTable
CREATE TABLE "ResultadoCarrera" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pilotoId" INTEGER NOT NULL,
    "posicion" INTEGER NOT NULL,
    "puntos" INTEGER NOT NULL,
    CONSTRAINT "ResultadoCarrera_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "Piloto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ResultadoCarrera_posicion_idx" ON "ResultadoCarrera"("posicion");

-- CreateIndex
CREATE INDEX "ResultadoCarrera_pilotoId_idx" ON "ResultadoCarrera"("pilotoId");
