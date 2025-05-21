export interface Community {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  createdAt: string | null;
  leader: any; // puedes crear un modelo User si quieres tiparlo mejor
  membersCount: number;
  userRole: string | null;
  radioPlaylist: any; // puedes crear un modelo Playlist si quieres tiparlo mejor
  member: boolean;
}
