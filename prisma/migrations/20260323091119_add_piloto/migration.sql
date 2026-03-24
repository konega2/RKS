-- CreateTable
CREATE TABLE "Piloto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "dni" TEXT NOT NULL,
    "socio" BOOLEAN NOT NULL,
    "entrenamiento" BOOLEAN NOT NULL,
    "dorsal" INTEGER,
    "foto" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
