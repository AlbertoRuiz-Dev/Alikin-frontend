export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  url: string;
  coverImageUrl?: string;
  duration: number;
}
