import {Song} from "../songs/song.model";

export interface PostResponse {
  id: number;
  content: string;
  imageUrl?: string;
  song?: Song
  user: {
    id: number;
    name: string;
    nickname: string;
    profilePictureUrl?: string;
  };
  community?: {
    id: number;
    name: string;
  };
  createdAt: string;
  voteCount: number;
  userVote: number;
  commentsCount: number;
  isHighlighted?: boolean;
  isExpanded?: boolean;
}
