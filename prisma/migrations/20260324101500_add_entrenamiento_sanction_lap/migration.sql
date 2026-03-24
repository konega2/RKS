ALTER TABLE "Sancion" ADD COLUMN "vueltaNumero" INTEGER;

CREATE INDEX "Sancion_sesion_pilotoId_vueltaNumero_idx" ON "Sancion"("sesion", "pilotoId", "vueltaNumero");
