export interface SongBasic {
  id: number;
  title: string;
  artist: string;
  coverImageUrl?: string; // Puede ser opcional
  duration: number; // En segundos o milisegundos, según lo envíe el backend
}
