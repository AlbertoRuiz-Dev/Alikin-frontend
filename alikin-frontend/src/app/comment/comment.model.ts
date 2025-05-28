
export interface UserBasic {
  id: number;
  name: string;
  nickname: string | null;
  profilePictureUrl?: string | null;
}

export interface Comment {
  id: number;
  content: string;
  user: UserBasic;
  createdAt: string; // O Date, si prefieres convertirla
}

export interface CommentRequest {
  content: string;
}
