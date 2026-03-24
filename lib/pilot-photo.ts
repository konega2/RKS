export function resolvePilotPhotoSrc(foto?: string | null) {
  if (!foto) {
    return null;
  }

  if (foto.startsWith("http://") || foto.startsWith("https://")) {
    return foto;
  }

  return `/uploads/${foto}`;
}
