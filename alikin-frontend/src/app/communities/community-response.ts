export interface CommunityResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  createdAt: string | null;
  leader: any | null;
  membersCount: number;
  userRole: string | null;
  radioPlaylist: any | null;
  member: boolean;
}
