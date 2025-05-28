import { Song } from "../songs/song.model"; // Asegúrate de que esta ruta sea correcta
import {Comment} from "../comment/comment.model";
export interface PostResponse {
  id: number;
  content: string;
  imageUrl?: string | null; // Es buena práctica usar | null si el backend puede enviar null
  song?: Song | null;       // También | null aquí
  user: {
    id: number;
    name: string;       // Asumo que este es el nombre completo o un display name
    nickname: string;   // Nickname/username
    profilePictureUrl?: string | null;
  };
  community?: { // Es opcional, pero en un feed de comunidad, probablemente siempre estará
    id: number;
    name: string;
  } | null;
  createdAt: string; // O Date
  voteCount: number;
  userVote: number; // -1, 0, 1
  commentsCount: number;
  isHighlighted?: boolean; // Para la UI
  isExpanded?: boolean;
  uiShowComments?: boolean;
  uiComments: Comment[];
  uiIsLoadingComments?: boolean;
  uiCommentsError?: string | null;
  // uiCommentForm?: FormGroup; // Esto se manejará en el TS del componente
  uiIsSubmittingComment?: boolean;
  uiSubmitCommentError?: string | null
}

// La interfaz Page<T> que te pasé antes sigue siendo válida y útil
export interface Page<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
