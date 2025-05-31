import {SongBasic} from "./song-basic.model";
import {UserBasic} from "./user-basic.model";

export interface PlaylistRequest {
  name: string;
  description?: string;
  public: boolean; // <-- CAMBIADO de isPublic a public
  songIds?: number[];
}


export interface Playlist {
  id: number;
  name: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: string | null; // Ajustado por tu JSON de ejemplo que tenía null
  public: boolean; // <-- CAMBIADO de isPublic a public
  owner: UserBasic;
  songs: SongBasic[];
}
