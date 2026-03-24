-- CreateTable
CREATE TABLE "PreCarrera" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pilotoId" INTEGER NOT NULL,
    "peso" REAL,
    "lastre" REAL,
    "kart" INTEGER,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PreCarrera_pilotoId_fkey" FOREIGN KEY ("pilotoId") REFERENCES "Piloto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PreCarrera_pilotoId_key" ON "PreCarrera"("pilotoId");
