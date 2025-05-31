// src/app/playlist/models/playlist-basic.model.ts
/**
 * Representación muy básica de una playlist.
 * Corresponde a PlaylistBasicResponse del backend.
 * Útil para listas muy ligeras donde solo se necesita el nombre y la portada.
 */
export interface PlaylistBasic {
  id: number;
  name: string;
  coverImageUrl?: string; // Puede ser opcional
}
